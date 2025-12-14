# MQT Gemini Transformation - Implementation Plan

## Executive Summary

Transform MQT from Stable Diffusion/ControlNet to Gemini-powered architecture while **preserving the entire frontend**. Backend-only transformation maintaining API contract compatibility.

---

## Critical Constraints

> [!IMPORTANT] > **Frontend remains completely unchanged**. All React components, UI, styling, and interactions stay as-is. Only backend transformation occurs.

---

## Proposed Changes

### Backend Core (`main.py`)

#### [MODIFY] [main.py](file:///c:/SnoopLabs/Labs/MQT/main.py)

**Remove (Lines 1-84):**

- All SD/ControlNet imports (`torch`, `diffusers`, `cv2`)
- `load_model()` function
- Global `pipe` variable
- GPU/CUDA device detection

**Add:**

- Google Generative AI SDK import
- Gemini client initialization in lifespan
- Image analysis using Gemini Vision
- Generation using Imagen 3 (or Gemini-based image gen)

**Modify `/api/generate` endpoint (Lines 327-429):**

- Replace SD pipeline call with Gemini API
- Maintain exact response format for frontend compatibility
- Keep style preset integration from `styles.py`
- Preserve all metadata structure

**Add new endpoint `/api/learn-preset`:**

- Allow DEV to upload reference image
- Analyze with Gemini Vision to extract style DNA
- Generate preset JSON configuration
- Save to `styles.py` or style database

---

### Configuration (`config.py`)

#### [MODIFY] [config.py](file:///c:/SnoopLabs/Labs/MQT/config.py)

**Remove (Lines 64-72):**

```python
DEFAULT_INFERENCE_STEPS
DEFAULT_GUIDANCE_SCALE
CONTROLNET_MODEL
SD_MODEL
```

**Add:**

```python
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")
IMAGEN_MODEL: str = os.getenv("IMAGEN_MODEL", "imagen-3.0-generate-001")
USE_GEMINI_VISION: bool = os.getenv("USE_GEMINI_VISION", "true").lower() == "true"
```

**Remove (Lines 74-90):**

- `setup_huggingface_cache()`
- `setup_huggingface_auth()`

---

### Dependencies (`requirements.txt`)

#### [MODIFY] [requirements.txt](file:///c:/SnoopLabs/Labs/MQT/requirements.txt)

**Remove:**

```txt
torch
xformers
diffusers
transformers
accelerate
scipy
safetensors
```

**Add:**

```txt
google-generativeai>=0.8.0
httpx>=0.27.0
```

**Keep:**

```txt
fastapi
uvicorn[standard]
python-multipart
pydantic
python-dotenv
pillow
```

---

### Environment Configuration (`.env.example`)

#### [MODIFY] [.env.example](file:///c:/SnoopLabs/Labs/MQT/.env.example)

**Add:**

```bash
# Google Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp
IMAGEN_MODEL=imagen-3.0-generate-001
USE_GEMINI_VISION=true

# Model Tier Selection
MODEL_TIER=FREE  # FREE | MID | PREMIUM

# Profile Configuration (Future)
APP_PROFILE=USER  # USER | DEV
```

**Remove:**

```bash
HF_TOKEN=...
DEVICE=...
DEFAULT_INFERENCE_STEPS=...
DEFAULT_GUIDANCE_SCALE=...
```

---

### Docker Configuration (`Dockerfile`)

#### [MODIFY] [Dockerfile](file:///c:/SnoopLabs/Labs/MQT/Dockerfile)

**Change base image:**

```dockerfile
FROM python:3.10-slim
# Remove CUDA base image
```

**Remove:**

- OpenCV system dependencies
- Model download steps
- GPU-related configurations

---

## Technical Architecture

### New Backend Flow

```
┌─────────────────────────────────────────┐
│  Frontend (UNCHANGED)                    │
│  POST /api/generate                      │
│  { image, prompt, style_id }             │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  FastAPI Backend (MODIFIED)              │
│  ┌────────────────────────────────────┐  │
│  │ /api/generate endpoint             │  │
│  │ 1. Decode base64 image             │  │
│  │ 2. Load style preset (if provided) │  │
│  │ 3. Build enhanced prompt           │  │
│  │ 4. Call Gemini API                 │  │
│  │ 5. Return base64 result            │  │
│  └────────────────────────────────────┘  │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Google Gemini API                       │
│  ┌──────────────┐  ┌─────────────────┐  │
│  │ Gemini Vision│  │   Imagen 3      │  │
│  │ (Analyze)    │  │ (Generate)      │  │
│  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────┘
```

### API Contract (PRESERVED)

**Request (No Change):**

```json
{
  "image": "base64_encoded_image",
  "prompt": "user prompt",
  "style_id": "emerald_eco",
  "room_type": "living_room"
}
```

**Response (No Change):**

```json
{
  "status": "success",
  "image": "data:image/png;base64,...",
  "meta": {
    "processing_time": 5234,
    "device": "gemini-api",
    "prompt_used": "...",
    "style": {...}
  }
}
```

---

## Preset Learning System (DEV Mode Only)

> [!IMPORTANT] > **DEV Exclusive:** This endpoint is only accessible when `APP_PROFILE=DEV`. Hidden from standard users.

### New Endpoint: `/api/learn-preset`

**Purpose:** Allow DEV to add new style presets by uploading reference images

**Request:**

```json
POST /api/learn-preset
{
  "reference_image": "base64_encoded_image",
  "preset_name": "cyberpunk_loft",
  "category": "futuristic"
}
```

**Process:**

1. Use Gemini Vision to analyze reference image
2. Extract style characteristics:
   - Color palette (dominant colors)
   - Lighting mood (warm/cool, bright/moody)
   - Material signatures (concrete, glass, wood)
   - Architectural style descriptors
3. Generate prompt template
4. Save to `styles.py` or JSON database

**Response:**

```json
{
  "status": "success",
  "preset": {
    "id": "cyberpunk_loft",
    "name": "Cyberpunk Loft",
    "category": "futuristic",
    "prompt_template": "...",
    "color_palette": ["#1a1a2e", "#16213e", "#0f3460"],
    "forensics": {...}
  }
}
```

---

## Multi-Tier Model Support

> [!TIP] > **Flexible Deployment:** MQT supports 3 Gemini tiers (FREE, MID, PREMIUM) to accommodate different budgets and quality needs.

### Tier Overview

| Tier        | Cost/Image         | Quality   | Use Case                |
| ----------- | ------------------ | --------- | ----------------------- |
| **FREE**    | $0 (100/day limit) | Good      | Development, testing    |
| **MID**     | $0.0002            | Very Good | Production, high volume |
| **PREMIUM** | $0.032             | Excellent | Client deliverables     |

**See [model_tiers.md](file:///C:/Users/Book5/.gemini/antigravity/brain/f48b6117-1d51-401a-9499-648055a343a8/model_tiers.md) for complete configuration details.**

### Implementation Strategy

1. **Default to FREE tier** for development
2. **Auto-detect available models** based on API key
3. **Allow manual tier selection** via environment variable
4. **Track usage** for free tier compliance

```python
# Environment configuration
MODEL_TIER=FREE  # or MID or PREMIUM
```

---

## User Profiles (Future Implementation)

> [!NOTE] > **Architecture Planning:** Profile system designed but not implemented in Phase 1. Backend endpoints ready for future frontend integration.

### Profile Types

| Profile  | Access   | Features                          | Use Case                       |
| -------- | -------- | --------------------------------- | ------------------------------ |
| **USER** | Standard | Upload, generate, download        | End users, clients             |
| **DEV**  | Extended | USER features + preset management | Administrators, style curation |

### DEV Mode Capabilities

**Exclusive Features:**

- Access to `/api/learn-preset` endpoint
- Upload reference architectural images
- AI-powered style DNA extraction (Gemini Vision)
- Create/edit/delete custom presets
- Manage preset categories and tags

**Implementation Approach:**

```python
# Future: Environment-based profile (no auth system needed initially)
APP_PROFILE=USER  # or DEV
```

**DEV Mode UI (Future):**

- "Add Preset" button in Controls sidebar
- Reference image upload dialog
- Auto-extracted style characteristics preview
- Preset configuration editor
- Save to preset library

**USER Mode UI (Current + Enhanced):**

#### Core Features

1. **Upload Floor Plans**

   - Formats: PNG, JPG, WEBP, **PDF** (NEW)
   - PDF support: Extract floor plan image using Gemini API
   - Multi-page PDF: User selects page or auto-detect floor plan page
   - Drag-drop interface (existing)
   - Max size: 10MB

2. **Select Style Presets**

   - Browse preset gallery (existing)
   - Quick-select from curated styles
   - Preview style characteristics

3. **Generate Visualization**

   - Click "Generate" button
   - Real-time progress indicator
   - Estimated time display

4. **Compare Original vs Styled Version** ✅

   - **Split-view comparison** (EXISTING in SplitView.jsx!)
   - Interactive slider to compare before/after
   - Synchronized zoom and pan
   - Spring physics animation
   - 1x-5x zoom capability

5. **Refine Further** (NEW - Iterative Enhancement)

   - **Default:** Intensity slider (simple refinement control)
     - Adjust style strength: Less intense ↔ More intense
     - Quick, intuitive refinement
   - **Advanced (MORE menu):** Additional options
     - Text prompt refinement
     - Style preset swap
     - Lighting adjustments
     - Detail control
     - Material customization
   - Uses previous generation as reference (Gemini multi-turn)
   - Preserves generation history (last 3 iterations)

6. **Download Results**
   - **Multi-format export:**
     - PNG (full quality, default)
     - JPG (compressed, smaller size)
     - WEBP (modern, efficient)
     - **SVG (vectorized)** - via post-processing with AI vectorizer API
   - **Quality settings:**
     - Standard (1024x1024)
     - High (2048x2048) - Premium tier only
     - Ultra (4K) - Gemini 3 Pro only
   - Filename: `mqt-render-{style}-{timestamp}.{format}`

### Architecture Support

**Backend (Phase 1):**

- ✅ `/api/generate` - Available to both profiles
- ✅ `/api/learn-preset` - DEV only (controlled by env var)
- ✅ `/api/styles` - Available to both profiles

**Frontend (Future Phase):**

- Conditional rendering based on profile
- DEV tools hidden for USER profile
- No authentication required (environment-based)

```javascript
// Future frontend code
const isDev = import.meta.env.VITE_APP_PROFILE === 'DEV';

return (
  <>
    <Controls presets={presets} />
    {isDev && <PresetManager />} {/* DEV only */}
  </>
);
```

---

## Gemini API Strategy

> [!NOTE] > **Research Validated:** Gemini Vision API confirmed to support floor plan → 3D visualization transformations natively (Feb 2025)

### Recommended Approach: Gemini 2.0 Flash + Imagen 3

**Model Selection:**

- **Gemini 2.0 Flash Exp** for image analysis (fast, cost-effective)
- **Imagen 3** for image generation ($0.03/image as of Feb 2025)
- Alternative: **Gemini 3 Pro Image Preview** for sophisticated multi-turn editing (4K support, up to 14 reference images)

**Technical Flow:**

1. **Upload Floor Plan** → Gemini Vision API

   ```python
   # Analyze floor plan with Gemini Vision
   model = genai.GenerativeModel("gemini-2.0-flash-exp")
   response = model.generate_content([
       floor_plan_image,
       "Analyze this floor plan: identify room types, dimensions, layout structure"
   ])
   ```

2. **Extract Structure** → Get room types, spatial layout
3. **Combine with Style Preset** → Build enhanced prompt

   ```python
   # Merge AI understanding + style preset
   final_prompt = f"{gemini_analysis} {style_preset_template}"
   ```

4. **Generate with Imagen 3**
   ```python
   imagen = genai.ImageGenerationModel("imagen-3.0-generate-001")
   result = imagen.generate_images(
       prompt=final_prompt,
       number_of_images=1,
       aspect_ratio="1:1"
   )
   ```

**Confirmed Capabilities:**

- ✅ 2D floor plan → 3D interior visualization
- ✅ Eye-level perspective rendering
- ✅ Style-based transformations (modern, minimalist, industrial, etc.)
- ✅ Material specification (concrete, wood, glass)
- ✅ Lighting customization (warm/cool, bright/moody)
- ✅ Multi-modal understanding (image + text prompts)
- ✅ SynthID watermarking (AI-generated identification)

### Alternative: Gemini 3 Pro Image (Advanced Features)

For future enhancements:

- Multi-turn image editing
- Up to 14 reference images simultaneously
- 4K resolution output
- Grounding with Google Search for accuracy
- Character consistency across generations

**Pricing:**

- Gemini 2.0 Flash: ~$0.001-0.002 per request
- Imagen 3: $0.03 per image
- **Total per generation: ~$0.032** (94% cheaper than SD)

---

## Verification Plan

### Automated Tests

```bash
# Backend unit tests
python -m pytest tests/

# API endpoint tests
curl -X POST http://localhost:8080/api/generate \
  -H "Content-Type: application/json" \
  -d @test_payload.json
```

### Manual Verification

1. **Existing frontend compatibility:**

   - Upload floor plan
   - Select style preset
   - Click generate
   - Verify result displays correctly
   - Download result

2. **Responsive design:**

   - Test on desktop (1920x1080)
   - Test on Galaxy Fold 7 inner screen (7.6")
   - Test on Galaxy Fold 7 outer screen (6.2")

3. **Preset learning (DEV):**
   - Upload reference architectural rendering
   - Verify AI-extracted style characteristics
   - Test new preset in generation flow

### Performance Targets

| Metric              | Target     |
| ------------------- | ---------- |
| Generation time     | <15s       |
| Cost per generation | <$0.05     |
| API response time   | <20s total |
| Cold start          | <5s        |

---

## Risk Assessment

| Risk                             | Impact | Mitigation                                |
| -------------------------------- | ------ | ----------------------------------------- |
| Imagen 3 not available in region | High   | Use Gemini Vision + fallback API          |
| Quality not matching SD output   | Medium | Extensive prompt engineering, A/B testing |
| API rate limits                  | Medium | Implement queue, caching, retry logic     |
| Frontend expects exact metadata  | Medium | Maintain response schema exactly          |

---

## Migration Checklist

### Pre-Migration

- [x] Review current codebase
- [ ] Obtain Gemini API key
- [ ] Test Gemini API access
- [ ] Backup current state

### Phase 1: Backend Transformation

- [ ] Update `requirements.txt`
- [ ] Update `config.py`
- [ ] Rewrite `main.py` `/api/generate` endpoint
- [ ] Add Gemini client initialization
- [ ] Implement error handling

### Phase 2: Preset Learning

- [ ] Add `/api/learn-preset` endpoint
- [ ] Implement Gemini Vision analysis
- [ ] Create preset storage mechanism

### Phase 3: Testing

- [ ] Test with existing frontend (no changes)
- [ ] Verify all style presets work
- [ ] Test responsive behavior
- [ ] Performance benchmarking

### Phase 4: Deployment

- [ ] Update Docker configuration
- [ ] Deploy to Cloud Run (CPU-only)
- [ ] Update documentation
- [ ] Create walkthrough

---

## Cost Analysis

### Current (SD/ControlNet)

- **Infrastructure:** GPU Cloud Run (~$2-5/hour)
- **Per generation:** $0.20-0.50
- **Monthly (1000 gens):** ~$200-500

### New (Gemini) - Research Validated

- **Infrastructure:** CPU Cloud Run (~$0.10-0.30/hour)
- **Per generation:** $0.032 (Gemini 2.0 Flash $0.002 + Imagen 3 $0.03)
- **Monthly (1000 gens):** ~$32 + infrastructure ~$40 = **$72 total**

**Savings:** 85-93% cost reduction ($200-500 → $72)

---

## Success Metrics

| Metric            | Current    | Target | Measurement          |
| ----------------- | ---------- | ------ | -------------------- |
| Generation time   | 20-180s    | <15s   | Server logs          |
| Cost per gen      | $0.20-0.50 | <$0.05 | API costs            |
| GPU required      | Yes        | No     | Infrastructure       |
| Cold start        | 60-120s    | <5s    | First request timing |
| User satisfaction | Baseline   | +50%   | Completion rate      |

---

_Document Version: 2.0_  
_Updated: December 11, 2025_  
_Critical Constraint: Frontend unchanged_
