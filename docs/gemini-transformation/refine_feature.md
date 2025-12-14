# "Refine Further" Feature Specification

## Overview

Post-generation iterative refinement system that allows users to progressively enhance their architectural visualizations without starting from scratch. Leverages Gemini's multi-turn conversation capabilities.

---

## User Flow

```
Upload Floor Plan
       ↓
Select Style Preset
       ↓
Generate Visualization
       ↓
[COMPARISON VIEW - Original vs Generated]
       ↓
    SATISFIED? ──YES→ Download
       ↓ NO
   REFINE FURTHER
       ↓
[Choose refinement type]
       ↓
Updated Generation
       ↓
[Compare: Original | Previous | New]
       ↓
Loop back or Download
```

---

## Refinement Options

### Default UI: Intensity Slider (Primary Control)

**Main refinement control** - Always visible after generation

```
┌────────────────────────────────────────┐
│  Refine Result:                        │
│                                        │
│  Less intense ◄───●───► More intense  │
│  [-50%]        [0%]        [+50%]     │
│                                        │
│  [Apply Refinement]    [...MORE]      │
└────────────────────────────────────────┘
```

**Slider adjusts:**

- Style intensity (subtle ↔ dramatic)
- Detail level (minimal ↔ rich)
- Overall enhancement strength

**Simple workflow:**

1. User drags slider left/right
2. Clicks "Apply Refinement"
3. New version generates with adjusted intensity

---

### Advanced Options: "MORE" Menu

**Accessed via:** "...MORE" button (collapsed by default)

**Expands to show:**

#### 1. Refine with Text Prompt

**UI:** Text input field
**Examples:**

- "Add more plants and greenery"
- "Make the lighting warmer"
- "Include modern furniture"
- "Change wall color to light gray"

#### 2. Try Different Style

**UI:** Quick style picker dropdown
**Action:** Apply different preset to same floor plan
**Options:** List of all available style presets

#### 3. Lighting Adjustment

**UI:** Preset buttons or slider
**Options:**

- Golden hour
- Bright daylight
- Moody evening
- Studio lighting
- Custom (brightness slider)

#### 4. Detail Control

**UI:** Toggle or slider
**Options:**

- More detail (add architectural elements, textures)
- Simplify (reduce clutter, minimalist)

#### 5. Material Swap (Advanced)

**UI:** Dropdowns for each category
**Options:**

- Flooring: Wood / Tile / Marble / Concrete
- Walls: Paint / Wallpaper / Texture / Exposed brick
- Fixtures: Modern / Industrial / Classic / Minimalist

---

## Technical Implementation

### API Endpoint: `/api/refine`

**Request:**

```json
{
  "original_image": "base64_floor_plan",
  "previous_result": "base64_previous_generation",
  "refinement_type": "prompt", // or "style", "lighting", "detail"
  "refinement_value": "Add more natural light and plants",
  "style_id": "modern_minimalist",
  "generation_history": [
    {
      "timestamp": "2025-12-11T15:00:00Z",
      "prompt": "Initial generation",
      "image_id": "gen_001"
    }
  ]
}
```

**Response:**

```json
{
  "status": "success",
  "image": "data:image/png;base64,...",
  "meta": {
    "refinement_iteration": 2,
    "changes_applied": ["Increased natural lighting", "Added indoor plants"],
    "prompt_used": "..."
  }
}
```

### Backend Logic

```python
async def refine_generation(
    original_floor_plan: Image.Image,
    previous_result: Image.Image,
    refinement_request: RefinementRequest
) -> tuple[Image.Image, dict]:
    """
    Iteratively refine generated visualization.
    """
    # Build refinement prompt based on type
    if refinement_request.refinement_type == "prompt":
        refinement_instruction = refinement_request.refinement_value

    elif refinement_request.refinement_type == "lighting":
        refinement_instruction = f"Adjust lighting to be {refinement_request.refinement_value}"

    elif refinement_request.refinement_type == "detail":
        if refinement_request.refinement_value == "more":
            refinement_instruction = "Add more architectural details, textures, and decorative elements"
        else:
            refinement_instruction = "Simplify the design, remove clutter, make it more minimalist"

    # Use Gemini's multi-turn conversation
    model = genai.GenerativeModel("gemini-2.0-flash-exp")

    # Provide context with both images
    response = model.generate_content([
        "You previously generated this architectural visualization:",
        previous_result,
        "From this floor plan:",
        original_floor_plan,
        f"Now refine it based on this instruction: {refinement_instruction}",
        "Maintain the overall composition but apply the requested changes."
    ])

    # Generate refined version
    # (Implementation depends on available Gemini image editing capabilities)

    return refined_image, metadata
```

---

## Generation History

**Storage:** Client-side (localStorage or session state)  
**Limit:** Last 3 iterations  
**Purpose:** Allow user to compare and revert

**UI Display:**

```
┌─────────────────────────────────────┐
│  Iteration History                  │
│  [Original] [Gen 1] [Gen 2] [Gen 3] │
│     ↓          ↓       ↓       ↓    │
│   [thumb]  [thumb] [thumb] [thumb]  │
└─────────────────────────────────────┘
```

Click any thumbnail to:

- View in comparison split-view
- Use as refinement base
- Download

---

## UX Considerations

### Progressive Enhancement

1. **First generation:** Standard workflow
2. **After generation:** "Refine Further" button appears
3. **During refinement:** Show "Building on previous result..."
4. **After refinement:** Show before/after comparison

### Visual Feedback

- Highlight what changed between iterations
- Show refinement instructions in metadata
- Indicate iteration number (Gen 1, Gen 2, etc.)

### Performance

- Cache previous results (avoid re-uploading)
- Show previous result immediately while refining
- Stream refinement progress if possible

---

## Refinement UI Mockup (Slider-First Design)

```
┌────────────────────────────────────────────────────┐
│  Comparison View (Slider)                          │
│  ┌──────────────────────────────────────────────┐  │
│  │          Original  │  Generated              │  │
│  │                    ◄═════●════►               │  │
│  │                                               │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  ✨ Refine Further:                               │
│                                                    │
│  Intensity:  Less ◄────●────► More               │
│              [-50%]   [0%]   [+50%]              │
│                                                    │
│  [Apply Refinement]           [...MORE ▼]         │
│                                                    │
│  ┌─ MORE Options (Collapsed) ──────────────────┐  │
│  │ 📝 Refine with text prompt                 │  │
│  │ 🎨 Try different style                     │  │
│  │ 💡 Adjust lighting                         │  │
│  │ ✨ Detail control                          │  │
│  │ 🏗️  Material swap                          │  │
│  └────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

**Default State:** Slider visible, MORE collapsed  
**Expanded State:** Clicking MORE reveals advanced options

---

## Cost Implications

**Per Refinement:**

- FREE tier: Counts toward 100/day limit
- MID tier: ~$0.0002 per refinement
- PREMIUM tier: $0.032 per refinement

**Optimization:**

- Refine using MID tier (Gemini 2.5 Flash)
- Only use PREMIUM for final download if needed
- Cache previous results to avoid re-processing

---

## Future Enhancements

1. **A/B Comparison:** Generate 2 variations, let user choose
2. **Undo/Redo:** Step backward through refinements
3. **Refinement Templates:** Pre-defined common adjustments
4. **Batch Refinement:** Apply same refinement to multiple generations
5. **AI Suggestions:** "Try these refinements..." based on image analysis

---

_Refine Further enables professional-quality iterative design workflows_
