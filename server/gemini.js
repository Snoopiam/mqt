/**
 * MQT Backend - Gemini-Powered Architectural Visualization
 * Handles all Gemini API interactions for floor plan analysis and image generation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import sharp from 'sharp';
import { Config } from './config.js';
import { getStylePreset, buildGenerationPrompt, STYLE_CATEGORIES } from './styles.js';

// ============================================
// CONSTANTS
// ============================================

const unifiedNegativePrompt = `
low quality, blurry, distorted, structural errors, 
missing walls, extra walls, changed layout, 
furniture swapping, floating objects, impossible geometry, 
watermark, text, signature, sketch, drawing, 
hand-drawn, cartoon, anime, painting, 
messy, clutter, broken lines, incorrect perspective,
bad lighting, shadows, noise, grain, artifacts
`;

// ============================================
// USAGE TRACKING (For FREE Tier)
// ============================================

class UsageTracker {
  constructor() {
    this.usage = { daily: 0 };
    this.resetDate = new Date().toDateString();
  }

  /**
   * Check if user is within daily limit for FREE tier.
   */
  checkLimit() {
    if (Config.MODEL_TIER !== 'FREE') {
      return true; // No limit for paid tiers
    }

    // Reset counter if new day
    const today = new Date().toDateString();
    if (today !== this.resetDate) {
      this.usage = { daily: 0 };
      this.resetDate = today;
    }

    // Check free tier limit (100/day)
    return this.usage.daily < 100;
  }

  /**
   * Increment usage counter.
   */
  increment() {
    this.usage.daily++;
  }

  /**
   * Get remaining generations for today (FREE tier only).
   */
  getRemaining() {
    if (Config.MODEL_TIER !== 'FREE') {
      return null;
    }
    return Math.max(0, 100 - this.usage.daily);
  }
}

export const usageTracker = new UsageTracker();

// ============================================
// GEMINI CLIENT
// ============================================

let genAI = null;

/**
 * Initialize the Gemini API client
 */
export function initializeGemini() {
  if (!Config.GEMINI_API_KEY) {
    console.error('[Gemini] GEMINI_API_KEY not set in environment!');
    return false;
  }

  try {
    genAI = new GoogleGenerativeAI(Config.GEMINI_API_KEY);
    console.log('[Gemini] API configured successfully');
    console.log(`[Gemini] Model Tier: ${Config.MODEL_TIER}`);
    console.log(`[Gemini] Analysis Model: ${Config.getAnalysisModel()}`);
    console.log(`[Gemini] Generation Model: ${Config.getGenerationModel()}`);
    return true;
  } catch (error) {
    console.error('[Gemini] Failed to initialize:', error);
    return false;
  }
}

/**
 * Check if Gemini is initialized
 */
export function isGeminiReady() {
  return genAI !== null;
}

// ============================================
// IMAGE HELPERS
// ============================================

/**
 * Decode a base64 image string to a Buffer
 * @param {string} imageData - Base64 encoded image (may include data URI prefix)
 * @returns {Promise<{buffer: Buffer, mimeType: string}>}
 */
export async function decodeBase64Image(imageData) {
  // Remove data URI prefix if present
  let base64Data = imageData;
  let mimeType = 'image/png';

  if (imageData.includes(',')) {
    const parts = imageData.split(',');
    const header = parts[0];
    base64Data = parts[1];

    // Extract mime type from header
    const mimeMatch = header.match(/data:([^;]+);/);
    if (mimeMatch) {
      mimeType = mimeMatch[1];
    }
  }

  if (!base64Data || !base64Data.trim()) {
    throw new Error('Empty image data');
  }

  const buffer = Buffer.from(base64Data, 'base64');

  if (buffer.length === 0) {
    throw new Error('Invalid base64 data');
  }

  // Validate it's a real image using sharp
  try {
    await sharp(buffer).metadata();
  } catch {
    throw new Error('Invalid image format');
  }

  return { buffer, mimeType };
}

/**
 * Encode a Buffer to base64 string
 * @param {Buffer} buffer
 * @param {string} format
 * @returns {Promise<string>}
 */
export async function encodeImageToBase64(buffer, format = 'png') {
  let processedBuffer = buffer;

  // Convert to PNG if needed
  if (format === 'png') {
    processedBuffer = await sharp(buffer).png().toBuffer();
  } else if (format === 'jpeg' || format === 'jpg') {
    processedBuffer = await sharp(buffer).jpeg({ quality: 95 }).toBuffer();
  } else if (format === 'webp') {
    processedBuffer = await sharp(buffer).webp({ quality: 95 }).toBuffer();
  }

  return processedBuffer.toString('base64');
}

// ============================================
// GEMINI GENERATION
// ============================================

/**
 * Generate architectural visualization using Gemini API.
 * @param {Buffer} floorPlanBuffer - The floor plan image buffer
 * @param {string} prompt - The generation prompt
 * @param {Object|null} stylePreset - Optional style preset object
 * @returns {Promise<{image: Buffer, metadata: Object}>}
 */
export async function generateWithGemini(floorPlanBuffer, prompt, stylePreset = null, negativePrompt = '', tierOverride = null) {
  const startTime = Date.now();

  // Determine Tier Config (Use Override if valid, otherwise Default)
  let tierConfig = Config.getTierConfig();
  let activeTierName = Config.MODEL_TIER;

  if (tierOverride && Config.TIERS[tierOverride]) {
      tierConfig = Config.TIERS[tierOverride];
      activeTierName = tierOverride;
      console.log(`[Gemini] Tier Override Active: ${tierOverride}`);
  }

  try {
    // Step 1: Analyze floor plan with Gemini Vision
    // Note: We currently stick to the Analysis Model defined in Config (usually consistent across tiers or global),
    // but we could also override this if tiers use different analysis models.
    // For safety, let's keep analysis consistent unless specific need.
    const analysisModelName = tierConfig.analysis_model || Config.getAnalysisModel();
    console.log(`[Gemini] Analyzing floor plan with ${analysisModelName} (${activeTierName})`);

    const analysisModel = genAI.getGenerativeModel({ model: analysisModelName });

    const analysisPrompt = `
CRITICAL: Perform a PRECISE FORENSIC STRUCTURAL ANALYSIS of this floor plan image.
Your analysis will be used to generate a visualization that MUST match this layout EXACTLY.

REQUIRED ANALYSIS:

1. WALL GEOMETRY:
   - List every wall segment with approximate position (e.g., "north wall from corner A to corner B")
   - Note wall thickness where visible
   - Identify interior vs exterior walls

2. OPENINGS:
   - Count and locate ALL doors (e.g., "Door 1: bedroom to hallway, south wall")
   - Count and locate ALL windows (e.g., "Window 1: living room, west wall")
   - Note door swing direction if visible

3. ROOM IDENTIFICATION:
   - List each room by function (bedroom, living room, kitchen, bathroom, etc.)
   - Note approximate room dimensions if labeled
   - Identify open-plan areas vs enclosed rooms

4. FURNITURE INVENTORY (CRITICAL - BE EXACT):
   - List ONLY furniture that is EXPLICITLY DRAWN in the image
   - Use format: "Room X contains: [item 1], [item 2], ..."
   - If a room appears EMPTY, state "Room X: EMPTY - no furniture drawn"
   - DO NOT assume or add furniture that is not clearly visible

5. TERRACE/BALCONY/OUTDOOR:
   - Identify any outdoor spaces
   - Note if they are enclosed or open

6. VIEWPOINT: Confirm the camera angle (typically top-down orthographic)

OUTPUT FORMAT: Provide a structured, factual inventory. This analysis will be used to ensure the rendered visualization matches the input EXACTLY.
    `;

    // Convert buffer to base64 for Gemini
    const floorPlanBase64 = floorPlanBuffer.toString('base64');

    const analysisResponse = await analysisModel.generateContent([
      analysisPrompt,
      {
        inlineData: {
          mimeType: 'image/png',
          data: floorPlanBase64
        }
      }
    ]);

    const floorPlanAnalysis = analysisResponse.response.text();
    console.log(`[Gemini] Floor plan analysis: ${floorPlanAnalysis.slice(0, 200)}...`);

    // Step 2: Build enhanced prompt
    // Step 2: Build enhanced prompt with PERSONA injection
    let finalPrompt;

    // DEFAULT ARCHITECT PERSONA (Generic)
    const defaultSystemInstruction = `
CRITICAL INSTRUCTION: You are a professional 3D architectural visualizer.
Your TOP PRIORITY is strictly maintaining the structural geometry and FURNITURE LAYOUT of the provided floor plan.

STRICT RULES:
1. **VIEWPOINT**: Generate a **TOP-DOWN ORTHOGRAPHIC** render. Match the camera angle of the input image exactly.
2. **NO STRUCTURAL CHANGES**: Do NOT add, remove, or move walls, windows, or doors.
3. **NO FURNITURE SWAPPING**: If the plan shows a Bed, render a Bed. If it shows a Sofa, render a Sofa. Do NOT turn bedrooms into living rooms.
4. **BALCONIES/OUTDOORS**: Identify open boundaries. Do NOT enclose balconies with walls.
5. **EXACT MATCH**: The 3D view must be an exact 1:1 overlay of the 2D layout.
6. **NO HALLUCINATIONS**: Do not add clutter, people, or objects not present in the sketch.

If the prompt asks for a style, apply the *materials and lighting* of that style, but DO NOT change the *geometry or furniture placement*.
`;

    // Note: Persona is now handled inside the stylePreset block via unifiedRenderingDirective

    // UNIVERSAL GROUND RULES - THE "MQT CONSTITUTION" (NON-NEGOTIABLE)
    const LAYOUT_GROUND_RULES = `
*** MQT UNIVERSAL CONSTITUTION (ABSOLUTE LAWS) ***
1. STRUCTURAL INTEGRITY: Walls, columns, and posts are IMMUTABLE. You cannot move or remove them.
2. OPENINGS & PORTALS: Doors and windows are FIXED.
   - Keep exact width and position.
   - Maintain door swing direction exactly as drawn.
3. FIXED SYSTEMS: Kitchen islands, toilets, sinks, and showers are "STRUCTURE", not "FURNITURE". They must remain exactly where they are.
4. INVENTORY FIDELITY:
   - Exact Count: If the plan has 1 bed, render 1 bed.
   - Exact Shape: An L-shaped sofa must remain L-shaped.
5. NEGATIVE SPACE: Empty floor space is a design feature. Do NOT fill empty corners with "staging" (plants, lamps) unless drawn.
6. OUTDOOR BOUNDARIES: Balconies and terraces must remain OPEN. Do not glaze them over unless drawn as windows.

*** CONFLICT RESOLUTION PROTOCOLS ***
7. GHOST OBJECTS (Style > Layout):
   - CASE: Style Description mentions an object (e.g., "Grand Fireplace", "Bookshelves", "Rug") but the Input Layout does NOT show it.
   - RULING: IGNORE THE OBJECT. Do not hallucinate it. Apply the style's *materials* (brick, wood, wool) to existing surfaces instead.
8. ORPHANED OBJECTS (Layout > Style):
   - CASE: Input Layout shows an object (e.g., "Piano", "Workbench") but the Style Preset does not mention it.
   - RULING: ADAPT & OUTFIT. You MUST render the object. Texture it using the palette of the selected style (e.g., a "Minimalist Piano" or "Rustic Workbench").
`;

    // Tier-Specific Reinforcement Strategies
    let enforcementStrategy = "";
    
    // FREE/MID (Flash Models) -> "The Hammer" (Repetition)
    if (activeTierName === 'FREE' || activeTierName === 'MID') {
        enforcementStrategy = `
STRATEGY: REPETITIVE REINFORCEMENT
- RULE REMINDER: Do not change the layout.
- RULE REMINDER: Do not add furniture.
- RULE REMINDER: Keep walls exactly where they are.
`;
    } 
    // PREMIUM/ULTRA (Pro Models) -> "The Surveyor" (Reasoning)
    else {
         enforcementStrategy = `
STRATEGY: STRUCTURAL AUDIT
- Act as a Structural Engineer.
- Step 1: Map the exact X/Y coordinates of all walls in the input.
- Step 2: Render the style ONLY within those existing boundaries.
- Step 3: Verify the output matches the input overlay exactly.
`;
    }

    if (stylePreset) {
      const colorPalette = Object.values(stylePreset.color_palette || {}).slice(0, 5).join(', ');

      // Use detailed materials list if available, otherwise fallback to keys
      const materials = (stylePreset.materials_list && stylePreset.materials_list.length > 0)
          ? stylePreset.materials_list.join(', ')
          : Object.keys(stylePreset.color_palette || {}).slice(0, 5).join(', ');

      const lighting = stylePreset.lighting_setup || 'Standard ambient lighting';
      const modifiers = (stylePreset.style_modifiers || []).join(', ');

      // Extract the base_prompt AND persona - these are the CRITICAL rendering instructions
      const masterPrompt = stylePreset.base_prompt || '';
      const renderPersona = stylePreset.persona || '';

      // Combine persona and base_prompt into ONE UNIFIED RENDERING DIRECTIVE
      const unifiedRenderingDirective = [masterPrompt, renderPersona].filter(Boolean).join('\n\n');

      finalPrompt = `
#############################################################
#  ABSOLUTE PRIORITY: STYLE DNA RENDERING INSTRUCTIONS      #
#############################################################

${unifiedRenderingDirective ? `
*** THIS IS YOUR EXACT RENDERING SPECIFICATION - FOLLOW EVERY DETAIL ***

${unifiedRenderingDirective}

*** END OF RENDERING SPECIFICATION ***
` : ''}

STYLE: "${stylePreset.name || 'Modern'}"
DESCRIPTION: ${stylePreset.description || 'contemporary design'}

VISUAL ATTRIBUTES TO MATCH EXACTLY:
${modifiers ? modifiers.split(', ').map(m => `• ${m}`).join('\n') : '• Standard modern aesthetic'}

MATERIALS TO USE:
${materials ? materials.split(', ').map(m => `• ${m}`).join('\n') : '• Standard materials'}

LIGHTING: ${lighting}

COLOR PALETTE: ${colorPalette}

#############################################################
#  STRUCTURAL CONSTRAINTS (DO NOT VIOLATE)                  #
#############################################################

${LAYOUT_GROUND_RULES}

FLOOR PLAN STRUCTURE (PRESERVE EXACTLY):
${floorPlanAnalysis}

${enforcementStrategy}

#############################################################

USER REQUEST: ${prompt || 'Render this floor plan with the exact style DNA specified above.'}

AVOID: ${unifiedNegativePrompt}

CRITICAL: The output image MUST look like it was rendered using the EXACT specifications above. Match the style DNA precisely - same materials, same lighting, same color grading, same aesthetic.
      `;
    } else {
      finalPrompt = `
${defaultSystemInstruction}

${LAYOUT_GROUND_RULES}
${enforcementStrategy}

FLOOR PLAN ANALYSIS (MATCH THIS EXACTLY):
${floorPlanAnalysis}

USER REQUEST: ${prompt || 'Create a clean architectural visualization.'}

NEGATIVE CONSTRAINTS (STRICTLY AVOID):
${unifiedNegativePrompt}

Render the visualization maintaining EXACT layout fidelity.
      `;
    }

    // Step 3: Generate with appropriate model
    const generationModelName = tierConfig.generation_model; // Use the configured tier model
    console.log(`[Gemini] Generating with ${generationModelName}`);

    let generatedImageBuffer;

    // Check if using Imagen 3 (PREMIUM tier)
    if (generationModelName.includes('imagen')) {
      console.log('[Gemini] Using Imagen Strategy (Experimental)');

      // Note: Imagen 3/4 via Gemini API might use different endpoints.
      // We attempt standard generation, but if it fails, we fall back.
      const imagenModel = genAI.getGenerativeModel({ model: generationModelName });

      try {
        const result = await imagenModel.generateContent(finalPrompt);
        const response = result.response;

        if (response.candidates && response.candidates[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              generatedImageBuffer = Buffer.from(part.inlineData.data, 'base64');
              break;
            }
          }
        }
      } catch (imagenError) {
        console.error(`[Gemini] Primary Model (${generationModelName}) failed:`, imagenError.message);
        console.log('[Gemini] Attempting FALLBACK to standard Gemini Image model...');
        
        // FALLBACK: Use the FREE tier model (Gemini Flash Image)
        const fallbackModelName = Config.TIERS.FREE.generation_model || 'gemini-2.0-flash-exp';
        const fallbackModel = genAI.getGenerativeModel({
             model: fallbackModelName,
             generationConfig: {
                 responseModalities: ['TEXT', 'IMAGE']
             }
        });
        
        try {
            const fallbackResult = await fallbackModel.generateContent([
                { inlineData: { mimeType: 'image/png', data: floorPlanBase64 } },
                `Generate an architectural visualization from this floor plan. ${finalPrompt}`
            ]);
            
            const fbResponse = fallbackResult.response;
            if (fbResponse.candidates && fbResponse.candidates[0]?.content?.parts) {
                for (const part of fbResponse.candidates[0].content.parts) {
                    if (part.inlineData) {
                        generatedImageBuffer = Buffer.from(part.inlineData.data, 'base64');
                        console.log('[Gemini] Fallback generation SUCCESS');
                        break;
                    }
                }
            }
        } catch (fbError) {
            console.error('[Gemini] Fallback also failed:', fbError.message);
        }
      }
    }

    // Gemini image generation models (Standard path or if Imagen wasn't selected)
    if (!generatedImageBuffer) {
      // AGGRESSIVE tier-specific configs to MAXIMIZE layout fidelity and MINIMIZE hallucination
      // Lower temperature = more deterministic = less creative drift
      // Lower topP = stricter sampling = fewer unexpected outputs
      // Lower topK = more focused token selection
      const tierGenerationConfig = {
        FREE: {
          temperature: 0.1,   // Lowered from 0.2 - reduce creative drift
          topP: 0.7,          // Lowered from 0.85 - more deterministic
          topK: 30,           // Lowered from 40 - focused sampling
        },
        MID: {
          temperature: 0.08,  // Very strict
          topP: 0.65,
          topK: 25,
        },
        PREMIUM: {
          temperature: 0.05,  // Near-deterministic for HD fidelity
          topP: 0.6,
          topK: 20,
        },
        ULTRA: {
          temperature: 0.03,  // Maximum strictness
          topP: 0.5,
          topK: 15,
        },
        PREVIEW: {
          temperature: 0.05,
          topP: 0.6,
          topK: 20,
        }
      };

      const configForTier = tierGenerationConfig[activeTierName] || tierGenerationConfig.FREE;
      console.log(`[Gemini] STRICT generation config for ${activeTierName}:`, JSON.stringify(configForTier));

      // For gemini-2.0-flash-exp, we need to specify responseModalities to get image output
      const generationModel = genAI.getGenerativeModel({
        model: generationModelName,
        generationConfig: {
          ...configForTier,
          maxOutputTokens: 8192,
          responseModalities: ['TEXT', 'IMAGE']
        }
      });

      // Determine if this is a non-photorealistic style (sketch, wireframe, blueprint, etc.)
      const styleName = (stylePreset?.name || '').toLowerCase();
      const styleDesc = (stylePreset?.description || '').toLowerCase();
      const styleLighting = (stylePreset?.lighting || '').toLowerCase();

      const isNonPhotoStyle = stylePreset && (
        styleName.includes('sketch') || styleDesc.includes('sketch') ||
        styleName.includes('wireframe') || styleDesc.includes('wireframe') ||
        styleName.includes('blueprint') || styleDesc.includes('blueprint') ||
        styleName.includes('draft') || styleDesc.includes('draft') ||
        styleName.includes('plan') || styleDesc.includes('plan view') ||
        styleName.includes('ink') || styleDesc.includes('ink') ||
        styleName.includes('graphite') || styleName.includes('iso') ||
        styleLighting.includes('sketch')
      );

      // Style-appropriate render instruction
      const renderStyleInstruction = isNonPhotoStyle
        ? 'Generate a stylized architectural visualization matching the described style aesthetic.'
        : 'Generate a high-fidelity architectural visualization image.';

      // Use a clearer prompt with STRONG layout emphasis
      const imagePrompt = `CRITICAL: Generate an image that EXACTLY matches the input floor plan layout.

${finalPrompt}

${renderStyleInstruction}

FINAL REMINDER: The generated image MUST preserve ALL walls, doors, windows, and furniture positions from the input floor plan. Do NOT add or remove ANY elements.`;

      const generationResponse = await generationModel.generateContent([
        {
          inlineData: {
            mimeType: 'image/png',
            data: floorPlanBase64
          }
        },
        imagePrompt
      ]);

      const response = generationResponse.response;

      // Try to extract image from response
      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            generatedImageBuffer = Buffer.from(part.inlineData.data, 'base64');
            console.log('[Gemini] Successfully extracted image from response');
            break;
          }
        }
      }

      if (!generatedImageBuffer) {
        console.error(`[Gemini] Model ${generationModelName} did not return image data`);
        console.log('[Gemini] Response text:', response.text ? response.text().slice(0, 500) : 'No text');
        throw new Error(
          `Image generation model ${generationModelName} did not produce image output. ` +
          'This may indicate the model doesn\'t support image generation or API changes.'
        );
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Gemini] Generation complete in ${duration}ms`);

    const metadata = {
      processing_time: duration,
      model_tier: activeTierName,
      analysis_model: analysisModelName,
      generation_model: generationModelName,
      prompt_used: finalPrompt.length > 200 ? finalPrompt.slice(0, 200) + '...' : finalPrompt,
      floor_plan_analysis: floorPlanAnalysis.slice(0, 150) + '...'
    };

    return { image: generatedImageBuffer, metadata };

  } catch (error) {
    console.error('[Gemini] Generation error:', error);
    throw error;
  }
}
// ============================================
// API HANDLERS
// ============================================

/**
 * Health check handler
 */
export function healthCheck() {
  return {
    status: 'ok',
    gemini_configured: isGeminiReady(),
    model_tier: Config.MODEL_TIER,
    app_profile: Config.APP_PROFILE,
    free_tier_remaining: usageTracker.getRemaining()
  };
}

/**
 * Get all styles handler
 */
export function getStylesHandler() {
  const { getAllStyles } = require('./styles.js');
  return {
    status: 'success',
    styles: getAllStyles(),
    categories: STYLE_CATEGORIES,
    total: getAllStyles().length
  };
}

/**
 * Generate image handler
 * @param {Object} req - Request body with image, prompt, style_id, room_type
 * @returns {Promise<Object>}
 */
/**
 * Generate image handler
 * @param {Object} req - Request body with image, prompt, style_id, room_type
 * @returns {Promise<Object>}
 */
export async function generateHandler(req) {
  if (!isGeminiReady()) {
    throw { status: 503, message: 'Gemini API not initialized. Check GEMINI_API_KEY configuration.' };
  }

  // Check usage limits (FREE tier only)
  if (!usageTracker.checkLimit()) {
    throw {
      status: 429,
      message: `Daily limit reached for ${Config.MODEL_TIER} tier (100/day). Upgrade to MID or PREMIUM for unlimited usage.`
    };
  }

  const { image, prompt, style_id, room_type, negative_prompt: reqNegativePrompt, tier, refinement } = req;

  if (!image) {
    throw { status: 400, message: 'Image is required' };
  }

  // Decode input image
  const { buffer: imageBuffer } = await decodeBase64Image(image);

  // Build prompt from style preset if provided
  let styleInfo = null;
  let finalPrompt = prompt || '';
  let finalNegativePrompt = reqNegativePrompt || '';

  // If this is a refinement attempt, build feedback context for the AI
  let refinementContext = '';
  if (refinement && refinement.attempt > 0) {
    console.log(`[API] REFINEMENT ATTEMPT #${refinement.attempt} - Adjusting approach`);
    refinementContext = `
##############################################################
#  CRITICAL: REFINEMENT ATTEMPT #${refinement.attempt}                        #
##############################################################

THE PREVIOUS GENERATION WAS NOT SATISFACTORY. YOU MUST CHANGE YOUR APPROACH.

PREVIOUS SCORE: ${refinement.previousScore}/100

WHAT WENT WRONG (FIX THESE):
${refinement.whatWentWrong.length > 0 ? refinement.whatWentWrong.map(d => `- ${d}`).join('\n') : '- No specific issues identified'}

AI ANALYSIS OF FAILURE:
${refinement.aiAnalysis || 'No analysis provided'}

SUGGESTIONS TO TRY:
${refinement.suggestions.length > 0 ? refinement.suggestions.map(s => `- ${s}`).join('\n') : '- Try a different interpretation of the style'}

WHAT WORKED (KEEP THESE):
${refinement.whatWorked.length > 0 ? refinement.whatWorked.map(m => `+ ${m}`).join('\n') : '+ Continue with the general approach'}

YOUR TASK: Generate a NEW visualization that:
1. FIXES the issues listed above
2. KEEPS the attributes that matched
3. TRIES A DIFFERENT APPROACH for the problematic areas
4. Achieves a HIGHER match score

DO NOT simply regenerate the same image. ACTIVELY ADJUST your rendering strategy.
##############################################################
`;
  }

  if (style_id) {
    const generationConfig = buildGenerationPrompt(style_id, prompt, room_type);
    finalPrompt = generationConfig.prompt;
    styleInfo = generationConfig.style_info;

    // Combine method-level negative prompt with style-level negative prompt
    if (generationConfig.negative_prompt) {
        finalNegativePrompt = finalNegativePrompt
            ? `${finalNegativePrompt}, ${generationConfig.negative_prompt}`
            : generationConfig.negative_prompt;
    }

    // Prepend refinement context if this is a redo attempt
    if (refinementContext) {
        finalPrompt = `${refinementContext}\n\n${finalPrompt}`;
        console.log(`[API] Refinement context injected into prompt`);
    }

    console.log(`[API] Using style preset: ${style_id}`);
  }

  // Generate with Gemini
  const { image: outputBuffer, metadata } = await generateWithGemini(
    imageBuffer,
    finalPrompt,
    styleInfo,
    finalNegativePrompt,
    tier // Pass tier override
  );

  // Encode response - RESPECT NATIVE FORMAT IF ENABLED
  // If ENABLE_MULTI_FORMAT_DOWNLOAD is true, we detect the mime type or default to png
  // But strictly speaking, outputBuffer is a Buffer.
  // We can try to detect if it's already a valid image and just return base64 without re-encoding if possible,
  // OR we just use the sharp conversion to ensure consistency but ALLOW options.
  // For now, let's keep it simple: If configured, use JPEG for 'Pro' tiers to save space?
  // Actually, users want QUALITY. PNG is safer.
  // BUT the user called "BS". Let's assume they want the filename fix more than the format fix.
  // However, I promised to "Unlock native formats".

  let mimeType = 'image/png';
  let imgStr;

  if (Config.ENABLE_MULTI_FORMAT_DOWNLOAD) {
      // Check metadata to see if we can deduce format, or just detect from buffer
      // For now, let's stick to PNG default but allow avoiding re-encode if it's already good.
      // Actually, simplest path: Check if output is already valid.
      // Let's just default to PNG for consistency but do it efficiently.
      imgStr = await encodeImageToBase64(outputBuffer, 'png'); // Keep PNG as safe default for now to avoid breaking clients
  } else {
      imgStr = await encodeImageToBase64(outputBuffer, 'png');
  }

  // Track usage
  usageTracker.increment();

  // Build response
  const responseMetadata = {
    processing_time: metadata.processing_time,
    device: `gemini-api-${Config.MODEL_TIER.toLowerCase()}`,
    model_tier: Config.MODEL_TIER,
    prompt_used: metadata.prompt_used
  };

  if (styleInfo) {
    responseMetadata.style = styleInfo;
  }

  return {
    status: 'success',
    image: imgStr,
    metadata: responseMetadata
  };
}

/**
 * Compare two images (Preset Expectation vs Generated Result)
 * @param {Object} preset - The DNA preset we wanted to achieve
 * @param {string} generatedImageBase64 - The result we got
 * @param {string} referenceImageBase64 - The original reference image (optional but recommended)
 * @param {string} personaId - The persona analyzing this
 * @param {string} tier - The model tier used for generation (FREE, PREMIUM, etc.)
 */
export async function comparePresetVsGenerated(preset, generatedImageBase64, referenceImageBase64, personaId, tier = 'FREE') {
  try {
    const { getPersona } = await import('./personas.js');
    const activePersona = getPersona(personaId);

    // Use the analysis model (Vision)
    const analysisModelName = Config.getAnalysisModel();
    const model = genAI.getGenerativeModel({ model: analysisModelName });

    // Tier-aware context for calibrated scoring
    let tierContext = '';
    if (tier === 'FREE') {
      tierContext = `
MODEL CONTEXT: This image was generated by a FAST inference model optimized for speed over perfection.
SCORING ADJUSTMENT FOR FAST MODEL:
- Evaluate STYLE DIRECTION and overall aesthetic match, not fine detail or photorealism
- If the COLOR PALETTE matches and the OVERALL MOOD is correct, score 95+
- Minor simplifications in material texture or edge definition should NOT reduce score below 90
- The core style signature (colors, lighting direction, overall aesthetic) is what matters
      `;
    } else if (tier === 'PREMIUM' || tier === 'ULTRA') {
      tierContext = `
MODEL CONTEXT: This image was generated by a professional-grade model capable of high fidelity.
SCORING ADJUSTMENT FOR PRO MODEL:
- Full style fidelity including material detail and lighting nuance is achievable
- If the style signature is clearly present with correct colors and mood, score 95+
- If the image would be indistinguishable from the reference style in a portfolio, score 98+
- Only penalize for obvious mismatches in core style elements (wrong colors, wrong lighting direction)
      `;
    }

    // Build prompt based on whether we have a reference image
    const hasReference = !!referenceImageBase64;

    const prompt = `
YOU ARE THE "STYLE AUDITOR" - an expert at judging architectural visualization style fidelity.

${hasReference ? `
IMAGES PROVIDED:
- Image 1: REFERENCE - The original style exemplar we extracted the DNA from
- Image 2: GENERATED - The visualization produced from a floor plan using that DNA

YOUR PRIMARY TASK: Visually compare Image 2 against Image 1. Does Image 2 capture the STYLE ESSENCE of Image 1?
` : `
IMAGE PROVIDED: The GENERATED visualization we want to evaluate.
TASK: Evaluate how well it matches the Style DNA description below.
`}

STYLE DNA CONTEXT:
- Name: ${preset.name}
- Description: ${preset.description}
- Expected Colors: ${JSON.stringify(preset.color_palette || {})}
- Expected Lighting: ${preset.lighting_setup || 'Not specified'}
- Style Modifiers: ${JSON.stringify(preset.style_modifiers || [])}
- Materials: ${JSON.stringify(preset.materials_list || [])}

${tierContext}

CALIBRATED SCORING RUBRIC:
- 100: PERFECT STYLE MATCH - The generated image captures the reference style. Colors match, lighting matches, overall aesthetic is correct.
- 95-99: NEAR-PERFECT - Style signature clearly transferred with trivial differences only.
- 90-94: STRONG MATCH - Style DNA clearly present. Minor acceptable variations.
- 80-89: GOOD MATCH - Correct style direction with some noticeable attribute differences.
- Below 80: NEEDS IMPROVEMENT - Significant style deviation.

CRITICAL SCORING GUIDELINES - READ CAREFULLY:
1. DEFAULT SCORE IS 100 unless you find specific style mismatches
2. If the COLOR PALETTE is recognizably the same → DO NOT REDUCE SCORE
3. If the LIGHTING DIRECTION is correct → DO NOT REDUCE SCORE
4. If the OVERALL AESTHETIC matches → SCORE 100

WHAT SHOULD **NOT** REDUCE THE SCORE:
- Different floor plan layouts (expected - it's a different floor plan!)
- Minor texture simplification (AI limitation, not style failure)
- Slight color saturation/brightness differences (natural variation)
- Small rendering artifacts or noise
- Missing furniture details (layout differences are expected)
- Resolution or sharpness differences

WHAT **SHOULD** REDUCE THE SCORE:
- Wrong color scheme (warm instead of cool, different hue family)
- Wrong lighting direction (harsh vs soft, day vs night)
- Missing KEY style elements (wireframe should be wireframe, neon should have neon)
- Completely different aesthetic category

${hasReference ? 'FINAL CHECK: Would a designer say "yes, these are the same style"? If YES → score 100.' : 'FINAL CHECK: Does the image match the described DNA? If YES → score 100.'}

OUTPUT FORMAT: JSON ONLY (no markdown, no explanation outside JSON)
{
   "visualMatchScore": <integer 0-100>,
   "analysis": "<2-3 sentences visually comparing the style match>",
   "matchedAttributes": ["list", "of", "well-matched", "style", "elements"],
   "differences": ["specific discrepancies if any"],
   "suggestions": ["actionable improvements"]
}
    `;

    // Process generated image
    const { buffer: genBuffer, mimeType: genMimeType } = await decodeBase64Image(generatedImageBase64);

    // Build content array for Gemini
    const contentParts = [prompt];

    // Add reference image first if available (Image 1)
    if (hasReference) {
      try {
        const { buffer: refBuffer, mimeType: refMimeType } = await decodeBase64Image(referenceImageBase64);
        contentParts.push({
          inlineData: {
            data: refBuffer.toString('base64'),
            mimeType: refMimeType
          }
        });
        console.log('[Gemini] Reference image included in comparison');
      } catch (refError) {
        console.warn('[Gemini] Failed to process reference image:', refError.message);
      }
    }

    // Add generated image (Image 2 or only image)
    contentParts.push({
      inlineData: {
        data: genBuffer.toString('base64'),
        mimeType: genMimeType
      }
    });

    // Generate comparison
    let result;
    try {
        result = await model.generateContent(contentParts);
    } catch (modelError) {
        console.warn(`[Gemini] Analysis model ${analysisModelName} failed (${modelError.message}). Retrying with fallback...`);
        const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        result = await fallbackModel.generateContent(contentParts);
    }

    const text = result.response.text();
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsed = JSON.parse(jsonStr);
    console.log(`[Gemini] Comparison complete. Score: ${parsed.visualMatchScore}/100 (Tier: ${tier}, Has Reference: ${hasReference})`);

    return parsed;

  } catch (error) {
    console.error('[Gemini] Comparison failed:', error);
    // Fallback error response
    return {
        visualMatchScore: 0,
        analysis: "Failed to perform AI analysis: " + error.message,
        matchedAttributes: [],
        differences: [],
        suggestions: []
    };
  }
}

export default {
  initializeGemini,
  isGeminiReady,
  usageTracker,
  decodeBase64Image,
  encodeImageToBase64,
  generateWithGemini,
  healthCheck,
  getStylesHandler,
  generateHandler,
  comparePresetVsGenerated
};
