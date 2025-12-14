# Product Requirements Document (PRD)
# MQT v2.0 - Gemini-Powered Architectural Visualization

---

## Document Control
| Field | Value |
|-------|-------|
| Version | 2.0.0 |
| Status | Draft |
| Created | December 10, 2025 |
| Last Updated | December 10, 2025 |
| Owner | SnoopLabs |

---

## 1. Executive Summary

### 1.1 Product Vision
MQT (Maquettiste) is an AI-powered web application that transforms 2D architectural floor plans into stunning 3D visualizations. Version 2.0 represents a complete architectural remodel, migrating from local Stable Diffusion inference to Google Gemini API for faster, cheaper, and more accessible image generation.

### 1.2 Problem Statement
The current MQT v1.x architecture suffers from:
- **High infrastructure costs**: GPU requirements (~$0.20-0.50 per generation)
- **Slow generation times**: 20-180 seconds per image
- **Complex deployment**: 7GB+ model downloads, CUDA dependencies
- **Limited accessibility**: Requires GPU-enabled infrastructure
- **Rigid style system**: 20 hardcoded presets with no flexibility

### 1.3 Solution
Migrate to Google Gemini API (Gemini 2.0 + Imagen 3) to achieve:
- **10x faster generation**: <15 seconds vs 20-180 seconds
- **10x cost reduction**: ~$0.01-0.05 per generation
- **Zero GPU requirements**: CPU-only deployment
- **Natural language prompts**: Users describe styles in plain English
- **Instant cold starts**: No model download on first run

---

## 2. Goals & Success Metrics

### 2.1 Business Goals
| Goal | Target | Measurement |
|------|--------|-------------|
| Reduce infrastructure cost | 90% reduction | Monthly cloud spend |
| Increase generation speed | <15 seconds | P95 latency |
| Simplify deployment | CPU-only | Deployment checklist |
| Improve user experience | 50% increase in completions | Funnel analytics |

### 2.2 Technical Goals
| Goal | Current | Target |
|------|---------|--------|
| Generation time | 20-180s | <15s |
| Cost per generation | $0.20-0.50 | <$0.05 |
| Cold start time | 60-120s | <5s |
| Model storage | 7GB | 0GB |
| GPU requirement | Required | None |
| Codebase size | ~2,400 LOC | <1,500 LOC |

### 2.3 User Goals
- Generate architectural visualizations quickly
- Use natural language to describe desired styles
- Compare original and generated images easily
- Download high-quality results

---

## 3. User Personas

### 3.1 Primary Persona: Sarah (Interior Designer)
- **Age**: 28-45
- **Technical Skill**: Low-Medium
- **Goal**: Quickly visualize floor plan concepts for clients
- **Pain Points**:
  - Current tools are slow or expensive
  - Complex software requires training
  - Hard to communicate vision to clients
- **Needs**:
  - Fast turnaround (<30 seconds)
  - Easy to use interface
  - Professional quality output
  - Ability to iterate quickly

### 3.2 Secondary Persona: Marcus (Real Estate Agent)
- **Age**: 30-55
- **Technical Skill**: Low
- **Goal**: Create attractive visuals for property listings
- **Pain Points**:
  - Can't afford professional 3D renders for every listing
  - Need quick turnaround for hot market
- **Needs**:
  - Bulk generation capability
  - Consistent style across listings
  - Cost-effective solution

### 3.3 Tertiary Persona: Alex (Architecture Student)
- **Age**: 18-25
- **Technical Skill**: Medium-High
- **Goal**: Experiment with visualization styles for projects
- **Pain Points**:
  - Limited budget
  - Wants to try many styles quickly
- **Needs**:
  - Free tier or low cost
  - Wide variety of styles
  - Educational/experimental freedom

---

## 4. Feature Requirements

### 4.1 Core Features (MVP)

#### F1: Image Upload
| Attribute | Specification |
|-----------|---------------|
| Priority | P0 (Critical) |
| Status | Existing (Keep) |
| Description | Drag-and-drop or click-to-upload interface |
| Accepted Formats | JPG, PNG, WebP |
| Max File Size | 10MB |
| Validation | Client-side format/size checks |

#### F2: Natural Language Prompt Input
| Attribute | Specification |
|-----------|---------------|
| Priority | P0 (Critical) |
| Status | New |
| Description | Text input for describing desired visualization style |
| Max Length | 500 characters |
| Examples | "Modern minimalist with natural lighting", "Blueprint style with blue tones" |
| Enhancement | Quick-select style chips for common styles |

#### F3: Image Generation
| Attribute | Specification |
|-----------|---------------|
| Priority | P0 (Critical) |
| Status | Rewrite |
| Description | Generate visualization using Gemini/Imagen API |
| Target Latency | <15 seconds P95 |
| Output Format | PNG, 1024x1024 minimum |
| Error Handling | Graceful fallback, retry logic, user feedback |

#### F4: Split-View Comparison
| Attribute | Specification |
|-----------|---------------|
| Priority | P0 (Critical) |
| Status | Existing (Keep) |
| Description | Side-by-side comparison with draggable slider |
| Features | Zoom (1x-5x), Pan (synchronized), Spring physics |
| Interactions | Mouse wheel zoom, drag to pan, slider drag |

#### F5: Result Download
| Attribute | Specification |
|-----------|---------------|
| Priority | P1 (Important) |
| Status | Existing (Keep) |
| Description | Download generated image as PNG |
| Filename | mqt-render-{timestamp}.png |
| Quality | Full resolution, no compression |

### 4.2 Enhanced Features (Post-MVP)

#### F6: Style Presets
| Attribute | Specification |
|-----------|---------------|
| Priority | P2 (Nice to Have) |
| Status | Rewrite |
| Description | Quick-select chips for common visualization styles |
| Styles | Minimalist, Photorealistic, Blueprint, Watercolor, 3D Render, Sketch |
| Behavior | Clicking chip populates prompt input |

#### F7: Generation History
| Attribute | Specification |
|-----------|---------------|
| Priority | P2 (Nice to Have) |
| Status | New |
| Description | Recent generations stored locally (browser) |
| Storage | LocalStorage, max 10 items |
| Display | Thumbnail grid below main view |

#### F8: Prompt Suggestions
| Attribute | Specification |
|-----------|---------------|
| Priority | P3 (Future) |
| Status | New |
| Description | Gemini analyzes uploaded image and suggests prompts |
| Trigger | After image upload |
| Display | Suggestion chips above prompt input |

### 4.3 Removed Features (Deprecated)

| Feature | Reason |
|---------|--------|
| 20 Hardcoded Style Presets | Replaced by natural language prompts |
| Forensic DNA Panel | Overly complex, replaced by simple prompts |
| ControlNet MLSD Config | SD-specific, not needed with Gemini |
| Lighting Engine Selection | Replaced by natural language |
| Material Type Selection | Replaced by natural language |
| Hex Palette Display | Simplified interface |

---

## 5. Technical Architecture

### 5.1 System Overview
```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                               │
│            (React 19 + Framer Motion + Vite)                │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐    │
│  │  Uploader  │  │   Prompt   │  │    SplitView       │    │
│  │ Component  │  │   Input    │  │   (Comparison)     │    │
│  └─────┬──────┘  └─────┬──────┘  └─────────┬──────────┘    │
│        │               │                    │               │
│        └───────────────┼────────────────────┘               │
│                        │                                     │
│              ┌─────────▼─────────┐                          │
│              │     api.js        │                          │
│              │  (HTTP Client)    │                          │
│              └─────────┬─────────┘                          │
└────────────────────────│────────────────────────────────────┘
                         │
                    HTTPS/REST
                         │
┌────────────────────────▼────────────────────────────────────┐
│                        SERVER                                │
│              (FastAPI + Python 3.10)                         │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    main.py                           │   │
│  │                                                      │   │
│  │   POST /api/generate                                 │   │
│  │   ├── Validate request                               │   │
│  │   ├── Decode base64 image                           │   │
│  │   ├── Call Gemini/Imagen API                        │   │
│  │   └── Return base64 result                          │   │
│  │                                                      │   │
│  │   GET /health                                        │   │
│  │   └── Return API status                              │   │
│  │                                                      │   │
│  │   / (Static)                                         │   │
│  │   └── Serve React build from dist/                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                    │
└─────────────────────────│────────────────────────────────────┘
                          │
                      API Call
                          │
┌─────────────────────────▼────────────────────────────────────┐
│                  GOOGLE GEMINI API                           │
│                                                              │
│   ┌─────────────────────┐  ┌─────────────────────┐         │
│   │  Gemini 2.0 Flash   │  │     Imagen 3        │         │
│   │  (Image Analysis)   │  │ (Image Generation)  │         │
│   └─────────────────────┘  └─────────────────────┘         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 API Specification

#### POST /api/generate

**Request:**
```json
{
  "image": "base64_encoded_image_string",
  "prompt": "Transform this floor plan into a photorealistic 3D visualization with warm lighting and modern furniture",
  "style": "photorealistic",  // optional preset
  "options": {
    "aspect_ratio": "1:1",    // optional
    "quality": "high"         // optional: "standard" | "high"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "image": "base64_encoded_result_image",
  "metadata": {
    "model": "imagen-3.0-generate-001",
    "prompt_used": "...",
    "generation_time_ms": 8234,
    "dimensions": {
      "width": 1024,
      "height": 1024
    }
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": {
    "code": "GENERATION_FAILED",
    "message": "Image generation failed due to content policy",
    "retry": false
  }
}
```

#### GET /health

**Response:**
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "gemini_available": true,
  "timestamp": "2025-12-10T12:00:00Z"
}
```

### 5.3 Technology Stack

#### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI Framework |
| Vite | 7.x | Build Tool |
| Framer Motion | 12.x | Animations |
| Lucide React | 0.556.x | Icons |
| Tailwind (via utilities) | - | Styling |

#### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.10+ | Runtime |
| FastAPI | 0.100+ | Web Framework |
| Uvicorn | 0.30+ | ASGI Server |
| google-generativeai | 0.8+ | Gemini SDK |
| Pillow | 10.x | Image Processing |
| Pydantic | 2.x | Validation |

#### Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Google Cloud Run | Deployment (CPU-only) |
| Google Gemini API | AI Generation |

---

## 6. Data & Privacy

### 6.1 Data Flow
1. User uploads image → stored in browser memory only
2. Image sent to backend → processed, not stored
3. Backend calls Gemini API → Google processes, returns result
4. Result returned to user → displayed, not stored server-side

### 6.2 Data Retention
| Data | Retention | Storage |
|------|-----------|---------|
| Uploaded images | Session only | Browser memory |
| Generated images | Session only | Browser memory |
| Generation history | User opt-in | Browser LocalStorage |
| API logs | 30 days | Cloud Run logs |

### 6.3 Privacy Considerations
- No PII collection required
- Images processed but not stored on server
- Google Gemini API has its own data handling policies
- Users should be informed of Google API usage

---

## 7. Non-Functional Requirements

### 7.1 Performance
| Metric | Target | Measurement |
|--------|--------|-------------|
| Generation latency P50 | <10s | Server-side timing |
| Generation latency P95 | <15s | Server-side timing |
| Page load time | <2s | Lighthouse |
| Time to Interactive | <3s | Lighthouse |

### 7.2 Reliability
| Metric | Target |
|--------|--------|
| Uptime | 99.5% |
| Error rate | <1% |
| Successful generations | >95% |

### 7.3 Scalability
| Metric | Target |
|--------|--------|
| Concurrent users | 100+ |
| Generations per minute | 60+ |
| Auto-scaling | Cloud Run managed |

### 7.4 Security
- HTTPS only
- API key stored securely (environment variables)
- No authentication required for MVP
- Rate limiting on API endpoints
- Input validation (file type, size, prompt length)

---

## 8. User Interface

### 8.1 Screen: Landing (Hero)
```
┌─────────────────────────────────────────────────────────┐
│  [Logo] MQT                                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│              ✨ AI-POWERED VISUALIZATION                 │
│                                                          │
│                     MQT                                  │
│              (Gradient Text Effect)                      │
│                                                          │
│      Transform floor plans into stunning                 │
│           3D visualizations instantly                    │
│                                                          │
│              [ Start Creating → ]                        │
│                                                          │
│     (Radial gradient backgrounds, glassmorphism)        │
└─────────────────────────────────────────────────────────┘
```

### 8.2 Screen: Studio (Main)
```
┌─────────────────────────────────────────────────────────┐
│  [Logo] MQT                               [⬇ Download]  │
├───────────────────────┬─────────────────────────────────┤
│                       │                                  │
│   STYLE & PROMPT      │         SPLIT VIEW              │
│                       │                                  │
│  ┌─────────────────┐  │  ┌───────────────────────────┐  │
│  │ Describe your   │  │  │                           │  │
│  │ style...        │  │  │   Original │ Generated    │  │
│  │                 │  │  │            │              │  │
│  └─────────────────┘  │  │   [Image]  │  [Image]     │  │
│                       │  │            │              │  │
│  Quick styles:        │  │      ← [Slider] →         │  │
│  [Minimal] [Photo]    │  │                           │  │
│  [Blueprint] [Sketch] │  │   [+] 100% [-] [Reset]    │  │
│                       │  └───────────────────────────┘  │
│  [ ⚡ Generate ]      │                                  │
│                       │                                  │
└───────────────────────┴─────────────────────────────────┘
```

### 8.3 Screen: Upload State
```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│    ┌─────────────────────────────────────────────┐      │
│    │                                              │      │
│    │       📁 Drop your floor plan here          │      │
│    │                                              │      │
│    │           or click to browse                │      │
│    │                                              │      │
│    │    Accepts: JPG, PNG, WebP (max 10MB)       │      │
│    │                                              │      │
│    └─────────────────────────────────────────────┘      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 8.4 Screen: Generating State
```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│              ┌─────────────────────────┐                │
│              │                         │                │
│              │     [Spinner]           │                │
│              │                         │                │
│              │   Generating your       │                │
│              │   visualization...      │                │
│              │                         │                │
│              │   ████████░░░░  60%     │                │
│              │                         │                │
│              └─────────────────────────┘                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 9. Release Plan

### 9.1 Phase 1: Foundation (Week 1)
- [ ] Strip SD/ControlNet code
- [ ] Set up Gemini API integration
- [ ] Basic generation endpoint working
- [ ] End-to-end smoke test

### 9.2 Phase 2: Feature Complete (Week 2)
- [ ] Natural language prompt input
- [ ] Quick style chips
- [ ] Error handling and retry logic
- [ ] Loading states and feedback

### 9.3 Phase 3: Polish & Deploy (Week 3)
- [ ] UI polish and animations
- [ ] Performance optimization
- [ ] Documentation update
- [ ] Production deployment

### 9.4 Phase 4: Enhancement (Week 4+)
- [ ] Generation history
- [ ] Prompt suggestions
- [ ] Batch generation
- [ ] User feedback collection

---

## 10. Open Questions

| Question | Status | Decision |
|----------|--------|----------|
| Does Imagen 3 support image conditioning? | Open | Need to test |
| What's max resolution for Imagen 3? | Open | Need to verify |
| Should we add authentication? | Deferred | MVP without auth |
| Fallback if Gemini unavailable? | Open | Consider Replicate |
| Cost tracking implementation? | Open | Consider per-user limits |

---

## 11. Appendices

### Appendix A: Gemini API Reference
- Documentation: https://ai.google.dev/docs
- Imagen 3: https://ai.google.dev/docs/imagen
- Pricing: https://ai.google.dev/pricing

### Appendix B: Current vs New Comparison

| Aspect | Current (SD) | New (Gemini) |
|--------|--------------|--------------|
| Model | SD v1.5 + ControlNet | Gemini 2.0 + Imagen 3 |
| Inference Location | Server GPU | Google Cloud |
| Generation Time | 20-180s | <15s |
| Cost per Gen | $0.20-0.50 | ~$0.01-0.05 |
| Model Download | 7GB | 0GB |
| GPU Required | Yes | No |
| Cold Start | 60-120s | <5s |
| Style Control | 20 presets | Natural language |
| Codebase | ~2,400 LOC | <1,500 LOC |

### Appendix C: Glossary
| Term | Definition |
|------|------------|
| MQT | Maquettiste - The AI floor plan visualizer |
| Gemini | Google's multimodal AI model family |
| Imagen | Google's image generation model |
| SD | Stable Diffusion (deprecated in v2.0) |
| ControlNet | Neural network for image conditioning (deprecated) |
| MLSD | Mobile Line Segment Detection (deprecated) |

---

*End of PRD*
