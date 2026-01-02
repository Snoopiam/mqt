# Dual Deployment Guide: Local + Google Cloud Run

This guide explains how to deploy the MQT application both locally and on Google Cloud Run.

## Overview

The MQT application is designed to work seamlessly in both environments:
- **Local Development**: Direct API access with optional Hugging Face authentication
- **Google Cloud Run**: Containerized deployment with automatic environment detection

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure as needed:

```bash
cp .env.example .env
```

#### Key Configuration Options

| Variable | Required | Description |
|----------|----------|-------------|
| `HF_TOKEN` | Optional | Hugging Face token for private models or higher rate limits |
| `GCP_PROJECT_ID` | Optional | Google Cloud project ID (auto-detected on Cloud Run) |
| `ALLOWED_ORIGINS` | Optional | Comma-separated CORS origins (auto-includes Cloud Run URL) |
| `DEVICE` | Optional | Force specific device: `cuda`, `cpu`, or `mps` (auto-detected if not set) |
| `CACHE_MODELS` | Optional | Enable model caching (default: `true`) |
| `MODEL_CACHE_DIR` | Optional | Model cache directory (default: `./models`) |

### Getting a Hugging Face Token

1. Visit https://huggingface.co/settings/tokens
2. Create a new token with `read` permissions
3. Add to your `.env` file: `HF_TOKEN=hf_xxxxxxxxxxxxx`

**Note**: A token is NOT required for public models, but recommended for:
- Private models
- Higher rate limits
- Avoiding download throttling

## Local Deployment

### Prerequisites
- Python 3.10+
- Node.js 18+
- (Optional) CUDA-enabled GPU for faster generation

### Setup

1. **Install dependencies**:
   ```bash
   # Backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   
   # Frontend
   npm install
   ```

2. **Configure environment** (optional):
   ```bash
   cp .env.example .env
   # Edit .env with your preferences
   ```

3. **Run the application**:
   ```bash
   # Terminal 1: Backend
   python main.py
   
   # Terminal 2: Frontend
   npm run dev
   ```

4. **Access**: Open http://localhost:5173

## Google Cloud Run Deployment

### Prerequisites
- Google Cloud account
- `gcloud` CLI installed and authenticated
- Docker (for local testing)

### Deployment Steps

1. **Set your project**:
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Enable required APIs**:
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   ```

3. **Deploy to Cloud Run**:
   ```bash
   gcloud run deploy mqt-app \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --memory 8Gi \
     --cpu 4 \
     --timeout 600 \
     --max-instances 10
   ```

   **Important Resource Settings**:
   - **Memory**: 8Gi minimum (AI models are large)
   - **CPU**: 4 CPUs recommended for reasonable performance
   - **Timeout**: 600s (model loading takes time on cold start)
   - **Max Instances**: Adjust based on expected traffic

4. **Set environment variables** (optional):
   ```bash
   gcloud run services update mqt-app \
     --update-env-vars HF_TOKEN=your_token_here \
     --region us-central1
   ```

### Cloud Run Considerations

#### Cold Starts
- First request after deployment will be slow (model download + loading)
- Consider using Cloud Run's minimum instances feature for production:
  ```bash
  gcloud run services update mqt-app \
    --min-instances 1 \
    --region us-central1
  ```

#### Model Caching
- Models are downloaded on each container start
- For faster cold starts, consider:
  1. Baking models into the Docker image (increases image size)
  2. Using Cloud Storage for model caching
  3. Using minimum instances to keep containers warm

#### Cost Optimization
- Use `--max-instances` to control costs
- Consider CPU allocation (always vs. request-based)
- Monitor usage in Cloud Console

## Testing the Deployment

### Health Check
```bash
# Local
curl http://localhost:8080/health

# Cloud Run
curl https://YOUR_SERVICE_URL/health
```

Expected response:
```json
{
  "status": "ok",
  "device": "cuda",  // or "cpu"
  "model_loaded": true
}
```

### Test Generation
Use the frontend UI or send a POST request to `/api/generate` with:
```json
{
  "image": "data:image/png;base64,...",
  "prompt": "modern minimalist interior",
  "negative_prompt": "cluttered, dark"
}
```

## Troubleshooting

### Local Issues

**Problem**: `ModuleNotFoundError: No module named 'config'`
- **Solution**: Ensure `config.py` exists in the project root

**Problem**: CORS errors
- **Solution**: Check `ALLOWED_ORIGINS` in `.env` includes your frontend URL

**Problem**: Out of memory
- **Solution**: Reduce image size or use CPU mode: `DEVICE=cpu`

**Problem**: FastAPI deprecation warning about `on_event`
- **Solution**: This has been fixed. The codebase now uses the lifespan context manager pattern.

### Cloud Run Issues

**Problem**: Container fails to start
- **Solution**: Check logs: `gcloud run services logs read mqt-app --region us-central1`
- **Common Causes**:
  - Missing files in Docker image (check Dockerfile COPY commands)
  - Import errors (missing config.py, requirements)
  - Port misconfiguration (ensure CMD uses `$PORT` not hardcoded value)

**Problem**: "Model not loaded" error (503)
- **Solution**: Increase memory allocation (minimum 8Gi recommended)
- **Check**: Model download may have failed - check logs for Hugging Face errors

**Problem**: Timeout during cold start
- **Solution**: Increase timeout to 600s or more
- **Note**: First request after deployment downloads ~5GB of model files

**Problem**: CORS errors from frontend
- **Solution**: The Cloud Run URL is auto-added to CORS origins. Check deployment logs.
- **Verify**: The app detects Cloud Run via `K_SERVICE` environment variable

**Problem**: 500 error on `/api/generate` - "cannot identify image file"
- **Root Cause**: This was a bug in image decoding where BytesIO position wasn't reset
- **Solution**: Fixed in latest code. Ensure you're using the updated `main.py`
- **Details**: The fix includes:
  - `image_buffer.seek(0)` after creating BytesIO
  - Image verification with `image.verify()` before processing
  - Better error messages for invalid base64 or corrupt images

**Problem**: 500 error with "Invalid base64 encoding"
- **Cause**: Frontend sending malformed image data
- **Solution**: Ensure image is properly base64 encoded with data URI prefix
- **Expected format**: `data:image/png;base64,<base64_data>`

**Problem**: API works locally but not on Cloud Run
- **Common Causes**:
  1. Different Python/library versions
  2. Missing environment variables
  3. CPU vs GPU differences (Cloud Run is CPU only)
- **Debug**: Compare local and Cloud Run logs

### Docker Build Issues

**Problem**: Build fails on `npm ci`
- **Solution**: Ensure `package-lock.json` is committed and up to date
- **Run**: `npm install && npm ci` locally to verify

**Problem**: Python dependencies fail to install
- **Solution**: Check `requirements.txt` for version conflicts
- **Note**: Some packages have specific CUDA requirements that won't work on Cloud Run

### Debugging Commands

```bash
# View Cloud Run logs
gcloud run services logs read mqt-app --region us-central1 --limit 100

# View real-time logs
gcloud run services logs tail mqt-app --region us-central1

# Check service status
gcloud run services describe mqt-app --region us-central1

# Test health endpoint
curl -v https://YOUR_SERVICE_URL/health

# Test with sample image (requires jq)
curl -X POST https://YOUR_SERVICE_URL/api/generate \
  -H "Content-Type: application/json" \
  -d '{"image":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==","prompt":"test"}' \
  | jq .
```

## Architecture Differences

| Feature | Local | Cloud Run |
|---------|-------|-----------|
| **Environment Detection** | Manual via `.env` | Auto-detected via `K_SERVICE` |
| **CORS Origins** | Manual configuration | Auto-includes service URL |
| **Model Storage** | Local cache directory | Downloaded per container |
| **Authentication** | Optional HF token | Same + GCP service account |
| **Scaling** | Single instance | Auto-scaling |
| **Device** | GPU/CPU based on hardware | CPU only (no GPU support) |

## Best Practices

1. **Use environment variables** for all configuration
2. **Never commit** `.env` file (already in `.gitignore`)
3. **Test locally** before deploying to Cloud Run
4. **Monitor costs** in Google Cloud Console
5. **Use minimum instances** for production to avoid cold starts
6. **Set appropriate resource limits** to control costs
7. **Enable logging** to troubleshoot issues

## Deployment Checklist

Before deploying to Cloud Run, verify:

- [ ] `Dockerfile` copies all required files (`main.py`, `config.py`)
- [ ] `Dockerfile` CMD uses `$PORT` not hardcoded port
- [ ] `.dockerignore` excludes unnecessary files (node_modules, venv, etc.)
- [ ] `requirements.txt` has all dependencies
- [ ] Frontend builds successfully (`npm run build`)
- [ ] Health endpoint works locally
- [ ] API endpoint works with test image locally
- [ ] Environment variables are set in Cloud Run

## Quick Deploy Commands

```bash
# Full deployment from scratch
gcloud run deploy mqt-app \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 8Gi \
  --cpu 4 \
  --timeout 600 \
  --concurrency 1 \
  --max-instances 10

# Update existing deployment with new code
gcloud run deploy mqt-app --source . --region us-central1

# Add HF token for faster model downloads
gcloud run services update mqt-app \
  --update-env-vars HF_TOKEN=hf_your_token \
  --region us-central1

# Production: Keep 1 instance warm to avoid cold starts
gcloud run services update mqt-app \
  --min-instances 1 \
  --region us-central1
```

## Next Steps

- Set up CI/CD with GitHub Actions
- Add Cloud Storage for model caching
- Implement request queuing for high traffic
- Add monitoring and alerting
- Consider GPU instances for production (Cloud Run doesn't support GPUs, use GKE instead)
