
import os
import base64
import io
import time
import logging
import cv2
import numpy as np
import torch
from fastapi import FastAPI, UploadFile, HTTPException, Body
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
from diffusers import StableDiffusionControlNetPipeline, ControlNetModel, UniPCMultistepScheduler
from PIL import Image

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mqt-backend")

app = FastAPI()

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Model Variable
pipe = None
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
logger.info(f"Using device: {DEVICE}")

def load_model():
    global pipe
    if pipe is not None:
        return

    logger.info("Loading Stable Diffusion ControlNet Pipeline...")
    try:
        controlnet = ControlNetModel.from_pretrained(
            "lllyasviel/sd-controlnet-mlsd", 
            torch_dtype=torch.float16 if DEVICE == "cuda" else torch.float32
        )
        pipe = StableDiffusionControlNetPipeline.from_pretrained(
            "runwayml/stable-diffusion-v1-5", 
            controlnet=controlnet, 
            torch_dtype=torch.float16 if DEVICE == "cuda" else torch.float32,
            safety_checker=None # Disabled for speed/architectural freedom, enable in prod if needed
        )
        pipe.scheduler = UniPCMultistepScheduler.from_config(pipe.scheduler.config)

        if DEVICE == "cuda":
            pipe.enable_model_cpu_offload() # Saves VRAM by offloading components not in use
            pipe.enable_xformers_memory_efficient_attention()
        
        pipe.to(DEVICE)
        logger.info("Model loaded successfully.")
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        # We don't exit here so the server can still start for static files even if model fails
        # but API calls will fail.

# Pydantic Models
class GenerationRequest(BaseModel):
    image: str # Base64
    prompt: str
    negative_prompt: Optional[str] = ""
    controlnet: Optional[Dict[str, Any]] = None
    forensics: Optional[Dict[str, Any]] = None

@app.on_event("startup")
async def startup_event():
    # Load model on startup to avoid cold-start penalty on first request
    # Note: On Cloud Run, this might take time and eat into startup limits.
    # Ideally, bake model into image or load lazily. For now, lazy loading logic in global scope + manual trigger here.
    # To keep container lean, we download on start.
    load_model()

@app.get("/health")
def health_check():
    return {"status": "ok", "device": DEVICE, "model_loaded": pipe is not None}

@app.post("/api/generate")
async def generate_image(req: GenerationRequest):
    if pipe is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        # Decode Image
        image_data = base64.b64decode(req.image.split(",")[-1]) # Remove data:image/png;base64 header if present
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        
        # Preprocess for MLSD (ControlNet needs specific input)
        # MLSD expects an image where lines are strictly detected.
        # Ideally, we pass the raw image and let ControlNet preprocessor handle it, 
        # OR we pre-process it here if we want to visualize the map.
        # For simplicity with the standard pipeline, we pass the image directly since the pipeline handles it 
        # IF we had the preprocessor loaded. However, `StableDiffusionControlNetPipeline` takes the conditioning image.
        # Standard practice: Pass the original image to a preprocessor first. 
        # Since we use `lllyasviel/sd-controlnet-mlsd`, we should ideally run MLSD detector.
        # For this MVP, we assume the input image IS the floorplan line drawing or we rely on the model's tolerance.
        # To be robust, let's implement a quick OpenCV MLSD extraction if needed, 
        # BUT for standard ControlNet workflows, passing the raw floorplan (black lines on white) usually works well for MLSD.
        
        # Generation
        logger.info("Starting generation...")
        start_time = time.time()
        
        output = pipe(
            req.prompt,
            image=image, # The control image
            negative_prompt=req.negative_prompt,
            num_inference_steps=20, # Fast generation
            guidance_scale=7.5,
            controlnet_conditioning_scale=req.controlnet.get('weight', 1.0) if req.controlnet else 1.0
        ).images[0]
        
        duration = time.time() - start_time
        logger.info(f"Generation complete in {duration:.2f}s")
        
        # Encode Response
        buffered = io.BytesIO()
        output.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        
        return {
            "status": "success",
            "image": f"data:image/png;base64,{img_str}",
            "meta": {
                "processing_time":  round(duration * 1000)
            }
        }

    except Exception as e:
        logger.error(f"Generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Static Files (Must be last)
# Check if dist exists (it should in Docker)
if os.path.exists("dist"):
    app.mount("/", StaticFiles(directory="dist", html=True), name="static")

# If running locally without dist (dev mode), this won't mount, allowing pure API testing.
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
