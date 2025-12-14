"""
MQT Backend Audit Script

Tests the deployed Cloud Run API to verify all endpoints work correctly.
Run after deployment to validate the fixes.
"""

import requests
import base64
import json
import logging
import sys
from datetime import datetime

# Configuration - Update this URL to match your Cloud Run deployment
API_BASE_URL = "https://mqt-app-186292691900.us-central1.run.app"
API_GENERATE_URL = f"{API_BASE_URL}/api/generate"
API_HEALTH_URL = f"{API_BASE_URL}/health"

# Valid 512x512 White Image (PNG format)
VALID_IMAGE_B64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIBAQMAAACQ+VNqAAAABlBMVEX///8AAABVwtN+AAAAAnRSTlMAmmK4+QAAAAlwSFlzAAALEwAACxMBAJqcGAAAAWJJREFUeNrtwTEBAAAAwqD1T20ND6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgzwAlAAAB0/59xQAAAABJRU5ErkJggg=="

logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("audit_report.txt", mode='w'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def test_health_endpoint():
    """Test the health check endpoint."""
    logger.info("--- Testing Health Endpoint ---")
    try:
        response = requests.get(API_HEALTH_URL, timeout=30)
        logger.info(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            logger.error(f"FAILED: Health check returned {response.status_code}")
            return False
        
        data = response.json()
        logger.info(f"Health Response: {json.dumps(data, indent=2)}")
        
        if data.get("status") != "ok":
            logger.error("FAILED: Health status is not 'ok'")
            return False
        
        if not data.get("model_loaded"):
            logger.warning("WARNING: Model not loaded - API calls will fail with 503")
            return False
        
        logger.info("Success: Health check passed")
        return True
    except Exception as e:
        logger.error(f"FAILED: Exception occurred: {e}")
        return False


def test_scenario(name, payload, expected_status=200, timeout=120):
    """Test a specific API scenario."""
    logger.info(f"--- Running Scenario: {name} ---")
    try:
        response = requests.post(
            API_GENERATE_URL, 
            json=payload, 
            headers={"Content-Type": "application/json"}, 
            timeout=timeout
        )
        
        status_match = response.status_code == expected_status
        logger.info(f"Status Code: {response.status_code} (Expected: {expected_status})")
        
        if not status_match:
            logger.error(f"FAILED: Status code mismatch. Response: {response.text[:500]}")
            return False

        if expected_status == 200:
            data = response.json()
            if "image" not in data:
                logger.error("FAILED: 'image' key missing in success response")
                return False
            if data.get("status") != "success":
                logger.error(f"FAILED: Response status is not 'success': {data.get('status')}")
                return False
            logger.info(f"Success: Image returned. Processing time: {data.get('meta', {}).get('processing_time', 'N/A')}ms")
        elif expected_status == 400:
            # Check for proper error detail
            try:
                data = response.json()
                if "detail" in data:
                    logger.info(f"Success: Got expected 400 with detail: {data['detail'][:100]}")
                else:
                    logger.warning("Note: 400 response missing 'detail' field")
            except:
                pass
            logger.info(f"Success: Correctly received error {response.status_code}")
        else:
            logger.info(f"Success: Correctly received error {response.status_code}")
            
        return True
    except requests.exceptions.Timeout:
        logger.error(f"FAILED: Request timed out after {timeout}s")
        return False
    except Exception as e:
        logger.error(f"FAILED: Exception occurred: {e}")
        return False

def run_audit(skip_slow=False):
    """
    Run full audit against the deployed API.
    
    Args:
        skip_slow: If True, skip tests that require model inference (for quick validation)
    """
    logger.info(f"Starting Backend Audit against {API_BASE_URL}")
    logger.info(f"Timestamp: {datetime.now().isoformat()}")
    results = []

    # 0. Health Check (always run first)
    results.append(("Health Check", test_health_endpoint()))

    # Base payload for tests
    payload_happy = {
        "image": VALID_IMAGE_B64,
        "prompt": "Architectural floor plan, Isometric Projection, style of Octane Render",
        "negative_prompt": "text, watermark",
        "controlnet": {"module": "mlsd", "weight": 1.0},
        "forensics": {"hex_palette": ["#000000"], "engine": "Octane", "materiality": "Sketch"}
    }

    # 1. Missing Image (validation error - fast)
    payload_no_image = payload_happy.copy()
    del payload_no_image["image"]
    results.append(("Missing Image Field", test_scenario("Missing Image Field", payload_no_image, expected_status=422)))

    # 2. Invalid Base64 (now returns 400 with proper error message)
    payload_bad_img = payload_happy.copy()
    payload_bad_img["image"] = "not_an_image_string"
    results.append(("Invalid Base64 String", test_scenario("Invalid Base64 String", payload_bad_img, expected_status=400)))

    # 3. Empty Base64 data
    payload_empty_b64 = payload_happy.copy()
    payload_empty_b64["image"] = "data:image/png;base64,"
    results.append(("Empty Base64 Data", test_scenario("Empty Base64 Data", payload_empty_b64, expected_status=400)))

    # 4. Invalid image format (valid base64, but not an image)
    payload_not_image = payload_happy.copy()
    payload_not_image["image"] = f"data:image/png;base64,{base64.b64encode(b'not an image').decode()}"
    results.append(("Not An Image", test_scenario("Not An Image (valid base64)", payload_not_image, expected_status=400)))

    if not skip_slow:
        # These tests require actual model inference and take 30-120s each
        logger.info("Running slow tests (model inference required)...")
        
        # 5. Happy Path (full generation)
        results.append(("Happy Path", test_scenario("Happy Path (Standard Request)", payload_happy, timeout=180)))

        # 6. Empty Prompt (should still work)
        payload_empty_prompt = payload_happy.copy()
        payload_empty_prompt["prompt"] = ""
        results.append(("Empty Prompt", test_scenario("Empty Prompt", payload_empty_prompt, timeout=180)))

        # 7. Missing ControlNet (Backend has optional)
        payload_no_control = payload_happy.copy()
        del payload_no_control["controlnet"]
        results.append(("Missing ControlNet", test_scenario("Missing ControlNet (Optional)", payload_no_control, timeout=180)))
    else:
        logger.info("Skipping slow tests (--skip-slow flag set)")

    # Summary
    logger.info("=" * 50)
    logger.info("AUDIT SUMMARY")
    logger.info("=" * 50)
    
    passed = 0
    failed = 0
    for name, result in results:
        status = "PASS" if result else "FAIL"
        logger.info(f"  {name}: {status}")
        if result:
            passed += 1
        else:
            failed += 1
    
    logger.info("-" * 50)
    logger.info(f"Total: {passed}/{len(results)} tests passed")
    
    if failed == 0:
        logger.info("AUDIT RESULT: ALL TESTS PASSED")
        return True
    else:
        logger.error(f"AUDIT RESULT: {failed} TESTS FAILED")
        return False

if __name__ == "__main__":
    skip_slow = "--skip-slow" in sys.argv or "-s" in sys.argv
    success = run_audit(skip_slow=skip_slow)
    sys.exit(0 if success else 1)
