# MQT User Manual

Welcome to **MQT: The AI Maquettiste**. This guide will help you navigate the application to transform your technical floor plans into stunning marketing visuals.

## 1. The Landing Page
When you first open MQT, you are greeted by the Hero page.
-   **Action**: Click the **"Start Creating"** button to enter the main studio.

## 2. Uploading Your Plan
You will see a large upload area in the center of the screen.
-   **Supported Formats**: JPG, PNG, PDF (converted to image).
-   **Method**: Drag and drop your file into the box, or click to browse your computer.

## 3. The Studio Interface
Once an image is uploaded, the interface transforms into the Studio Mode.

### The Workspace (Center)
-   **Split View**: Your original image is on the left, and the generated render is on the right.
-   **Slider**: Drag the vertical slider bar left or right to reveal more of either image.
-   **Zoom & Pan**:
    -   **Zoom**: Scroll your mouse wheel or use the `+` / `-` buttons in the corner.
    -   **Pan**: Click and drag anywhere on the image to move around. Both images move in perfect sync.

### The Control Panel (Right)
This is where you define the artistic style.

-   **Style Selector**: A list of forensic styles (e.g., "Midnight Azure", "Modern Chic").
    -   **Thumbnails**: These are "Smart Swatches" generated from the style's color DNA. They show you the exact color palette the AI will use.
    -   **Selection**: Click any style to apply its "DNA" to your settings.
    
-   **Forensic Data**: Below the list, you can see the deep details of the selected style:
    -   **Prompt DNA**: The Hex codes and attributes (Lighting, Materiality) that define the look.

-   **Generate**: Click the orange **"Generate Render"** button to create your art. The AI will process your floor plan using the selected style settings.
    *   *Note: Generation time depends on your hardware (GPU is recommended). First-time runs may take longer to load the model.*

## 4. Resetting
To start over with a new plan:
-   Click the **"Back" arrow** icon in the top-left corner of the workspace. This brings you back to the upload screen.

## 5. Troubleshooting / Common Issues

-   **"Model not loaded" Error**: Check that the backend server (`python main.py`) is running. The model takes a moment to load on startup.
-   **Generation is slow**: Without a GPU (NVIDIA CUDA), generation runs on CPU, which can take 1-3 minutes per image.
-   **Upload fails**: Ensure your file is a valid JPG or PNG image. PDF support is experimental.

---
*MQT User Manual v1.1*
