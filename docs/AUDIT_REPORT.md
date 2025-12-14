# MQT Full Audit Report
**Date**: December 14, 2025  
**Scope**: Layout handling, style application, HD vs Free mode, download functionality

---

## Executive Summary

This audit identified **critical issues** in three areas:
1. **HD Mode Hallucination**: Same generation config (temperature, prompts) for both tiers allows PREMIUM model to drift
2. **Download Broken**: Frontend crashes when image is blob URL (before generation)
3. **Legacy Code**: Frontend sends unused ControlNet/forensics parameters

---

## 1. Data Flow Analysis

### Complete Request Path
```
User Upload → Uploader.jsx → handleUpload (App.jsx)
    ↓
File stored as blob URL + uploadedFile state
    ↓
User selects tier (FREE/PREMIUM) + style preset
    ↓
handleGenerate → fileToBase64 → generateRender (api.js)
    ↓
POST /api/generate with: {image, tier, prompt, negative_prompt, style_id, controlnet*, forensics*}
    ↓
generateHandler (gemini.js) → buildGenerationPrompt (styles.js)
    ↓
generateWithGemini: analyze floor plan → build prompt → generate image
    ↓
Response: {status, image: "data:image/png;base64,..."}
    ↓
setGeneratedImage → SplitView displays result
```

**Note**: `controlnet` and `forensics` marked with * are sent but IGNORED by backend.

---

## 2. HD vs Free Mode Analysis

### Tier Configuration (`server/config.js`)
| Tier | Analysis Model | Generation Model | Daily Limit |
|------|----------------|------------------|-------------|
| FREE | gemini-2.5-flash | gemini-2.5-flash-image | 100 |
| PREMIUM | gemini-2.5-flash | gemini-3-pro-image-preview | Unlimited |

### CRITICAL FINDING: Identical Generation Config

Both tiers use **IDENTICAL** generation parameters (`server/gemini.js:324-333`):
```javascript
generationConfig: {
  temperature: 0.2,    // Same for both!
  topP: 0.85,          // Same for both!
  topK: 40,            // Same for both!
  maxOutputTokens: 8192,
  responseModalities: ['TEXT', 'IMAGE']
}
```

**Impact**: The PREMIUM model (`gemini-3-pro-image-preview`) likely needs:
- Lower temperature (0.1 or less) to reduce creative liberty
- Stricter topP (0.7) for more deterministic output
- Additional geometry-locking instructions in prompt

### Prompt Is Identical Across Tiers

The `finalPrompt` construction (lines 254-286) does NOT vary by tier:
- Same analysis prompt
- Same persona injection
- Same negative constraints
- Same "Generate the image" instruction

**Recommendation**: Add tier-specific prompt modifiers, e.g., for PREMIUM:
```
CRITICAL: This is a high-fidelity HD render. Geometric accuracy is PARAMOUNT.
DO NOT add, remove, or reposition ANY structural elements or furniture.
```

---

## 3. Prompt & Negative Prompt Audit

### Three Sources of Negative Prompts (Inconsistent)

**Source 1 - Frontend (`api.js:67`)** - Always sent:
```
text, watermark, low quality, blurred, distorted walls, messy lines, 
extra furniture, hallucinated plants, phantom cars, organic shapes not in input
```

**Source 2 - Style loader default (`styles.js:53`)** - Applied to all styles:
```
text, watermark, low quality, blurred, distorted structure, swapping furniture, 
wrong room types, extra walls, missing doors
```

**Source 3 - Generation function (`gemini.js:252`)** - Fallback default:
```
text, watermark, low quality, blurred, distorted structure, swapping furniture, 
wrong room types, adding furniture to empty spaces, outdoor furniture on balconies, 
terrace furniture, tables outside
```

**Problem**: Redundant terms, inconsistent wording, diluted effectiveness.

### No Styles Have Persona Field

`style_prompts.json` has **ZERO** entries with `"persona":` - all 30 styles use the default persona (`gemini.js:228-241`).

The specialized persona path (line 244-246) is **NEVER USED**.

### Conflicting Instructions in Image Prompt

The final image prompt (`gemini.js:336-340`) adds:
```
Please generate a photorealistic architectural visualization image.
```

This **conflicts** with sketch/abstract styles like:
- Azure Sketch ("Architectural Sketch")
- Graphite Iso ("Architectural Sketch")
- Olive Sketch ("Architectural Sketch")

---

## 4. Style Preset Integrity

### Statistics
- **Total styles**: 30
- **Categories**: "Signature" (13), "Standard Collection" (17)
- **No duplicate titles** ✓
- **No missing required fields** ✓

### Intentional Duplicate Palettes (Same visual, different viewpoints)
| Style Pair | Category |
|------------|----------|
| olive_sketch, olive_plan | Standard Collection |
| graphite_iso, graphite_plan | Standard Collection |
| cyber_blue, cyber_plan | Standard Collection |

### Category Handling in Controls.jsx
- Signature: `s.category === 'Signature'` → 13 styles ✓
- Standard: `s.category !== 'Signature'` → 17 styles ✓

**No issues found** with style preset integrity.

---

## 5. Download Bug Analysis

### CRITICAL BUG: Download fails for blob URLs

**Location**: `src/App.jsx:156-176`

**Root Cause**: 
1. On upload, `generatedImage` is set to blob URL (`blob:http://localhost:5173/...`)
2. On generation success, it becomes data URI (`data:image/png;base64,...`)
3. `base64ToBlob()` assumes data URI format:
   ```javascript
   const byteCharacters = atob(base64Data.split(',')[1]);  // Line 158
   ```
4. For blob URLs, `split(',')[1]` is `undefined`, causing `atob(undefined)` to throw

**Failure Scenarios**:
1. User clicks Download before generating (image is blob URL)
2. API returns malformed response (no `data:` prefix)

**Current Behavior**: Silent failure - try-catch catches error but doesn't inform user.

### Backend Download Endpoint Unused

`server/index.js:139-158` - `/api/download` is a skeleton that:
- Just echoes back the image
- Is never called by frontend
- `ENABLE_MULTI_FORMAT_DOWNLOAD` toggle does nothing

---

## 6. Legacy/Dead Code

### Frontend Sends Unused Parameters (`api.js:71-85`)
```javascript
controlnet: {
    module: "mlsd",
    weight: 1.0,
    guidance_start: 0.0,
    guidance_end: 1.0
},
forensics: {
    hex_palette: forensicData.hex_palette,
    engine: forensicData.lighting_engine,
    materiality: forensicData.materiality
}
```

**Backend ignores both** - they're remnants of the SD/ControlNet architecture.

---

## 7. Recommended Fixes

### Priority 1: Download Bug Fix
**File**: `src/App.jsx`

```javascript
// Replace base64ToBlob function (lines 156-176)
const base64ToBlob = (imageData, contentType = 'image/png') => {
    try {
        // Handle blob URLs - can't convert, use fetch
        if (imageData.startsWith('blob:')) {
            return null; // Will trigger fallback
        }
        
        // Handle data URIs
        if (!imageData.includes(',')) {
            console.error('Invalid image data format');
            return null;
        }
        
        const base64Data = imageData.split(',')[1];
        if (!base64Data) {
            console.error('Empty base64 data');
            return null;
        }
        
        const byteCharacters = atob(base64Data);
        // ... rest of existing code
    } catch (e) {
        console.error("Blob conversion failed:", e);
        return null;
    }
};

// Update handleDownload to show error
const handleDownload = () => {
    if (!generatedImage) {
        alert("No image to download!");
        return;
    }
    
    // Check if image is a blob URL (not yet generated)
    if (generatedImage.startsWith('blob:')) {
        alert("Please generate a render first before downloading.");
        return;
    }
    // ... rest of existing code
};
```

### Priority 2: HD Mode Hallucination Reduction
**File**: `server/gemini.js`

```javascript
// Add tier-specific generation config (around line 324)
const tierGenerationConfig = {
    FREE: {
        temperature: 0.2,
        topP: 0.85,
        topK: 40,
    },
    PREMIUM: {
        temperature: 0.1,  // Lower for strict adherence
        topP: 0.7,         // More deterministic
        topK: 30,          // Focused sampling
    }
};

const configForTier = tierGenerationConfig[activeTierName] || tierGenerationConfig.FREE;

const generationModel = genAI.getGenerativeModel({ 
    model: generationModelName,
    generationConfig: {
        ...configForTier,
        maxOutputTokens: 8192,
        responseModalities: ['TEXT', 'IMAGE']
    }
});
```

### Priority 3: HD-Specific Prompt Reinforcement
**File**: `server/gemini.js`

```javascript
// After line 246, add tier-specific constraints
let tierConstraints = '';
if (activeTierName === 'PREMIUM' || activeTierName === 'ULTRA') {
    tierConstraints = `
*** HIGH-FIDELITY MODE ACTIVE ***
This is a PREMIUM HD render. GEOMETRIC ACCURACY IS PARAMOUNT.
- ZERO tolerance for layout changes
- EXACT furniture placement from analysis
- NO creative additions or removals
- Match the input floor plan pixel-for-pixel in structure
`;
}

// Include in finalPrompt construction
finalPrompt = `
${activePersona}
${tierConstraints}
...
`;
```

### Priority 4: Cleanup Legacy Code
**File**: `src/services/api.js`

Remove unused fields from request body:
```javascript
// DELETE these lines (71-85):
// controlnet: { ... },
// forensics: { ... }
```

### Priority 5: Consolidate Negative Prompts
**File**: `server/gemini.js`

Create single source of truth:
```javascript
const NEGATIVE_PROMPTS = {
    base: 'text, watermark, low quality, blurred, distorted structure',
    geometry: 'swapping furniture, wrong room types, extra walls, missing doors, structural changes',
    hallucination: 'hallucinated objects, phantom furniture, added plants, extra decorations',
    hd_strict: 'creative interpretation, artistic liberty, layout modifications, furniture repositioning'
};

// Usage in prompt construction
const negativeForTier = activeTierName === 'PREMIUM' 
    ? `${NEGATIVE_PROMPTS.base}, ${NEGATIVE_PROMPTS.geometry}, ${NEGATIVE_PROMPTS.hallucination}, ${NEGATIVE_PROMPTS.hd_strict}`
    : `${NEGATIVE_PROMPTS.base}, ${NEGATIVE_PROMPTS.geometry}`;
```

---

## 8. Testing Checklist

### Download Fix Validation
- [ ] Upload image, try download BEFORE generate → shows alert
- [ ] Generate render, download → saves correctly (check browser console for "[Download]" logs)
- [ ] Change style, generate again, download → correct filename
- [ ] If download fails, check console for error messages

### HD Hallucination Reduction
- [ ] Generate same floor plan with FREE tier → baseline
- [ ] Generate same floor plan with PREMIUM tier → compare layout accuracy
- [ ] Check specific issues: furniture swapping, wall additions, room type changes
- [ ] Verify console shows "STRICT generation config" with lower temperature values

### Style Consistency
- [ ] Test all 13 Signature styles with same floor plan
- [ ] Test all 17 Standard styles with same floor plan
- [ ] Compare: "Molten Copper" should NOT look like "Azure Sketch"

---

## 9. Update Log (December 14, 2025 - Session 2)

### Additional Fixes Applied

#### Download Flow Improved
- Rewrote `handleDownload` in `src/App.jsx` to use direct data URI download (more reliable)
- Added `requestAnimationFrame` for DOM synchronization
- Added comprehensive console logging for debugging
- Fallback to blob method if primary fails
- User-friendly error message if all methods fail

#### Generation Config Tightened (ALL Tiers)
| Tier | Temperature | TopP | TopK |
|------|-------------|------|------|
| FREE | 0.1 (was 0.2) | 0.7 (was 0.85) | 30 (was 40) |
| MID | 0.08 | 0.65 | 25 |
| PREMIUM | 0.05 (was 0.1) | 0.6 (was 0.7) | 20 (was 30) |
| ULTRA | 0.03 (was 0.05) | 0.5 (was 0.6) | 15 (was 25) |

#### Prompts Strengthened
- **Analysis Prompt**: Now explicitly asks for empty room identification and detailed furniture inventory
- **Layout Fidelity Constraints**: Applied to ALL tiers (not just HD) - walls, doors, furniture positions are "INVIOLABLE"
- **Unified Negative Prompt**: Comprehensive anti-hallucination terms including structural changes, furniture swapping, room type changes
- **Style Detection**: Expanded to cover sketch, wireframe, blueprint, draft, ink, graphite styles
- **Final Reminder**: Added explicit instruction at end of prompt to preserve all elements

#### Console Logging Added
- `[Gemini] STRICT generation config for {TIER}:` - shows exact temperature/topP/topK used
- `[Download] Starting download...` - shows download state and progress

---

## Appendix: File Reference

| Issue | File | Lines |
|-------|------|-------|
| Tier config | `server/config.js` | 59-101 |
| Generation config (hardcoded) | `server/gemini.js` | 324-333 |
| Prompt construction | `server/gemini.js` | 225-286 |
| Negative prompt default | `server/gemini.js` | 252 |
| Style loader | `server/styles.js` | 24-88 |
| Download bug | `src/App.jsx` | 156-176 |
| Legacy controlnet | `src/services/api.js` | 71-76 |
| Tier toggle UI | `src/components/Controls.jsx` | 69-94 |
