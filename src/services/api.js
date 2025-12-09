
// MQT API Service
// Handles communication with the AI rendering backend

const API_CONFIG = {
    // Replace with your actual backend URL when ready
    // e.g. 'https://api.replicate.com/v1/predictions' or your custom python server
    BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/generate',
    HEADERS: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${import.meta.env.VITE_API_KEY}` 
    }
};

/**
 * Generates an architectural render based on a floor plan and forensic prompt.
 * @param {string}imageBase64 - The input image as a base64 string
 * @param {object} forensicData - The style attributes (prompt, hex_palette, etc.)
 * @returns {Promise<string>} - The URL or Base64 of the generated image
 */
export async function generateRender(imageBase64, forensicData) {
    console.log('[MQT API] Sending request...', forensicData.title);

    try {
        const response = await fetch(API_CONFIG.BASE_URL, {
            method: 'POST',
            headers: API_CONFIG.HEADERS,
            body: JSON.stringify({
                image: imageBase64,
                prompt: forensicData.generated_prompt,
                // Sending specific forensic DNA helps specialized backends (e.g. ControlNet)
                forensics: {
                    hex_palette: forensicData.hex_palette,
                    engine: forensicData.lighting_engine,
                    materiality: forensicData.materiality
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        // Assuming backend returns { output_url: "..." } or { image: "base64..." }
        return data.output_url || data.image;

    } catch (error) {
        console.error('[MQT API] Generation failed:', error);

        // For simulation/testing purposes if backend is missing, 
        // fallback to mock (or remove this block for strict production)
        if (import.meta.env.DEV) {
            console.warn('[MQT API] Falling back to simulation (Dev Mode)');
            return new Promise(resolve => {
                setTimeout(() => resolve(imageBase64), 2000); // Return original as mock
            });
        }

        throw error;
    }
}
