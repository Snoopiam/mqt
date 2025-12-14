# MQT App Remodel Plan: Stable Diffusion → Google Gemini API

## Executive Summary

This document outlines the complete remodel of MQT from a Stable Diffusion + ControlNet-based architectural rendering app to a streamlined Google Gemini API-powered application. The goal is to strip out all SD/SDXL/ControlNet complexity and leverage Gemini's multimodal capabilities for a simpler, faster, more cost-effective solution.

---

## Part 1: Current State Analysis

### What MQT Currently Does

MQT transforms 2D architectural floor plans into photorealistic 3D visualizations using:

- **Stable Diffusion v1.5** (1.5B parameter diffusion model)
- **ControlNet MLSD** (Mobile Line Segment Detection for geometry preservation)
- **20+ Curated Style Presets** with "forensic DNA" (lighting, materials, palettes)

### Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React 19 + Framer Motion + Glassmorphism UI                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ Hero.jsx │ │Uploader  │ │Controls  │ │ SplitView    │   │
│  │          │ │.jsx      │ │.jsx      │ │ .jsx         │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
│                        │                                     │
│                        ▼                                     │
│              ┌─────────────────┐                            │
│              │   api.js        │                            │
│              │ (REST Client)   │                            │
│              └────────┬────────┘                            │
└───────────────────────│─────────────────────────────────────┘
                        │ POST /api/generate
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│  FastAPI + Python 3.10 + CUDA                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    main.py                           │   │
│  │  ┌─────────────────┐  ┌─────────────────────────┐   │   │
│  │  │ StableDiffusion │  │ ControlNet MLSD         │   │   │
│  │  │ v1.5 Pipeline   │  │ (Line Segment Detection)│   │   │
│  │  │ (5GB+ model)    │  │ (2GB+ model)            │   │   │
│  │  └─────────────────┘  └─────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Pain Points

1. **Infrastructure**: Requires GPU (4-8GB VRAM), 7GB+ model downloads
2. **Cost**: Cloud Run with GPU = expensive ($0.20-0.50 per generation)
3. **Speed**: 20-180 seconds per generation
4. **Complexity**: Diffusion pipeline, ControlNet, xformers, CUDA dependencies
5. **Maintenance**: Model version management, weight updates, scheduler tuning

---

## Part 2: What to DELETE (Stable Diffusion Components)

### Backend Files - COMPLETE DELETION

| File                    | Lines             | Action  | Reason                                 |
| ----------------------- | ----------------- | ------- | -------------------------------------- |
| `main.py` lines 1-16    | Imports           | DELETE  | PyTorch, diffusers, ControlNet imports |
| `main.py` lines 33-77   | Model Loading     | DELETE  | StableDiffusionControlNetPipeline      |
| `main.py` lines 185-251 | Generate Endpoint | REWRITE | Replace with Gemini API call           |
| `config.py` lines 71-72 | Model Paths       | DELETE  | SD_MODEL, CONTROLNET_MODEL             |

### Python Dependencies - COMPLETE REMOVAL

```txt
# DELETE FROM requirements.txt:
--extra-index-url https://download.pytorch.org/whl/cu118
torch
xformers
diffusers
transformers
accelerate
scipy
safetensors
opencv-python-headless  # May keep if image preprocessing needed
```

### Frontend Files - MODIFICATION REQUIRED

| File                          | Lines | Action         | Reason                              |
| ----------------------------- | ----- | -------------- | ----------------------------------- |
| `src/services/api.js`         | 60-82 | REWRITE        | Remove forensic prompt construction |
| `src/data/style_prompts.json` | ALL   | DELETE/REPLACE | Architectural "DNA" obsolete        |
| `src/components/Controls.jsx` | 16-32 | REWRITE        | Remove engine mapping               |

### Docker - SIMPLIFICATION

```dockerfile
# REMOVE from Dockerfile:
- libgl1, libglib2.0-0  # OpenCV dependencies
- 5GB+ model download logic
- CUDA base image requirements
```

### Config Cleanup

```python
# DELETE from config.py:
CONTROLNET_MODEL
SD_MODEL
MODEL_CACHE_DIR
DEFAULT_INFERENCE_STEPS
DEFAULT_GUIDANCE_SCALE
MAX_IMAGE_SIZE  # Keep if using for validation
```

---

## Part 3: What to KEEP (Reusable Components)

### Frontend Components (100% Reusable)

| Component       | Lines | Value                       | Adaptation Needed    |
| --------------- | ----- | --------------------------- | -------------------- |
| `SplitView.jsx` | 183   | Spring physics comparison   | None - generic       |
| `Hero.jsx`      | 123   | Landing page template       | Update copy/branding |
| `Uploader.jsx`  | 147   | Drag-drop upload            | None - generic       |
| `Layout.jsx`    | 75    | Header + container          | None - generic       |
| `index.css`     | 98    | Glassmorphism design system | None - generic       |

### Frontend Libraries (Keep All)

```json
{
  "react": "^19.2.0", // Latest React
  "react-dom": "^19.2.0",
  "framer-motion": "^12.23.25", // Animations
  "lucide-react": "^0.556.0", // Icons
  "clsx": "^2.1.1", // Class utilities
  "tailwind-merge": "^3.4.0" // Tailwind utilities
}
```

### Backend Architecture (Reusable with Modification)

| Component           | Keep | Modify                 |
| ------------------- | ---- | ---------------------- |
| FastAPI scaffold    | Yes  | -                      |
| Lifespan pattern    | Yes  | For Gemini client init |
| CORS configuration  | Yes  | -                      |
| Health endpoint     | Yes  | -                      |
| Static file serving | Yes  | -                      |
| Error handling      | Yes  | -                      |

---

## Part 4: New Architecture with Google Gemini API

### Target Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React 19 + Framer Motion + Glassmorphism UI                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ Hero.jsx │ │Uploader  │ │Controls  │ │ SplitView    │   │
│  │(Reused)  │ │.jsx      │ │.jsx      │ │ .jsx         │   │
│  │          │ │(Reused)  │ │(REWRITE) │ │ (Reused)     │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
│                        │                                     │
│                        ▼                                     │
│              ┌─────────────────┐                            │
│              │   api.js        │                            │
│              │ (SIMPLIFIED)    │                            │
│              └────────┬────────┘                            │
└───────────────────────│─────────────────────────────────────┘
                        │ POST /api/generate
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│  FastAPI + Python 3.10 (NO GPU REQUIRED)                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    main.py                           │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │        Google Gemini API Client             │    │   │
│  │  │  - gemini-2.0-flash-exp (multimodal)       │    │   │
│  │  │  - Imagen 3 (image generation)              │    │   │
│  │  │  - OR Gemini Vision (image understanding)   │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Gemini API Options

#### Option A: Gemini + Imagen 3 (Recommended for Image Generation)

```python
import google.generativeai as genai

# Initialize
genai.configure(api_key=os.environ["GEMINI_API_KEY"])

# Image Generation with Imagen 3
imagen = genai.ImageGenerationModel("imagen-3.0-generate-001")
result = imagen.generate_images(
    prompt="Modern architectural visualization of floor plan...",
    number_of_images=1,
    aspect_ratio="1:1",
    safety_filter_level="block_few",
)
```

#### Option B: Gemini Vision (Image Understanding + Description)

```python
import google.generativeai as genai

# Initialize
genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model = genai.GenerativeModel("gemini-2.0-flash-exp")

# Analyze floor plan
response = model.generate_content([
    "Analyze this architectural floor plan and describe...",
    image_data
])
```

#### Option C: Gemini + Third-Party Image Gen (Replicate, etc.)

- Use Gemini for understanding/prompt generation
- Call Replicate API or similar for actual image generation

### Recommended Approach: Option A with Fallback

1. **Primary**: Use Imagen 3 for direct image generation
2. **Fallback**: If Imagen 3 unavailable in region, use Gemini Vision for analysis + external image gen

---

## Part 5: New Feature Set

### Core Features (Redesigned)

| Feature          | Old (SD/ControlNet)  | New (Gemini)                                   |
| ---------------- | -------------------- | ---------------------------------------------- |
| Image Analysis   | ControlNet MLSD      | Gemini Vision multimodal                       |
| Style Selection  | 20 hardcoded presets | Dynamic prompt builder OR LLM-suggested styles |
| Image Generation | SD v1.5 (20-180s)    | Imagen 3 (~5-15s)                              |
| Generation Cost  | $0.20-0.50/gen       | ~$0.003-0.02/gen                               |
| GPU Required     | Yes (4-8GB VRAM)     | No                                             |

### New Capabilities Enabled by Gemini

1. **Natural Language Prompts**: User can describe desired style in plain English
2. **Image Understanding**: Gemini can analyze uploaded image and suggest transformations
3. **Multi-Turn Conversations**: Chat-based refinement of results
4. **Faster Iteration**: 10x faster generation, cheaper experimentation
5. **Code Generation**: Gemini can generate SVG, CSS, or code-based visualizations

### User vs. Developer Profiles

The application will feature two distinct modes of operation to serve different user needs:

#### 1. User Profile (The Client)

- **Goal:** Simple, error-free generation.
- **Interface:** Clean, minimal "Apple-like" UI.
- **Capabilities:**
  - Upload Floor Plan.
  - Select from Curated Presets (e.g., "Molten Copper", "Minimalist").
  - "Generate" Button.
  - Download High-Res Result.
- **Constraints:** Cannot tamper with prompts or negative prompts. Safe mode only.

#### 2. Developer Profile (The Architect/Creator)

- **Goal:** Deep control, style creation, and debugging.
- **Interface:** Advanced dashboard with "Under the Hood" access.
- **Capabilities:**
  - **Style Extractor Persona:** Upload a _Reference Image_ to extract its "Visual DNA" and auto-generate a new Style Preset.
    - **THE GOLDEN RULE:** "Extract Style, Don't Copy Content."
    - **Strict Adherence:** Enhance only what exists in the user's layout (walls, furniture) with the extracted style (gradients, materials).
    - **No Hallucinations:** Do not add elements (cars, vegetation) just because they were in the reference style.
    - **Adaptive Imagination:** If the user's layout _does_ have elements (e.g., a car) that were missing from the reference, _imagine_ and render them matching the extracted style.
  - **Prompt Engineering:** Edit raw system instructions, positive/negative prompts.
  - **Persona Injection:** Define specific "Agents" (e.g., "Maquette Artist", "Technical Drafter") to drive the generation.
  - **Debug View:** See raw API requests/responses, token usage, and latency metrics.

### Simplified Style System (User Mode)

Instead of 20 hardcoded architectural presets, offer:

- **Free-form text input** for style description
- **Quick style chips**: "Minimalist", "Photorealistic", "Blueprint", "Watercolor", "3D Render"
- **LLM-assisted refinement**: Gemini suggests improvements to user prompts

---

## Part 6: Implementation Phases

### Phase 1: Strip & Clean (Day 1)

- [ ] Remove all SD/ControlNet code from `main.py`
- [ ] Remove unused Python dependencies from `requirements.txt`
- [ ] Delete `style_prompts.json`
- [ ] Simplify `Controls.jsx` to basic style selector
- [ ] Update `api.js` to simplified request format
- [ ] Update Docker to lightweight Python image

### Phase 2: Gemini Integration (Day 2-3)

- [ ] Add `google-generativeai` to requirements
- [ ] Create new `/api/generate` endpoint using Gemini/Imagen
- [ ] Implement error handling for API limits/quotas
- [ ] Add streaming support (optional)
- [ ] Test end-to-end flow

### Phase 3: UI Polish (Day 4)

- [ ] Update Hero copy for new capabilities
- [ ] Redesign Controls for text-based prompting
- [ ] Add loading states/animations
- [ ] Implement result history (optional)

### Phase 4: Testing & Deployment (Day 5)

- [ ] Test on Cloud Run (CPU-only)
- [ ] Update deployment documentation
- [ ] Performance testing
- [ ] Cost analysis validation

---

## Part 7: New Requirements

### Python Dependencies (New)

```txt
# requirements.txt (SIMPLIFIED)
fastapi
uvicorn[standard]
python-multipart
pydantic
python-dotenv
pillow
google-generativeai>=0.8.0
httpx  # For async HTTP if needed
```

### Environment Variables (New)

```bash
# .env
GEMINI_API_KEY=your_api_key_here
VITE_API_URL=http://localhost:8080/api/generate
VITE_USE_MOCK=false

# Optional
GEMINI_MODEL=gemini-2.0-flash-exp
IMAGEN_MODEL=imagen-3.0-generate-001
```

### API Contract (New)

#### Request

```json
POST /api/generate
{
  "image": "base64_encoded_image",
  "prompt": "Transform this floor plan into a modern minimalist 3D render",
  "style": "photorealistic",  // optional quick style
  "aspect_ratio": "1:1"       // optional
}
```

#### Response

```json
{
  "success": true,
  "image": "base64_encoded_result",
  "metadata": {
    "model": "imagen-3.0-generate-001",
    "prompt_used": "...",
    "generation_time_ms": 5234
  }
}
```

---

## Part 8: Risk Assessment

### Risks & Mitigations

| Risk                   | Impact | Mitigation                               |
| ---------------------- | ------ | ---------------------------------------- |
| Imagen 3 not available | High   | Fallback to Gemini Vision + external gen |
| API rate limits        | Medium | Implement queuing, caching               |
| Quality difference     | Medium | Test extensively, tune prompts           |
| Cost overrun           | Low    | Add usage tracking, quotas               |
| Regional availability  | Medium | Check Gemini API availability by region  |

### Unknowns to Resolve

1. Does Imagen 3 support image-to-image (conditioning)?
2. What's the max resolution for Imagen 3 output?
3. Can Gemini understand floor plans effectively?
4. What's the actual latency for production workloads?

---

## Part 9: Success Metrics

| Metric              | Old (SD)   | Target (Gemini) |
| ------------------- | ---------- | --------------- |
| Generation Time     | 20-180s    | <15s            |
| Cost per Generation | $0.20-0.50 | <$0.05          |
| GPU Required        | Yes        | No              |
| Model Download      | 7GB        | 0GB             |
| Cold Start          | 60-120s    | <5s             |
| Codebase Complexity | ~2,400 LOC | <1,500 LOC      |

---

## Part 10: File Inventory

### Files to DELETE

```
main.py (lines 1-77, 185-251)  # Rewrite, don't delete file
config.py (lines 71-72)
src/data/style_prompts.json
scripts/analyze_presets.js  # Optional, architectural analysis tool
Preset Style Reference/  # Folder with reference images
```

### Files to MODIFY

```
main.py          → Complete rewrite for Gemini
config.py        → Remove SD config, add Gemini config
api.js           → Simplify request format
Controls.jsx     → Replace forensic DNA with text prompt
requirements.txt → Strip SD deps, add Gemini
Dockerfile       → Simplify (no GPU, no OpenCV)
.env.example     → Update for Gemini vars
README.md        → Update documentation
DEPLOYMENT.md    → Update for CPU-only deployment
```

### Files to KEEP (No Changes)

```
src/App.jsx
src/main.jsx
src/index.css
src/components/Layout.jsx
src/components/Hero.jsx  (minor copy update)
src/components/Uploader.jsx
src/components/SplitView.jsx
vite.config.js
package.json
index.html
.gitignore
```

---

## Appendix A: Migration Checklist

### Pre-Migration

- [ ] Backup current working state
- [ ] Document any customizations
- [ ] Obtain Gemini API key
- [ ] Test Gemini API access

### During Migration

- [ ] Phase 1 complete
- [ ] Phase 2 complete
- [ ] Phase 3 complete
- [ ] Phase 4 complete

### Post-Migration

- [ ] All tests passing
- [ ] Documentation updated
- [ ] Old deployment cleaned up
- [ ] Cost monitoring in place

---

## Appendix B: Quick Reference Commands

```bash
# Install new Python deps
pip install google-generativeai pillow httpx

# Test Gemini API
python -c "import google.generativeai as genai; genai.configure(api_key='KEY'); print(genai.list_models())"

# Run dev server
cd C:\SnoopLabs\Labs\MQT
npm run dev  # Frontend
uvicorn main:app --reload --port 8080  # Backend

# Build for production
npm run build
docker build -t mqt-gemini .
```

---

_Document Version: 1.0_
_Created: December 10, 2025_
_Author: Claude Code Analysis_
