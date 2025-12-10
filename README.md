# MQT: The AI Maquettiste

**MQT** (short for *Maquettiste*) is an advanced web application designed to bridge the gap between technical floor plans and artistic architectural presentations. It allows users to upload 2D CAD drawings and instantly visualize them in various artistic styles using a "Visual Forensics" approach to style transfer, now powered by real-time Stable Diffusion ControlNet generation.

## Key Features

-   **Generative AI Rendering**: Powered by ControlNet (MLSD) and Stable Diffusion to turn technical line drawings into photorealistic or artistic renders while strictly preserving geometry.
-   **Forensic Style Transfer**: Select from a curated list of architecturally forensic styles (e.g., "Emerald Eco", "Gilded Noir") defined by precise Hex palettes, lighting engines, and materiality.
-   **High-Fidelity Interaction**: Experience premium "Forensic Flip Cards" that reveal style DNA on hover, and an elastic "Spring Physics" comparison slider.
-   **Glassmorphism UI**: A production-grade "Apple Vision" inspired aesthetic with frosted glass sidebars and controls.
-   **Image-Free UI**: The application uses a lightweight, data-driven UI where style thumbnails are generated programmatically from "Color DNA" gradients.
-   **Split-View Comparison**: Real-time side-by-side comparison featuring synchronized Zoom and Pan for detailed inspection.

## Tech Stack

-   **Frontend**: React (Vite)
-   **Backend**: Python (FastAPI, Uvicorn)
-   **AI Model**: Stable Diffusion v1.5 with ControlNet (MLSD)
-   **Animation**: Framer Motion (Spring Physics, 3D Transforms)
-   **Styling**: Vanilla CSS (Variables, Glassmorphism Tokens)
-   **Icons**: Lucide React
-   **Analysis**: Custom Node.js scripts for forensic data extraction.

## Getting Started

### Prerequisites
-   Node.js (v18+)
-   Python (v3.10+)
-   CUDA-enabled GPU (optional, but recommended for faster generation)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Snoopiam/mqt.git
    cd mqt
    ```

2.  **Install Frontend Dependencies**:
    ```bash
    npm install
    ```

3.  **Install Backend Dependencies**:
    Recommended to use a virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    pip install -r requirements.txt
    ```

### Running the Application

4.  **Start the Backend Server**:
    In a new terminal (with venv activated):
    ```bash
    python main.py
    ```
    *The server will start on `http://localhost:8080`. On first run, it will download necessary model weights (approx. 5GB).*

5.  **Start the Frontend Development Server**:
    In a separate terminal:
    ```bash
    npm run dev
    ```
    *Access the app at `http://localhost:5173` (or the port shown in your terminal).*

6.  **Production Build** (Optional):
    To serve the frontend via the FastAPI backend:
    ```bash
    npm run build
    python main.py
    ```
    *The backend enables static file mounting, serving the `dist` folder at root.*

## Project Structure

-   `main.py`: The FastAPI application entry point. Handles image generation requests and model loading.
-   `src/components`: Core UI components (SplitView, Controls, Hero, etc.).
-   `src/data`: Contains `style_prompts.json`, the forensic DNA database.
-   `scripts`: Utility scripts for project maintenance.

## How to Add New Styles

MQT's "Visual Forensics" system allows you to easily expand the style library without writing code.

1.  **Find a Source Image**: Choose an architectural rendering that represents the style you want (e.g., a "Cyberpunk" apartment).
2.  **Add to Assets**: Save the image as a `.jpg` or `.png` in the `src/assets/presets` folder.
3.  **Run Analysis**:
    ```bash
    npm run analyze
    ```
    This script will:
    -   Extract the dominant Hex palette.
    -   Determine the likely Lighting Engine (e.g., Octane, V-Ray).
    -   Analyze Materiality (e.g., Concrete, Wood).
    -   Update `src/data/style_prompts.json` automatically.
4.  **Restart**: Rerun `npm run dev` to see your new style in the Controls sidebar!

---
*Created by SnoopLabs*
