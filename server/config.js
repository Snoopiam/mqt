/**
 * MQT Configuration Module
 * Handles environment variables and tier configurations
 * Updated: Dec 2025 (Imagen 4.0 Integration)
 */

import dotenv from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Load .env file for local development
const envPath = resolve(process.cwd(), '.env');
console.log('[Config] Loading .env from:', envPath);
console.log('[Config] .env exists:', existsSync(envPath));

const result = dotenv.config();
if (result.error) {
  console.error('[Config] Error loading .env:', result.error);
}

console.log('[Config] GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY);
if (process.env.GEMINI_API_KEY) {
  console.log('[Config] GEMINI_API_KEY length:', process.env.GEMINI_API_KEY.length);
  console.log('[Config] GEMINI_API_KEY prefix:', process.env.GEMINI_API_KEY.substring(0, 4) + '...');
} else {
    console.warn('[Config] GEMINI_API_KEY is MISSING in process.env');
}

/**
 * Application configuration with environment variable support
 */
export const Config = {
  // ============================================
  // GOOGLE GEMINI API CONFIGURATION
  // ============================================
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  
  // Default text/multimodal model
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  
  // Default image model (Standard 4.0)
  IMAGEN_MODEL: process.env.IMAGEN_MODEL || 'imagen-4.0-generate-001',

  // Model Tier Selection (FREE | MID | PREMIUM | ULTRA | PREVIEW)
  MODEL_TIER: (process.env.MODEL_TIER || 'FREE').toUpperCase(),

  // ============================================
  // GOOGLE CLOUD CONFIGURATION
  // ============================================
  GCP_PROJECT_ID: process.env.GCP_PROJECT_ID || '',

  // Detect if running on Cloud Run
  IS_CLOUD_RUN: !!process.env.K_SERVICE,

  // ============================================
  // APPLICATION CONFIGURATION
  // ============================================
  PORT: parseInt(process.env.PORT || '8080', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Profile Configuration (USER | DEV)
  APP_PROFILE: (process.env.APP_PROFILE || 'USER').toUpperCase(),

  // ============================================
  // FEATURE TOGGLES
  // ============================================
  ENABLE_REFINEMENT: process.env.ENABLE_REFINEMENT?.toLowerCase() === 'true',
  ENABLE_PRESET_LEARNING: process.env.ENABLE_PRESET_LEARNING?.toLowerCase() === 'true',
  ENABLE_PDF_UPLOAD: process.env.ENABLE_PDF_UPLOAD?.toLowerCase() === 'true',
  ENABLE_MULTI_FORMAT_DOWNLOAD: process.env.ENABLE_MULTI_FORMAT_DOWNLOAD?.toLowerCase() === 'true',

  // ============================================
  // UPLOAD CONFIGURATION
  // ============================================
  MAX_IMAGE_SIZE: parseInt(process.env.MAX_IMAGE_SIZE || '10485760', 10), // 10MB
  SUPPORTED_FORMATS: ['png', 'jpg', 'jpeg', 'webp', 'pdf'],

  // ============================================
  // TIER CONFIGURATION
  // ============================================
  TIERS: {
    FREE: {
      analysis_model: 'gemini-2.5-flash',
      // FIXED: Use the unified Gemini Image model. 
      // This works with 'generateContent' and is optimized for speed.
      generation_model: 'gemini-2.5-flash-image', 
      requires_billing: false,
      daily_limit: 100,
      cost_per_image: 0.0,
      quality: 'Standard (Unified)',
      features: ['fast_inference', 'native_image_output'],
    },
    MID: {
      analysis_model: 'gemini-2.5-pro',
      // MID also benefits from the PRO version of the unified image model
      generation_model: 'gemini-2.5-flash-image', 
      requires_billing: true,
      daily_limit: null,
      cost_per_image: 0.004,
      quality: 'High Fidelity',
      features: ['complex_prompting'],
    },
    PREMIUM: {
      analysis_model: 'gemini-2.5-pro',
      // Upgraded to verified Gemini 3 Pro Image Preview as Imagen 4.0 is not available on this key
      generation_model: 'gemini-3-pro-image-preview',
      requires_billing: true,
      daily_limit: null,
      cost_per_image: 0.032,
      quality: 'Professional',
      features: ['photorealism', 'high_fidelity'],
    },
    ULTRA: {
      analysis_model: 'gemini-3-pro-preview',
      // Ultra uses the heavy-duty "Ultra" model
      generation_model: 'gemini-3-pro-image-preview',
      requires_billing: true,
      daily_limit: null,
      cost_per_image: 0.06, // Slightly higher for Ultra
      quality: 'State-of-the-Art',
      features: ['deep_think', 'max_detail', 'complex_composition'],
    },
    PREVIEW: {
      analysis_model: 'gemini-2.0-flash-thinking-exp-1219',
      // Preview accesses the Ultra model for testing
      generation_model: 'imagen-4.0-ultra-generate-001', 
      requires_billing: true,
      daily_limit: null,
      cost_per_image: 0.06,
      quality: 'Cutting Edge (Preview)',
      features: ['experimental_features'],
    },
  },

  /**
   * Get configuration for selected tier
   */
  getTierConfig() {
    return this.TIERS[this.MODEL_TIER] || this.TIERS.FREE;
  },

  /**
   * Get model for floor plan analysis
   */
  getAnalysisModel() {
    return process.env.ANALYSIS_MODEL || this.getTierConfig().analysis_model;
  },

  /**
   * Get model for image generation
   */
  getGenerationModel() {
    return process.env.GENERATION_MODEL || this.getTierConfig().generation_model;
  },

  /**
   * Get list of allowed CORS origins
   */
  getAllowedOrigins() {
    const originsStr =
      process.env.ALLOWED_ORIGINS ||
      'http://localhost:5173,http://localhost:5174,http://localhost:8080';
    const origins = originsStr.split(',').map((o) => o.trim());

    // On Cloud Run, also allow the service URL
    if (this.IS_CLOUD_RUN && process.env.K_SERVICE_URL) {
      const serviceUrl = process.env.K_SERVICE_URL;
      if (!origins.includes(serviceUrl)) {
        origins.push(serviceUrl);
      }
    }

    return origins;
  },

  /**
   * Get information about the current deployment environment
   */
  getDeploymentInfo() {
    const tierConfig = this.getTierConfig();
    return {
      environment: this.IS_CLOUD_RUN ? 'cloud_run' : 'local',
      has_gemini_key: !!this.GEMINI_API_KEY,
      has_gcp_project: !!this.GCP_PROJECT_ID,
      model_tier: this.MODEL_TIER,
      active_models: {
          analysis: tierConfig.analysis_model,
          generation: tierConfig.generation_model
      },
      app_profile: this.APP_PROFILE,
      port: this.PORT,
      node_env: this.NODE_ENV,
    };
  },
};

export default Config;