/**
 * MQT Server - Single Express Server with Vite Integration
 * 
 * Development: Runs Vite as middleware for HMR
 * Production: Serves static files from dist/
 */

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

import { Config } from './config.js';
import { 
  initializeGemini, 
  isGeminiReady, 
  healthCheck,
  generateHandler,
  usageTracker 
} from './gemini.js';
import { 
  getAllStyles, 
  getStylePreset, 
  getStylesByCategory,
  STYLE_CATEGORIES 
} from './styles.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

const app = express();

// ============================================
// MIDDLEWARE
// ============================================

// CORS
app.use(cors({
  origin: Config.getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// JSON body parser with increased limit for base64 images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============================================
// API ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json(healthCheck());
});

// Get all styles
app.get('/api/styles', (req, res) => {
  res.json({
    status: 'success',
    styles: getAllStyles(),
    categories: STYLE_CATEGORIES,
    total: getAllStyles().length
  });
});

// Get specific style
app.get('/api/styles/:styleId', (req, res) => {
  const preset = getStylePreset(req.params.styleId);
  if (!preset) {
    return res.status(404).json({
      status: 'error',
      detail: `Style preset '${req.params.styleId}' not found`
    });
  }
  res.json({
    status: 'success',
    style: preset
  });
});

// Get styles by category
app.get('/api/styles/category/:category', (req, res) => {
  const category = req.params.category;
  if (!STYLE_CATEGORIES[category]) {
    return res.status(404).json({
      status: 'error',
      detail: `Category '${category}' not found`
    });
  }

  const styles = getStylesByCategory(category);
  res.json({
    status: 'success',
    category: STYLE_CATEGORIES[category],
    styles,
    total: styles.length
  });
});

// Save new style
app.post('/api/styles', async (req, res) => {
  const { style } = req.body;
  
  if (!style) {
    return res.status(400).json({ status: 'error', detail: 'Style data required' });
  }

  try {
    const { saveStyle } = await import('./styles.js');
    const result = saveStyle(style);
    
    if (result.success) {
      res.json({ status: 'success', id: result.id });
    } else {
      res.status(500).json({ status: 'error', detail: result.error });
    }
  } catch (e) {
    res.status(500).json({ status: 'error', detail: e.message });
  }
});

// Generate image
app.post('/api/generate', async (req, res) => {
  try {
    const result = await generateHandler(req.body);
    res.json(result);
  } catch (error) {
    console.error('[API] Generation error:', error);
    if (error.stack) {
        console.error('[API] Stack trace:', error.stack);
    }
    
    const status = error.status || 500;
    const message = error.message || 'Image generation failed';
    
    res.status(status).json({
      status: 'error',
      detail: message
    });
  }
});

// Refinement endpoint (skeleton)
app.post('/api/refine', async (req, res) => {
  if (!Config.ENABLE_REFINEMENT) {
    return res.status(501).json({
      status: 'error',
      detail: 'Refinement feature is currently disabled. Set ENABLE_REFINEMENT=true to enable.'
    });
  }
  
  // TODO: Implement refinement logic
  res.status(501).json({
    status: 'error',
    detail: 'Refinement feature not yet implemented'
  });
});

// Download endpoint (skeleton)
app.post('/api/download', async (req, res) => {
  const { image, format = 'png' } = req.body;
  
  if (!image) {
    return res.status(400).json({
      status: 'error',
      detail: 'Image is required'
    });
  }

  // For now, just return the image as-is
  res.json({
    status: 'success',
    image,
    format,
    note: Config.ENABLE_MULTI_FORMAT_DOWNLOAD 
      ? 'Multi-format download enabled' 
      : 'Multi-format download disabled. Set ENABLE_MULTI_FORMAT_DOWNLOAD=true to enable.'
  });
});

// Extract Style DNA from Image
app.post('/api/styles/extract', async (req, res) => {
  const { image, persona_id, strict_mode } = req.body;
  if (!image) {
    return res.status(400).json({ status: 'error', detail: 'Image required' });
  }

  try {
    const { StyleExtractor } = await import('./extractor.js');
    console.log(`[API] Extracting Visual DNA... (Persona: ${persona_id || 'default'}, Strict: ${strict_mode || false})`);
    const stylePreset = await StyleExtractor.extractDNA(image, persona_id, strict_mode);
    console.log(`[API] DNA Extracted: ${stylePreset.name}`);
    
    res.json({
      status: 'success',
      style: stylePreset
    });
  } catch (error) {
    console.error('[API] Extraction error:', error);
    res.status(500).json({ status: 'error', detail: error.message });
  }
});

// Compare Preset vs Generated
app.post('/api/styles/compare', async (req, res) => {
  const { preset, generatedImage, referenceImage, persona_id, tier } = req.body;
  if (!preset || !generatedImage) {
      return res.status(400).json({ status: 'error', detail: 'Preset and Generated Image required' });
  }

  try {
      const { comparePresetVsGenerated } = await import('./gemini.js');
      console.log(`[API] Running Comparison vs ${preset.name} (Persona: ${persona_id}, Tier: ${tier || 'FREE'}, Has Reference: ${!!referenceImage})`);
      const result = await comparePresetVsGenerated(preset, generatedImage, referenceImage, persona_id, tier);
      res.json({ status: 'success', comparison: result });
  } catch (error) {
      console.error('[API] Comparison error:', error);
      res.status(500).json({ status: 'error', detail: error.message });
  }
});

// ============================================
// VITE INTEGRATION
// ============================================

async function startServer() {
  // Initialize Gemini API
  console.log('[Server] Starting MQT Server...');
  console.log(`[Server] Deployment info:`, Config.getDeploymentInfo());
  
  if (!initializeGemini()) {
    console.warn('[Server] Gemini API not initialized - check GEMINI_API_KEY');
  }

  const distPath = resolve(rootDir, 'dist');
  const isDev = Config.NODE_ENV !== 'production';

  if (isDev) {
    // Development: Use Vite middleware for HMR
    console.log('[Server] Development mode - setting up Vite middleware...');
    
    try {
      const { createServer: createViteServer } = await import('vite');
      
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
        root: rootDir
      });

      // Use Vite's connect instance as middleware
      app.use(vite.middlewares);

      console.log('[Server] Vite middleware configured');
    } catch (error) {
      console.error('[Server] Failed to setup Vite middleware:', error);
      console.log('[Server] Falling back to static file serving...');
      
      // Fallback to serving from src if dist doesn't exist
      if (existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
          if (!req.path.startsWith('/api') && !req.path.startsWith('/health')) {
            res.sendFile(resolve(distPath, 'index.html'));
          }
        });
      }
    }
  } else {
    // Production: Serve static files from dist/
    console.log('[Server] Production mode - serving static files from dist/');
    
    if (existsSync(distPath)) {
      app.use(express.static(distPath));
      
      // SPA fallback - serve index.html for non-API routes
      app.get('*', (req, res) => {
        if (!req.path.startsWith('/api') && !req.path.startsWith('/health')) {
          res.sendFile(resolve(distPath, 'index.html'));
        }
      });
    } else {
      console.warn(`[Server] dist/ directory not found at ${distPath}`);
      console.warn('[Server] Run "npm run build" to build the frontend');
    }
  }

  // Start listening
  app.listen(Config.PORT, () => {
    console.log('');
    console.log('='.repeat(50));
    console.log(`🚀 MQT Server running on http://localhost:${Config.PORT}`);
    console.log('='.repeat(50));
    console.log(`   Mode: ${isDev ? 'Development (HMR enabled)' : 'Production'}`);
    console.log(`   Gemini: ${isGeminiReady() ? '✅ Ready' : '❌ Not configured'}`);
    console.log(`   Tier: ${Config.MODEL_TIER}`);
    if (Config.MODEL_TIER === 'FREE') {
      console.log(`   Remaining: ${usageTracker.getRemaining()}/100 generations today`);
    }
    console.log('='.repeat(50));
    console.log('');
  });
}

// Start the server
startServer().catch((error) => {
  console.error('[Server] Failed to start:', error);
  process.exit(1);
});

export default app;
