# MQT Multi-Tier Gemini Model Configuration

## Overview

Support multiple Gemini model tiers to give users flexibility based on budget, quality requirements, and usage volume. This allows MQT to scale from **completely free** prototyping to **premium production** quality.

---

## Tier Matrix

| Tier        | Analysis Model   | Generation Model       | Cost/Image | Free Limit | Best For                |
| ----------- | ---------------- | ---------------------- | ---------- | ---------- | ----------------------- |
| **FREE**    | Gemini 2.0 Flash | Gemini API Free Tier   | $0         | 100/day    | Prototyping, testing    |
| **MID**     | Gemini 2.5 Flash | Gemini 2.5 Flash Image | ~$0.0002   | None       | Production, high volume |
| **PREMIUM** | Gemini 3 Pro     | Imagen 3               | $0.032     | None       | Highest quality         |

---

## Tier 1: FREE (Recommended for Development/Testing)

### Configuration

```python
# config.py
MODEL_TIER = "FREE"
ANALYSIS_MODEL = "gemini-2.0-flash-exp"
GENERATION_MODEL = "gemini-2.0-flash-exp"  # Uses built-in image gen
USE_FREE_TIER = True
```

### Capabilities

**Analysis:**

- Gemini 2.0 Flash (FREE in AI Studio)
- Multimodal understanding
- Floor plan interpretation
- Rate limits: 15 RPM, 1500 RPD

**Generation:**

- **Gemini API Free Tier: 100 images/day**
- Access via Google AI Studio (no billing required)
- Quality: Good (suitable for testing/prototyping)
- Speed: ~8-12 seconds

### Pricing

- **Cost:** **$0** (completely free)
- **Limit:** 100 image generations per day
- **Billing:** No credit card required

### Implementation

```python
import google.generativeai as genai

def generate_free_tier(floor_plan: Image.Image, prompt: str) -> Image.Image:
    """
    Use Gemini free tier for image generation.
    No billing account required, 100 images/day limit.
    """
    # Configure for free tier (no billing)
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])

    # Use Gemini 2.0 Flash for analysis
    model = genai.GenerativeModel("gemini-2.0-flash-exp")

    # Analyze + generate in one call
    response = model.generate_content([
        floor_plan,
        f"Transform this floor plan into a 3D interior visualization: {prompt}"
    ])

    # Note: Free tier may require alternative approach
    # Consider using ImageFX (Imagen 3 free access) or
    # Gemini's "Nano Banana" image generation

    return response  # Parse image from response
```

### Limitations

- 100 images/day hard limit
- Lower quality than premium tiers
- No SLA guarantees
- Throttling during peak hours

---

## Tier 2: MID (Recommended for Production)

### Configuration

```python
# config.py
MODEL_TIER = "MID"
ANALYSIS_MODEL = "gemini-2.5-flash"
GENERATION_MODEL = "gemini-2.5-flash"
USE_FREE_TIER = False
```

### Capabilities

**Analysis:**

- Gemini 2.5 Flash
- Enhanced multimodal understanding
- Faster processing
- Rate limits: 100 RPM, 10000 RPD

**Generation:**

- Gemini 2.5 Flash Image ("Nano Banana")
- Character consistency
- Enhanced quality vs free tier
- Speed: ~5-10 seconds

### Pricing

**Token-based pricing:**

- Input: $0.075 per 1M tokens (< 128k context)
- Output: $0.30 per 1M tokens
- Images: ~$0.0001875 per image (estimated)

**Monthly cost estimate (1000 images):**

- Analysis: ~$0.10 (token usage)
- Generation: ~$0.19
- **Total: ~$0.29** vs FREE tier ($0) or PREMIUM ($32)

### Implementation

```python
def generate_mid_tier(floor_plan: Image.Image, prompt: str) -> Image.Image:
    """
    Use Gemini 2.5 Flash for cost-effective production generation.
    Requires billing enabled.
    """
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])

    # Gemini 2.5 Flash with image generation
    model = genai.GenerativeModel("gemini-2.5-flash")

    response = model.generate_content([
        floor_plan,
        {
            "prompt": prompt,
            "generation_config": {
                "temperature": 0.7,
                "candidate_count": 1
            }
        }
    ])

    return extract_image_from_response(response)
```

---

## Tier 3: PREMIUM (Recommended for Highest Quality)

### Configuration

```python
# config.py
MODEL_TIER = "PREMIUM"
ANALYSIS_MODEL = "gemini-2.0-flash-exp"  # Cost-effective analysis
GENERATION_MODEL = "imagen-3.0-generate-001"  # Premium generation
USE_FREE_TIER = False
```

### Capabilities

**Analysis:**

- Gemini 2.0 Flash (cost-effective for analysis)
- Multimodal floor plan understanding

**Generation:**

- **Imagen 3** (Google's flagship image model)
- Photorealistic quality
- SynthID watermarking
- Aspect ratio control
- Safety filters

### Pricing

- Gemini 2.0 Flash analysis: ~$0.002
- **Imagen 3 generation: $0.03 per image**
- **Total: $0.032 per generation**

**Monthly cost estimate (1000 images):**

- Analysis: $2
- Generation: $30
- **Total: $32**

### Implementation

```python
def generate_premium_tier(floor_plan: Image.Image, prompt: str) -> Image.Image:
    """
    Use Imagen 3 for highest quality architectural visualization.
    """
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])

    # Step 1: Analyze with Gemini 2.0 Flash
    model = genai.GenerativeModel("gemini-2.0-flash-exp")
    analysis = model.generate_content([
        floor_plan,
        "Analyze this floor plan: describe layout, rooms, spatial relationships"
    ])

    # Step 2: Generate with Imagen 3
    imagen = genai.ImageGenerationModel("imagen-3.0-generate-001")
    enhanced_prompt = f"{analysis.text}\n\n{prompt}"

    result = imagen.generate_images(
        prompt=enhanced_prompt,
        number_of_images=1,
        aspect_ratio="1:1",
        safety_filter_level="block_few"
    )

    return result.images[0]._pil_image
```

---

## Configuration System

### Environment Variables

```bash
# .env
GEMINI_API_KEY=your_api_key_here

# Model Tier Selection (FREE | MID | PREMIUM)
MODEL_TIER=FREE

# Tier-specific models (auto-selected based on tier)
# Optional manual override:
# ANALYSIS_MODEL=gemini-2.0-flash-exp
# GENERATION_MODEL=imagen-3.0-generate-001
```

### Config Class

```python
# config.py
class ModelConfig:
    TIER = os.getenv("MODEL_TIER", "FREE").upper()

    # Tier definitions
    TIERS = {
        "FREE": {
            "analysis_model": "gemini-2.0-flash-exp",
            "generation_model": "gemini-2.0-flash-exp",  # Or use ImageFX
            "requires_billing": False,
            "daily_limit": 100,
            "cost_per_image": 0.0,
            "quality": "Good"
        },
        "MID": {
            "analysis_model": "gemini-2.5-flash",
            "generation_model": "gemini-2.5-flash",
            "requires_billing": True,
            "daily_limit": None,
            "cost_per_image": 0.0002,
            "quality": "Very Good"
        },
        "PREMIUM": {
            "analysis_model": "gemini-2.0-flash-exp",
            "generation_model": "imagen-3.0-generate-001",
            "requires_billing": True,
            "daily_limit": None,
            "cost_per_image": 0.032,
            "quality": "Excellent"
        }
    }

    @classmethod
    def get_tier_config(cls) -> dict:
        """Get configuration for selected tier."""
        return cls.TIERS.get(cls.TIER, cls.TIERS["FREE"])

    @classmethod
    def get_analysis_model(cls) -> str:
        """Get model for floor plan analysis."""
        return os.getenv("ANALYSIS_MODEL") or cls.get_tier_config()["analysis_model"]

    @classmethod
    def get_generation_model(cls) -> str:
        """Get model for image generation."""
        return os.getenv("GENERATION_MODEL") or cls.get_tier_config()["generation_model"]
```

---

## Unified Generation Function

```python
async def generate_visualization(
    floor_plan: Image.Image,
    style_preset_id: str,
    user_prompt: str = ""
) -> tuple[Image.Image, dict]:
    """
    Generate visualization using configured tier.
    Automatically selects appropriate models based on MODEL_TIER.
    """
    tier_config = ModelConfig.get_tier_config()

    # Route to appropriate tier handler
    if ModelConfig.TIER == "FREE":
        return await generate_free_tier(floor_plan, style_preset_id, user_prompt)
    elif ModelConfig.TIER == "MID":
        return await generate_mid_tier(floor_plan, style_preset_id, user_prompt)
    else:  # PREMIUM
        return await generate_premium_tier(floor_plan, style_preset_id, user_prompt)
```

---

## Automatic Tier Detection

```python
def detect_optimal_tier() -> str:
    """
    Automatically detect optimal tier based on API key capabilities.
    """
    try:
        # Check if billing is enabled
        genai.configure(api_key=os.environ["GEMINI_API_KEY"])

        # Try to list models (billing required for some)
        models = genai.list_models()

        # Check for Imagen 3 availability
        if any("imagen-3" in m.name for m in models):
            return "PREMIUM"

        # Check for paid Gemini models
        if any("gemini-2.5" in m.name for m in models):
            return "MID"

        # Default to free tier
        return "FREE"

    except Exception:
        # If detection fails, use FREE tier
        return "FREE"
```

---

## Usage Tracking & Limits

```python
from collections import defaultdict
from datetime import datetime, timedelta

class UsageTracker:
    """Track daily usage for free tier compliance."""

    def __init__(self):
        self.usage = defaultdict(int)
        self.reset_date = datetime.now().date()

    def check_limit(self, tier: str) -> bool:
        """Check if user is within daily limit."""
        if tier != "FREE":
            return True  # No limit for paid tiers

        # Reset counter if new day
        today = datetime.now().date()
        if today > self.reset_date:
            self.usage.clear()
            self.reset_date = today

        # Check free tier limit (100/day)
        return self.usage["daily"] < 100

    def increment(self):
        """Increment usage counter."""
        self.usage["daily"] += 1

# Global tracker
usage_tracker = UsageTracker()

@app.post("/api/generate")
async def generate_image(req: GenerationRequest):
    """Generation endpoint with tier-based limits."""
    tier = ModelConfig.TIER

    # Check usage limits
    if not usage_tracker.check_limit(tier):
        raise HTTPException(
            status_code=429,
            detail=f"Daily limit reached for {tier} tier. Upgrade to MID or PREMIUM for unlimited usage."
        )

    # Generate...
    result = await generate_visualization(...)

    # Track usage
    usage_tracker.increment()

    return result
```

---

## Recommendation Matrix

| Use Case                 | Recommended Tier    | Reason                        |
| ------------------------ | ------------------- | ----------------------------- |
| Local development        | **FREE**            | No cost, good for testing     |
| MVP/Demo                 | **FREE** or **MID** | Start free, upgrade if needed |
| Production (low volume)  | **MID**             | Best cost/quality ratio       |
| Production (high volume) | **MID**             | Extremely low per-image cost  |
| Premium product          | **PREMIUM**         | Highest quality output        |
| Client deliverables      | **PREMIUM**         | Professional quality          |

---

## Migration Path

**Phase 1:** Start with **FREE** tier

- Validate MQT functionality
- Test with real floor plans
- Confirm quality meets needs

**Phase 2:** Scale to **MID** tier

- Enable billing
- Remove daily limits
- Maintain low costs ($0.29/1000 images)

**Phase 3:** Upgrade to **PREMIUM** tier (optional)

- When quality is critical
- For client-facing applications
- Professional architectural visualization

---

_Multi-tier configuration enables MQT to serve everyone from hobbyists to professional architects._
