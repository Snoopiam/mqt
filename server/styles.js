/**
 * Preset Style Definitions for MQT Floor Plan Visualization.
 * 
 * dynamically loaded from src/data/style_prompts.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the JSON source of truth
const STYLE_DATA_PATH = path.resolve(__dirname, '../src/data/style_prompts.json');
const STAGING_DATA_PATH = path.resolve(__dirname, 'staging_styles.json');

// =============================================================================
// LOAD & PARSE STYLES
// =============================================================================

let STYLE_PRESETS = {};
export let STYLE_CATEGORIES = {};

function loadStyles() {
    STYLE_PRESETS = {}; // Reset
    const categories = {};
    
    // Helper to parse and merge
    const mergeData = (filePath, isStaging = false) => {
        if (!fs.existsSync(filePath)) return;
        try {
            const rawData = fs.readFileSync(filePath, 'utf-8');
            const jsonStyles = JSON.parse(rawData);
            
            Object.entries(jsonStyles).forEach(([key, data]) => {
                const colorPalette = {};
                if (Array.isArray(data.hex_palette)) {
                    data.hex_palette.forEach((color, index) => {
                        colorPalette[`color_${index}`] = color;
                    });
                }
                
                const styleObj = {
                    id: key,
                    name: data.title || key,
                    description: data.description || '',
                    category: data.category || 'Uncategorized',

                    // CRITICAL: Full DNA fields for generation
                    base_prompt: data.generated_prompt || '',
                    persona: data.active_persona || '',
                    style_modifiers: data.style_modifiers || [],
                    materials_list: data.materials_list || [],
                    lighting_setup: data.lighting_style || data.lighting_engine || 'Standard',

                    // Color handling - prefer full palette if saved, otherwise build from hex array
                    color_palette: data.color_palette_full || colorPalette,

                    // Standard fields
                    negative_prompt: 'text, watermark, low quality, blurred, distorted structure, swapping furniture, wrong room types, extra walls, missing doors',
                    lighting: data.lighting_style || data.lighting_engine || 'Standard',
                    viewpoint: data.viewpoint || 'Top-Down',
                    recommended_controlnet_weight: 0.9,
                    recommended_guidance_scale: 7.5,
                    tags: [data.category || 'General'],

                    // Internal flags
                    _isStaging: isStaging
                };
                
                STYLE_PRESETS[key] = styleObj;
                
                // Add to categories
                const cat = styleObj.category;
                if (!categories[cat]) {
                    categories[cat] = {
                        name: cat,
                        description: `${cat} Styles`,
                        styles: []
                    };
                }
                
                // Only add to public categories if NOT staging
                // Staging styles are accessible by ID, but not listed in public menus
                if (!isStaging) {
                    categories[cat].styles.push(key);
                }
            });
        } catch (e) {
            logger.error(`[Styles] Error loading ${filePath}:`, e);
        }
    };

    // 1. Load Main Styles (Public)
    logger.debug(`[Styles] Loading Main styles from ${STYLE_DATA_PATH}...`);
    mergeData(STYLE_DATA_PATH, false);

    // 2. Load Staging Styles (Hidden)
    logger.debug(`[Styles] Loading Staging styles from ${STAGING_DATA_PATH}...`);
    mergeData(STAGING_DATA_PATH, true);

    STYLE_CATEGORIES = categories;
    logger.info(`[Styles] Total Loaded: ${Object.keys(STYLE_PRESETS).length}`);
}

// Initial Load
loadStyles();

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get a style preset by its ID.
 * @param {string} styleId
 * @returns {Object|null}
 */
export function getStylePreset(styleId) {
  return STYLE_PRESETS[styleId] || null;
}

/**
 * Get all PUBLIC style presets.
 * Filters out staging styles to keep main menu clean.
 * @returns {Object[]}
 */
export function getAllStyles() {
  return Object.values(STYLE_PRESETS).filter(s => !s._isStaging);
}

/**
 * Get all styles in a specific category.
 * @param {string} category
 * @returns {Object[]}
 */
export function getStylesByCategory(category) {
    if (STYLE_CATEGORIES[category]) {
        // The category list already excludes staging styles during load
        return STYLE_CATEGORIES[category].styles.map(id => STYLE_PRESETS[id]);
    }
    return [];
}

/**
 * Get all styles that have a specific tag.
 * @param {string} tag
 * @returns {Object[]}
 */
export function getStylesByTag(tag) {
  const lowerTag = tag.toLowerCase();
  return Object.values(STYLE_PRESETS).filter(preset =>
    preset.tags.some(t => t.toLowerCase() === lowerTag)
  );
}

/**
 * Build a prompt by combining style with user input.
 * @param {Object} preset
 * @param {string} userPrompt
 * @returns {string}
 */
export function buildPrompt(preset, userPrompt = '') {
  // If the preset has a comprehensive base_prompt (from generated_prompt), use it primarily.
  // We append the userPrompt to it.
  
  const components = [];
  
  if (preset.base_prompt) {
      components.push(preset.base_prompt);
  }
  
  if (userPrompt) {
    components.push(userPrompt);
  }
  
  if (preset.style_modifiers && preset.style_modifiers.length > 0) {
      components.push(...preset.style_modifiers);
  }
  
  return components.join(', ');
}

/**
 * Build complete generation parameters for a given style.
 * @param {string} styleId - The preset style ID to use
 * @param {string} userPrompt - Optional user natural language input
 * @param {string|null} roomType - Optional specific room type focus
 * @returns {Object}
 */
/**
 * Save a new style preset to disk (STAGING ONLY)
 * @param {Object} styleData - The full style object from extraction
 * @returns {boolean} success
 */
export function saveStyle(styleData) {
  try {
    // Read STAGING file, not Main
    let rawData = '{}';
    if (fs.existsSync(STAGING_DATA_PATH)) {
        rawData = fs.readFileSync(STAGING_DATA_PATH, 'utf-8');
    }
    const jsonStyles = JSON.parse(rawData);

    // Create a unique ID
    const newId = styleData.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    
    const newEntry = {
      title: styleData.name,
      description: styleData.description,
      category: 'User Created',

      // CRITICAL: Preserve ALL DNA fields for regeneration
      generated_prompt: styleData.base_prompt || '',
      active_persona: styleData.persona || '',
      lighting_style: styleData.lighting_setup || styleData.lighting || 'Standard',
      style_modifiers: styleData.style_modifiers || [],
      materials_list: styleData.materials_list || [],
      hex_palette: Object.values(styleData.color_palette || {}),

      // Store full color palette with keys
      color_palette_full: styleData.color_palette || {}
    };

    if (jsonStyles[newId]) {
      const distinctId = `${newId}_${Date.now()}`;
      jsonStyles[distinctId] = newEntry;
      // Note: We don't manually update STYLE_PRESETS here anymore because we'll reload everything to be safe
    } else {
      jsonStyles[newId] = newEntry;
    }

    fs.writeFileSync(STAGING_DATA_PATH, JSON.stringify(jsonStyles, null, 2));
    
    // Reload runtime memory to reflect changes
    loadStyles();

    logger.info(`[Styles] Saved new staging style: ${newId}`);
    return { success: true, id: newId };
  } catch (e) {
    logger.error('[Styles] Failed to save style:', e);
    return { success: false, error: e.message };
  }
}

export function buildGenerationPrompt(styleId, userPrompt = '', roomType = null) {
  let preset = getStylePreset(styleId);
  
  if (!preset) {
    // Fallback if ID not found, but try to find a default
    const all = Object.values(STYLE_PRESETS);
    if (all.length > 0) preset = all[0];
  }
  
  if (!preset) {
      return {
        prompt: userPrompt || 'architectural floor plan visualization',
        negative_prompt: 'low quality, blurry',
        controlnet_weight: 0.8,
        guidance_scale: 7.5
      };
  }
  
  // Build the complete prompt
  let fullPrompt = buildPrompt(preset, userPrompt);
  
  // Add room type focus if specified
  if (roomType) {
    fullPrompt = `${roomType} focus, ${fullPrompt}`;
  }
  
  return {
    prompt: fullPrompt,
    negative_prompt: preset.negative_prompt,
    controlnet_weight: preset.recommended_controlnet_weight,
    guidance_scale: preset.recommended_guidance_scale,
    style_info: {
      // Core identifiers
      id: preset.id,
      name: preset.name,

      // CRITICAL: Full style DNA for generation
      description: preset.description,
      base_prompt: preset.base_prompt,
      persona: preset.persona || preset.active_persona,

      // Visual attributes
      color_palette: preset.color_palette,
      materials_list: preset.materials_list || Object.keys(preset.color_palette),
      style_modifiers: preset.style_modifiers || [],
      lighting_setup: preset.lighting || preset.lighting_style,

      // Legacy compatibility
      materials: Object.keys(preset.color_palette)
    }
  };
}

export default {
  STYLE_PRESETS,
  STYLE_CATEGORIES,
  getStylePreset,
  getAllStyles,
  getStylesByCategory,
  getStylesByTag,
  buildPrompt,
  buildGenerationPrompt,
  saveStyle
};
