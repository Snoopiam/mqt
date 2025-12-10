
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

                // 1. THE INSTRUCTION (Prompt Engineering)
                // We combine the extracted 'Style DNA' with strict structural commands.
                prompt: `${forensicData.generated_prompt}, high fidelity 8k render, photorealistic textures, sharp focus, ambient occlusion shadow pass.`,

                // 2. THE RESTRICTION (Negative Prompt)
                // This strictly forbids the AI from adding elements not in the plan.
                negative_prompt: "text, watermark, low quality, blurred, distorted walls, messy lines, extra furniture, hallucinated plants, phantom cars, organic shapes not in input",

                // 3. THE ARCHITECT (ControlNet)
                // This tells backend: "Use MLSD/Canny to Find Lines and LOCK them."
                controlnet: {
                    module: "mlsd", // Mobile Line Segment Detection (Best for straight architectural lines)
                    weight: 1.0,    // 100% adherence to structure
                    guidance_start: 0.0,
                    guidance_end: 1.0
                },

                // 4. THE ARTIST (Style injection details)
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
        // console.error('[MQT API] Generation failed:', error);
        throw error;
    }
}
