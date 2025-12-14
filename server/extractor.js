import { GoogleGenerativeAI } from '@google/generative-ai';
import { Config } from './config.js';

// Initialize Gemini for Vision
// Use the ABSOLUTE MOST CAPABLE model for DNA extraction
const genAI = new GoogleGenerativeAI(Config.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' }); 

/**
 * Visual DNA Extractor
 * "The Style Hunter Persona"
 */
export const StyleExtractor = {
  
  /**
   * extracting the visual DNA from a reference image
   * @param {string} imageBase64 - Base64 encoded image
   * @param {string} [personaId] - Optional persona ID to influence extraction
   * @param {boolean} [strictMode=false] - Force stricter forensic analysis
   * @returns {Promise<Object>} - The Style Preset Object
   */
  async extractDNA(imageBase64, personaId, strictMode = false) {
    try {
      // 1. Prepare the Image Part
      const imagePart = {
        inlineData: {
          data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
          mimeType: 'image/jpeg', // Assuming jpeg/png
        },
      };

      // 2. The Golden Request (Persona Injection for the Extractor itself)
      // Get the active persona
      const { getPersona } = await import('./personas.js');
      const activePersona = getPersona(personaId);

      let strictInstruction = "";
      if (strictMode) {
        strictInstruction = `
        CRITICAL STRICT MODE ENGAGED:
        - PERFORM DEEP FORENSIC ANALYSIS.
        - IGNORE artistic "vibe" or "mood".
        - CLASSIFY the ARCHITECTURAL STYLE using professional terminology (e.g. "Brutalist", "Mid-Century Modern", "Parametric").
        - IDENTIFY SPECIFIC MATERIALS (e.g. "Carrara Marble", "Polished Concrete", "Rift-Sawn Oak").
        - IDENTIFY EXACT LIGHTING (e.g. "4000K Diffused", "Hard Noon Shadows", "Volumetric God Rays").
        `;
      }

      const prompt = `
      YOU ARE THE "SUPREME ARCHITECTURAL ANALYST".
      Your active persona is: "${activePersona.name}".
      Instruction: ${activePersona.extractionStyle}
      ${strictInstruction}

      Your mission is to perform a PIXEL-PERFECT forensic analysis on this architectural image and extract its "Visual DNA".
      
      CRITICAL: You are extracting the STYLE DNA to be applied to *other* floor plans. 
      Do NOT describe the room layout (e.g. "there is a bed"). 
      DESCRIBE THE AESTHETIC RULES that make this image look the way it does.

      OUTPUT FORMAT: JSON ONLY.
      
      {
        "id": "generated_style_id",
        "name": "Precise Architectural Style Name",
        "description": "Professional architectural specification of the visual style.",
        "base_prompt": "A master-level Stable Diffusion prompt capturing the essence of this style.",
        "style_modifiers": ["list", "of", "10+", "highly", "specific", "visual", "attributes"],
        "materials_list": ["list", "of", "exact", "materials", "detected"],
        "lighting_setup": "Specific lighting instruction (e.g. 'Soft North Light with Warm Interior Accents')",
        "negative_prompt": "bad quality, blurry, text, watermark, distorted, extra walls, changing layout, hallucinated furniture",
        "color_palette": {
          "primary": "#Hex",
          "secondary": "#Hex",
          "accent": "#Hex",
          "material_1": "#Hex",
          "material_2": "#Hex"
        },
        "persona": "WRITE A SYSTEM INSTRUCTION FOR AN AI. TELL IT EXACTLY HOW TO RENDER LIKE THIS. Focus on: Camera settings, Render Engine (e.g. V-Ray, Octane), Lighting physics, and Material roughness."
      }
      
      DEEP DIVE ANALYSIS:
      1. What IS this style? (Be specific).
      2. What are the signature materials?
      3. How is the scene lit? (Kelvin temp, softness, direction).
      4. What is the color grading?
      `;

      // 3. Generate
      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      
      // 4. Clean & Parse JSON
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const styleData = JSON.parse(jsonStr);
      
      // 5. Sanitize ID
      styleData.id = styleData.name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();
      
      return styleData;

    } catch (error) {
      console.error('[StyleExtractor] Extraction Failed:', error);
      throw new Error('Failed to extract visual DNA: ' + error.message);
    }
  }
};
