# MQT Codebase Inventory
## Complete File-by-File Analysis for Remodel

---

## Legend
| Symbol | Meaning |
|--------|---------|
| **KEEP** | No changes needed |
| **MODIFY** | Needs updates for Gemini |
| **REWRITE** | Complete rewrite required |
| **DELETE** | Remove entirely |
| **NEW** | Create new file |

---

## Backend Files

### main.py (261 lines) - **REWRITE**
**Current State:** Stable Diffusion + ControlNet inference
**Target State:** Google Gemini API calls

| Line Range | Content | Action |
|------------|---------|--------|
| 1-16 | Imports (torch, diffusers, etc.) | DELETE |
| 17-32 | Config imports, logging | KEEP |
| 33-77 | Model loading (lifespan) | REWRITE for Gemini |
| 78-93 | CORS setup | KEEP |
| 94-100 | Origins configuration | KEEP |
| 101-120 | Request/Response models | MODIFY |
| 121-184 | Health endpoint, helpers | KEEP |
| 185-251 | /api/generate endpoint | REWRITE for Gemini |
| 252-261 | Static file serving | KEEP |

**New Imports Needed:**
```python
import google.generativeai as genai
# Remove: torch, diffusers, transformers, xformers
```

---

### config.py (106 lines) - **MODIFY**
**Current State:** SD model paths, inference settings
**Target State:** Gemini API configuration

| Line Range | Content | Action |
|------------|---------|--------|
| 1-27 | Environment loading | KEEP |
| 28-59 | Cloud Run detection | KEEP |
| 60-70 | CORS, PORT, logging | KEEP |
| 71-72 | SD_MODEL, CONTROLNET_MODEL | DELETE |
| 73-83 | MODEL_CACHE_DIR, HF_TOKEN | DELETE |
| 84-89 | Inference steps, guidance | DELETE |
| 90-106 | validate(), print_config() | MODIFY |

**New Config Needed:**
```python
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")
IMAGEN_MODEL: str = os.getenv("IMAGEN_MODEL", "imagen-3.0-generate-001")
```

---

### requirements.txt (18 lines) - **MODIFY**

**DELETE:**
```
--extra-index-url https://download.pytorch.org/whl/cu118
torch
xformers
diffusers
transformers
accelerate
scipy
safetensors
opencv-python-headless
```

**KEEP:**
```
fastapi
uvicorn
python-multipart
pydantic
python-dotenv
numpy
pillow
```

**ADD:**
```
google-generativeai>=0.8.0
httpx
```

---

### Dockerfile (45 lines) - **MODIFY**

**DELETE:**
- `libgl1, libglib2.0-0` (OpenCV dependencies)
- Model cache directory setup
- Large memory allocations

**KEEP:**
- Multi-stage build pattern
- Node.js build stage
- Python runtime stage
- Static file copying

**Target Image Size:** <300MB (down from >2GB)

---

## Frontend Files

### src/App.jsx (221 lines) - **MODIFY**

| Line Range | Content | Action |
|------------|---------|--------|
| 1-20 | Imports | MODIFY (remove style_prompts) |
| 21-40 | State declarations | MODIFY (remove currentPreset) |
| 41-80 | File handlers | KEEP |
| 81-120 | handleGenerate | MODIFY (new API format) |
| 121-180 | Render JSX | MODIFY (integrate PromptInput) |
| 181-221 | Conditional renders | KEEP |

**State Changes:**
```jsx
// REMOVE
const [currentPreset, setCurrentPreset] = useState(null);

// ADD
const [prompt, setPrompt] = useState('');
```

---

### src/components/Controls.jsx (195 lines) - **REWRITE**
**Current State:** 3D flip cards, forensic DNA display
**Target State:** Simple prompt input + style chips

**DELETE ALL:**
- ENGINE_DISPLAY_MAP (lines 16-32)
- PresetCard component
- 3D flip animation
- DataTag component
- Forensic DNA display
- Hex palette rendering

**NEW STRUCTURE:**
```jsx
const Controls = ({ prompt, setPrompt, onGenerate, isGenerating }) => {
  return (
    <div className="glass-panel">
      <PromptInput value={prompt} onChange={setPrompt} />
      <StyleChips onSelect={(style) => setPrompt(style)} />
      <GenerateButton onClick={onGenerate} disabled={!prompt || isGenerating} />
    </div>
  );
};
```

---

### src/components/SplitView.jsx (183 lines) - **KEEP**
**Excellent reusable component with:**
- Spring physics slider
- Synchronized zoom/pan
- Framer Motion animations
- HUD controls

**No changes required.**

---

### src/components/Hero.jsx (123 lines) - **KEEP** (minor copy update)
**Minor Updates:**
- Update tagline for Gemini capabilities
- Change "Neural Processing" to "AI Visualization"

---

### src/components/Uploader.jsx (147 lines) - **KEEP**
**No changes required.**
- Drag-drop functionality
- File validation
- Preview display

---

### src/components/Layout.jsx (75 lines) - **KEEP**
**No changes required.**
- Header with logo
- Container structure

---

### src/services/api.js (112 lines) - **MODIFY**

| Line Range | Content | Action |
|------------|---------|--------|
| 1-20 | Imports, config | KEEP |
| 21-40 | Mock mode | KEEP |
| 41-59 | generateRender setup | KEEP |
| 60-82 | Forensic prompt construction | DELETE |
| 83-112 | Response handling | MODIFY |

**NEW API CALL:**
```javascript
export async function generateRender(imageBase64, prompt, options = {}) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: imageBase64,
      prompt: prompt,
      style: options.style || null,
      options: {
        aspect_ratio: options.aspectRatio || '1:1'
      }
    })
  });

  const data = await response.json();
  if (!data.success) throw new Error(data.error.message);
  return data;
}
```

---

### src/data/style_prompts.json (290 lines) - **DELETE**
**Entire file deprecated.**
20 hardcoded presets no longer needed with natural language prompts.

---

### src/index.css (98 lines) - **KEEP**
**Glassmorphism design system - valuable to keep.**
- CSS variables
- Glass panel styles
- Animation utilities

---

### src/main.jsx (10 lines) - **KEEP**
**No changes required.**

---

## New Files to Create

### src/components/PromptInput.jsx - **NEW**
```jsx
// Natural language prompt input with character count
const PromptInput = ({ value, onChange, maxLength = 500 }) => {
  return (
    <div className="glass-panel">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe your visualization style..."
        maxLength={maxLength}
      />
      <span className="char-count">{value.length}/{maxLength}</span>
    </div>
  );
};
```

---

### src/components/StyleChips.jsx - **NEW**
```jsx
// Quick-select style buttons
const STYLES = [
  { id: 'minimalist', label: 'Minimalist', prompt: 'Clean minimalist visualization...' },
  { id: 'photorealistic', label: 'Photorealistic', prompt: 'Photorealistic 3D render...' },
  { id: 'blueprint', label: 'Blueprint', prompt: 'Technical blueprint style...' },
  { id: 'watercolor', label: 'Watercolor', prompt: 'Artistic watercolor rendering...' },
  { id: 'sketch', label: 'Sketch', prompt: 'Architectural sketch style...' },
  { id: '3d-render', label: '3D Render', prompt: 'Modern 3D visualization...' }
];

const StyleChips = ({ onSelect }) => {
  return (
    <div className="style-chips">
      {STYLES.map(style => (
        <button key={style.id} onClick={() => onSelect(style.prompt)}>
          {style.label}
        </button>
      ))}
    </div>
  );
};
```

---

### src/components/LoadingOverlay.jsx - **NEW**
```jsx
// Loading state with progress feedback
const LoadingOverlay = ({ progress, status }) => {
  return (
    <div className="loading-overlay glass-panel">
      <Spinner />
      <p>{status || 'Generating...'}</p>
      {progress && <ProgressBar value={progress} />}
    </div>
  );
};
```

---

## Config Files

### .env.example - **MODIFY**

**DELETE:**
```
HF_TOKEN=your_huggingface_token
MODEL_CACHE_DIR=./models
DEFAULT_INFERENCE_STEPS=20
DEFAULT_GUIDANCE_SCALE=7.5
```

**ADD:**
```
# Google Gemini API (REQUIRED)
GEMINI_API_KEY=your_gemini_api_key

# Optional model overrides
GEMINI_MODEL=gemini-2.0-flash-exp
IMAGEN_MODEL=imagen-3.0-generate-001

# Frontend config
VITE_API_URL=http://localhost:8080/api/generate
VITE_USE_MOCK=false
```

---

### vite.config.js (41 lines) - **KEEP**
**No changes required.**

---

### package.json (31 lines) - **KEEP**
**No changes required.**
All frontend dependencies stay the same.

---

## Documentation Files

### README.md - **MODIFY**
- Update tech stack description
- Remove SD/ControlNet references
- Add Gemini API setup instructions
- Update deployment section

### DEPLOYMENT.md - **MODIFY**
- Remove GPU requirements
- Simplify Cloud Run config
- Add Gemini API key setup
- Update resource requirements

### USERMANUAL.md - **MODIFY**
- Update for new prompt-based flow
- Remove preset descriptions
- Add style chip guide

---

## Files to Delete

| File | Reason |
|------|--------|
| `src/data/style_prompts.json` | Presets obsolete |
| `scripts/analyze_presets.js` | Style analysis obsolete |
| `Preset Style Reference/` | Reference images obsolete |
| `models/` | No local models needed |

---

## Summary Statistics

| Category | Files | Action |
|----------|-------|--------|
| Backend | 4 | 1 REWRITE, 3 MODIFY |
| Frontend Components | 6 | 1 REWRITE, 2 MODIFY, 3 KEEP |
| Frontend Services | 1 | MODIFY |
| Frontend Data | 1 | DELETE |
| New Components | 3 | CREATE |
| Config Files | 5 | 2 MODIFY, 3 KEEP |
| Documentation | 3 | MODIFY |
| Delete | 4 | DELETE |

**Total Lines of Code:**
- Removing: ~651 LOC
- Adding: ~385 LOC
- Net Change: -266 LOC

---

*Inventory Generated: December 10, 2025*
