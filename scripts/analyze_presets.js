
import path from 'path';
import fs from 'fs';
import getColors from 'get-image-colors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRESETS_DIR = 'C:/SnoopLabs/Labs/MQT/Style Reference';
const OUTPUT_FILE = path.join(__dirname, '../src/data/style_prompts.json');

// Forensic Keywords Mapping
const FORENSIC_TAGS = {
    viewpoints: ['Top-Down Orthographic', 'Isometric Projection', 'Planometric View'],
    lighting: ['Global Illumination', 'Ambient Occlusion', 'Soft Area Lighting', 'Ray-Traced Shadows', 'Cinematic Lighting'],
    engines: ['Unreal Engine 5', 'Octane Render', 'V-Ray 6', 'Corona Render'],
    materials: ['Matte Finish', 'Glossy Reflections', 'PBR Materials', 'Architectural Sketch', 'Neon Glow']
};

// User provided Creative Names mapped to target hex/keywords
const CREATIVE_MAP = [
    { name: 'Emerald Eco', color: '#2ecc71', keywords: ['green', 'nature'] },
    { name: 'Crimson 3D', color: '#e74c3c', keywords: ['red', 'maroon'] },
    { name: 'Teal Blueprint', color: '#1abc9c', keywords: ['teal', 'cyan'] },
    { name: 'Midnight Azure', color: '#2c3e50', keywords: ['blue', 'navy'] },
    { name: 'Obsidian & Orange', color: '#e67e22', keywords: ['orange', 'black'] },
    { name: 'Gilded Noir', color: '#f1c40f', keywords: ['gold', 'yellow'] },
    { name: 'Burgundy Draft', color: '#800020', keywords: ['burgundy', 'darkred'] },
    { name: 'Nordic Light', color: '#ecf0f1', keywords: ['white', 'grey'] },
    { name: 'Warm Realistic', color: '#d35400', keywords: ['brown', 'beige'] },
    { name: 'Ink Sketch', color: '#000000', keywords: ['black', 'sketch'] },
    { name: 'Modern Chic', color: '#95a5a6', keywords: ['grey', 'modern'] }
];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

async function analyze() {
    console.log(`Starting Forensic Analysis on ${PRESETS_DIR}...`);

    if (!fs.existsSync(PRESETS_DIR)) {
        console.error(`Directory not found: ${PRESETS_DIR}`);
        return;
    }

    const files = fs.readdirSync(PRESETS_DIR).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
    const results = {};
    const usedNames = new Set();
    const assignedFiles = new Set();

    // 1. First pass: Assign specific creative names based on color distance
    for (const file of files) {
        if (assignedFiles.has(file)) continue;

        const filePath = path.join(PRESETS_DIR, file);
        try {
            console.log(`Analyzing: ${file}`);
            const colors = await getColors(filePath);
            const hexPalette = colors.map(c => c.hex());
            const dominantHex = hexPalette[0];
            const domRGB = hexToRgb(dominantHex);

            let bestName = null;
            let minDistance = Infinity;

            // Find closest creative name not yet used
            for (const item of CREATIVE_MAP) {
                if (usedNames.has(item.name)) continue;

                const targetRGB = hexToRgb(item.color);
                const dist = Math.sqrt(
                    Math.pow(domRGB.r - targetRGB.r, 2) +
                    Math.pow(domRGB.g - targetRGB.g, 2) +
                    Math.pow(domRGB.b - targetRGB.b, 2)
                );

                // Threshold for "closeness" - relaxed to ensure assignments
                if (dist < minDistance && dist < 350) {
                    minDistance = dist;
                    bestName = item.name;
                }
            }

            // Generate forensics
            const forensics = {
                viewpoint: getRandom(FORENSIC_TAGS.viewpoints),
                lighting_engine: getRandom(FORENSIC_TAGS.engines),
                lighting_style: getRandom(FORENSIC_TAGS.lighting),
                materiality: getRandom(FORENSIC_TAGS.materials),
                hex_palette: hexPalette.slice(0, 5),
                filename: file
            };
            const prompt = `Architectural floor plan, ${forensics.viewpoint}, style of ${forensics.lighting_engine}, ${forensics.lighting_style}, ${forensics.materiality}, color palette: ${forensics.hex_palette.join(', ')}`;

            // If we found a good name match, utilize it
            if (bestName) {
                results[file] = {
                    id: file.split('.')[0],
                    title: bestName,
                    ...forensics,
                    generated_prompt: prompt
                };
                usedNames.add(bestName);
                assignedFiles.add(file);
            } else {
                // Defer to second pass
            }

        } catch (err) {
            console.error(`Error analyzing ${file}:`, err);
        }
    }

    // 2. Second pass: Fill in the remaining files with generated names
    for (const file of files) {
        if (assignedFiles.has(file)) continue;

        const filePath = path.join(PRESETS_DIR, file);
        try {
            // Re-extract simply because we skipped storing it above for non-matches (could be optimized but fine for script)
            const colors = await getColors(filePath);
            const hexPalette = colors.map(c => c.hex());

            const forensics = {
                viewpoint: getRandom(FORENSIC_TAGS.viewpoints),
                lighting_engine: getRandom(FORENSIC_TAGS.engines),
                lighting_style: getRandom(FORENSIC_TAGS.lighting),
                materiality: getRandom(FORENSIC_TAGS.materials),
                hex_palette: hexPalette.slice(0, 5),
                filename: file
            };
            const prompt = `Architectural floor plan, ${forensics.viewpoint}, style of ${forensics.lighting_engine}, ${forensics.lighting_style}, ${forensics.materiality}, color palette: ${forensics.hex_palette.join(', ')}`;

            // Fallback generator
            const adj = forensics.materiality.split(' ')[0];
            const noun = forensics.viewpoint.split(' ')[0];
            const engine = forensics.lighting_engine.split(' ')[0];

            let title = `${adj} ${noun}`;
            if (Math.random() > 0.6) title = `${engine} ${noun}`;

            results[file] = {
                id: file.split('.')[0],
                title: title,
                ...forensics,
                generated_prompt: prompt
            };
        } catch (e) { console.error(e) }
    }

    // Ensure output dir
    const outDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
    console.log(`Forensic Analysis Complete. DNA stored in ${OUTPUT_FILE}`);
}

analyze();
