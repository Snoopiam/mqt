# MQT Migration Status Report
## Stable Diffusion → Google Gemini API

**Report Date:** December 11, 2025
**Document Version:** 1.0
**Reference:** [REMODEL_PLAN.md](./REMODEL_PLAN.md)

---

## Executive Summary

The MQT application is currently running on the **original Stable Diffusion + ControlNet architecture**. **No migration work has been started.** All Phase 1 tasks (Strip & Clean) remain pending.

| Category | Status |
|----------|--------|
| **Overall Progress** | 0% Complete |
| **Phase 1 (Strip & Clean)** | Not Started |
| **Phase 2 (Gemini Integration)** | Not Started |
| **Phase 3 (UI Polish)** | Not Started |
| **Phase 4 (Testing & Deployment)** | Not Started |

---

## Current State Analysis

### Backend (`main.py`)

| Component | Current State | Target State | Action Required |
|-----------|--------------|--------------|-----------------|
| PyTorch imports | Present (lines 10, 17) | Remove | DELETE |
| Diffusers imports | Present (line 17) | Remove | DELETE |
| ControlNet model loading | Present (lines 41-85) | Remove | DELETE |
| SD Pipeline | Present (`StableDiffusionControlNetPipeline`) | Replace with Gemini | REWRITE |
| `/api/generate` endpoint | SD/ControlNet based (lines 327-429) | Gemini API based | REWRITE |
| Style preset system | Present (imports from `styles.py`) | Simplify | MODIFY |
| Health endpoint | Present (line 195-197) | Keep | NO CHANGE |
| CORS config | Present | Keep | NO CHANGE |
| FastAPI scaffold | Present | Keep | NO CHANGE |

**Lines of code to modify:** ~250 lines (significant rewrite)

---

### Configuration (`config.py`)

| Setting | Current Value | Action |
|---------|--------------|--------|
| `CONTROLNET_MODEL` | `lllyasviel/sd-controlnet-mlsd` | DELETE |
| `SD_MODEL` | `runwayml/stable-diffusion-v1-5` | DELETE |
| `MODEL_CACHE_DIR` | `./models` | DELETE |
| `DEFAULT_INFERENCE_STEPS` | `20` | DELETE |
| `DEFAULT_GUIDANCE_SCALE` | `7.5` | DELETE |
| `HF_TOKEN` | Environment variable | DELETE |
| `GEMINI_API_KEY` | Not present | ADD |
| `GEMINI_MODEL` | Not present | ADD |

---

### Dependencies (`requirements.txt`)

#### Current Dependencies (TO REMOVE):
```
--extra-index-url https://download.pytorch.org/whl/cu118  ← DELETE
torch                  ← DELETE
xformers               ← DELETE
diffusers              ← DELETE
transformers           ← DELETE
accelerate             ← DELETE
scipy                  ← DELETE
safetensors            ← DELETE
opencv-python-headless ← DELETE (or keep if needed)
numpy                  ← DELETE (Gemini doesn't need it)
```

#### Dependencies to KEEP:
```
fastapi
uvicorn
python-multipart
pydantic
python-dotenv
pillow
```

#### Dependencies to ADD:
```
google-generativeai>=0.8.0
httpx
```

**Current total deps:** 16 packages + CUDA wheels
**Target total deps:** 8 packages (50% reduction)

---

### Frontend Components

#### `src/services/api.js`
| Feature | Current State | Action |
|---------|--------------|--------|
| Forensic prompt construction | Present (lines 60-83) | SIMPLIFY |
| ControlNet config | Present (lines 70-75) | DELETE |
| Forensics payload | Present (lines 78-82) | DELETE/MODIFY |
| Mock mode support | Present | KEEP |
| Base URL handling | Present | KEEP |

#### `src/components/Controls.jsx`
| Feature | Current State | Action |
|---------|--------------|--------|
| Style preset cards | Uses `style_prompts.json` | REWRITE for text prompts |
| Forensic terminology | Present (termMap lines 17-25) | DELETE |
| 3D flip cards | Present | KEEP (nice UX) |
| Lighting engine display | Present | DELETE |

#### `src/data/style_prompts.json`
- **Status:** EXISTS (20+ preset styles with forensic DNA)
- **Action:** DELETE entirely or replace with simple style chips

#### `styles.py` (Backend)
- **Status:** EXISTS (699 lines of style preset definitions)
- **Action:** DELETE or dramatically simplify
- **Contains:** 12 detailed `StylePreset` dataclasses with:
  - Base prompts
  - Style modifiers
  - Negative prompts
  - Color palettes
  - ControlNet weights
  - Guidance scales

---

### Docker (`Dockerfile`)

| Component | Current State | Action |
|-----------|--------------|--------|
| Base image | `python:3.10-slim` | KEEP |
| OpenCV deps | `libgl1, libglib2.0-0` | DELETE |
| GPU requirements | None explicit (but deps require it) | SIMPLIFY |
| Multi-stage build | Present (Node builder + Python runtime) | KEEP |

---

### Environment Configuration (`.env.example`)

| Variable | Current | Target |
|----------|---------|--------|
| `HF_TOKEN` | Present | DELETE |
| `GCP_PROJECT_ID` | Present | KEEP (optional) |
| `DEVICE` | Present | DELETE |
| `CACHE_MODELS` | Present | DELETE |
| `MODEL_CACHE_DIR` | Present | DELETE |
| `DEFAULT_INFERENCE_STEPS` | Present | DELETE |
| `DEFAULT_GUIDANCE_SCALE` | Present | DELETE |
| `GEMINI_API_KEY` | Not present | ADD (required) |
| `GEMINI_MODEL` | Not present | ADD (optional) |
| `IMAGEN_MODEL` | Not present | ADD (optional) |

---

## Phase-by-Phase Checklist

### Phase 1: Strip & Clean (Day 1)

| Task | Status | Files Affected |
|------|--------|----------------|
| Remove all SD/ControlNet code from `main.py` | NOT STARTED | `main.py` |
| Remove unused Python dependencies | NOT STARTED | `requirements.txt` |
| Delete `style_prompts.json` | NOT STARTED | `src/data/style_prompts.json` |
| Delete or simplify `styles.py` | NOT STARTED | `styles.py` |
| Simplify `Controls.jsx` to basic style selector | NOT STARTED | `src/components/Controls.jsx` |
| Update `api.js` to simplified request format | NOT STARTED | `src/services/api.js` |
| Update Docker to lightweight Python image | NOT STARTED | `Dockerfile` |
| Remove OpenCV dependencies from Docker | NOT STARTED | `Dockerfile` |

### Phase 2: Gemini Integration (Day 2-3)

| Task | Status | Files Affected |
|------|--------|----------------|
| Add `google-generativeai` to requirements | NOT STARTED | `requirements.txt` |
| Create new `/api/generate` endpoint using Gemini/Imagen | NOT STARTED | `main.py` |
| Add Gemini client initialization in lifespan | NOT STARTED | `main.py` |
| Implement error handling for API limits/quotas | NOT STARTED | `main.py` |
| Add streaming support (optional) | NOT STARTED | `main.py`, `api.js` |
| Test end-to-end flow | NOT STARTED | - |
| Update `config.py` with Gemini settings | NOT STARTED | `config.py` |

### Phase 3: UI Polish (Day 4)

| Task | Status | Files Affected |
|------|--------|----------------|
| Update Hero copy for new capabilities | NOT STARTED | `src/components/Hero.jsx` |
| Redesign Controls for text-based prompting | NOT STARTED | `src/components/Controls.jsx` |
| Add style chips (quick selectors) | NOT STARTED | `src/components/Controls.jsx` |
| Add loading states/animations | PARTIAL (exists) | - |
| Implement result history (optional) | NOT STARTED | - |

### Phase 4: Testing & Deployment (Day 5)

| Task | Status | Files Affected |
|------|--------|----------------|
| Test on Cloud Run (CPU-only) | NOT STARTED | - |
| Update deployment documentation | NOT STARTED | `DEPLOYMENT.md` |
| Update `.env.example` | NOT STARTED | `.env.example` |
| Update `README.md` | NOT STARTED | `README.md` |
| Performance testing | NOT STARTED | - |
| Cost analysis validation | NOT STARTED | - |

---

## What's Working (Can Keep As-Is)

These components require NO changes:

| Component | Location | Notes |
|-----------|----------|-------|
| SplitView comparison UI | `src/components/SplitView.jsx` | Spring physics image comparison |
| Hero landing section | `src/components/Hero.jsx` | Just update copy |
| Uploader component | `src/components/Uploader.jsx` | Drag-drop upload |
| Layout component | `src/components/Layout.jsx` | Header + container |
| Glassmorphism CSS | `src/index.css` | Design system |
| Vite config | `vite.config.js` | Build configuration |
| React dependencies | `package.json` | React 19, Framer Motion, etc. |
| CORS middleware | `main.py` | FastAPI CORS setup |
| Health endpoint | `main.py` | `/health` route |
| Static file serving | `main.py` | Serves built frontend |

---

## Risk Assessment

| Risk | Impact | Current Status |
|------|--------|----------------|
| Imagen 3 availability | High | UNKNOWN - Need to test |
| API rate limits | Medium | Need quota planning |
| Quality difference | Medium | Need side-by-side testing |
| Regional availability | Medium | Need to verify Gemini availability |

---

## Recommended Next Steps

### Immediate Actions (Today)

1. **Obtain Gemini API key** - Required before any integration work
2. **Test Gemini API access** - Verify Imagen 3 availability in your region
3. **Backup current working state** - Create a git tag/branch

### Start Phase 1

1. Create a new branch: `git checkout -b feature/gemini-migration`
2. Begin stripping SD code from `main.py`
3. Update `requirements.txt` with new deps
4. Test that frontend still loads (will fail on generate)

---

## Code Metrics Comparison

| Metric | Current (SD) | Target (Gemini) | Change |
|--------|-------------|-----------------|--------|
| `main.py` lines | ~440 | ~150 | -66% |
| `requirements.txt` deps | 16 | 8 | -50% |
| `styles.py` lines | 699 | 0 (delete) | -100% |
| `style_prompts.json` | 20+ presets | 0 (delete) | -100% |
| Docker image size | ~3GB+ | ~500MB | -83% |
| Cold start time | 60-120s | <5s | -95% |
| GPU required | Yes | No | N/A |

---

## Appendix: File Inventory

### Files to DELETE
```
src/data/style_prompts.json     # Frontend preset data
styles.py                       # Backend preset definitions (699 lines)
```

### Files to HEAVILY MODIFY
```
main.py          # Remove ~300 lines of SD code, add ~50 lines Gemini
config.py        # Remove SD config (~40 lines), add Gemini (~10 lines)
requirements.txt # Remove 10 deps, add 2
Dockerfile       # Remove OpenCV deps
.env.example     # Remove HF/SD vars, add Gemini vars
```

### Files to LIGHTLY MODIFY
```
src/services/api.js        # Simplify payload structure
src/components/Controls.jsx # Replace preset cards with text input
src/components/Hero.jsx    # Update marketing copy
DEPLOYMENT.md              # Update deployment instructions
README.md                  # Update documentation
```

### Files with NO CHANGES
```
src/App.jsx
src/main.jsx
src/index.css
src/components/Layout.jsx
src/components/Uploader.jsx
src/components/SplitView.jsx
vite.config.js
package.json
package-lock.json
index.html
.gitignore
```

---

*Report generated by Claude Code*
*Last updated: December 11, 2025*
