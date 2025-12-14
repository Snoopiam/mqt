// MQT API Service
// Handles communication with the AI rendering backend

/**
 * Determine the API base URL based on environment:
 * - Production (Cloud Run): Use relative URL since frontend is served from same origin
 * - Development: Use localhost with configurable port
 */
function getApiBaseUrl() {
    // If explicitly set via environment variable, use that
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    // In production build (served from FastAPI), use relative URL
    // This works because the frontend is served from the same origin as the API
    if (import.meta.env.PROD) {
        return '/api/generate';
    }

    // In development, use localhost
    return 'http://localhost:8080/api/generate';
}

const API_CONFIG = {
    BASE_URL: getApiBaseUrl(),
    HEADERS: {
        'Content-Type': 'application/json',
    }
};

/**
 * Generates an architectural render based on a floor plan and forensic prompt.
 * @param {string}imageBase64 - The input image as a base64 string
 * @param {object} forensicData - The style attributes (prompt, hex_palette, etc.)
 * @returns {Promise<string>} - The URL or Base64 of the generated image
 */
export async function generateRender(imageBase64, forensicData, tier = null) {
    // console.log('[MQT API] Sending request...', forensicData.title);

    // Mock Mode Check
    if (import.meta.env.VITE_USE_MOCK === 'true') {
        console.log('[MQT API] Mock Mode enabled. Simulating generation...');
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('[MQT API] Mock generation complete.');
                // Return the original image as the "generated" result for testing flow
                resolve(imageBase64);
            }, 2000); // 2 second simulated delay
        });
    }

    try {
        const response = await fetch(API_CONFIG.BASE_URL, {
            method: 'POST',
            headers: API_CONFIG.HEADERS,
            body: JSON.stringify({
                image: imageBase64,
                tier: tier, // Pass the tier selection (FREE, PREMIUM, etc.)

                // THE INSTRUCTION: Combine style prompt with quality modifiers
                prompt: `${forensicData.generated_prompt}, high fidelity 8k render, photorealistic textures, sharp focus, ambient occlusion shadow pass.`,

                // THE RESTRICTION: Negative prompt to prevent hallucinations
                negative_prompt: "text, watermark, low quality, blurred, distorted walls, messy lines, extra furniture, hallucinated plants, phantom cars, organic shapes not in input, structural changes, layout modifications",

                // Style preset ID for backend style lookup
                style_id: forensicData.id
            })
        });

        if (!response.ok) {
            // Try to get detailed error message from response
            let errorDetail = response.statusText;
            try {
                const errorData = await response.json();
                errorDetail = errorData.detail || errorData.message || errorDetail;
            } catch {
                // Response wasn't JSON, use status text
            }
            throw new Error(`API Error (${response.status}): ${errorDetail}`);
        }

        const data = await response.json();

        // Check for success status in response
        if (data.status === 'success' && data.image) {
            return data.image;
        }

        // Fallback for different response formats
        return data.output_url || data.image;

    } catch (error) {
        console.error('[MQT API] Generation failed:', error);
        throw error;
    }
}
