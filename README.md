# MQT: The AI Maquettiste

**MQT** (short for *Maquettiste*) is an advanced web application designed to bridge the gap between technical floor plans and artistic architectural presentations. It allows users to upload 2D CAD drawings and instantly visualize them in various artistic styles using a "Visual Forensics" approach to style transfer.

## Key Features

-   **Forensic Style Transfer**: Select from a curated list of architecturally forensic styles (e.g., "Emerald Eco", "Gilded Noir") defined by precise Hex palettes, lighting engines, and materiality.
-   **Image-Free UI**: The application uses a lightweight, data-driven UI where style thumbnails are generated programmatically from "Color DNA" gradients, keeping the app fast and efficient.
-   **Split-View Comparison**: Real-time side-by-side comparison of your original floor plan and the AI-generated render, featuring synchronized Zoom and Pan for detailed inspection.
-   **Dark Mode Aesthetics**: A premium, highly polished dark mode interface designed for creative professionals.

## Tech Stack

-   **Frontend**: React (Vite)
-   **Styling**: Vanilla CSS (Variables & Tokens)
-   **Icons**: Lucide React
-   **Analysis**: Custom Node.js scripts for forensic data extraction.

## Getting Started

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Snoopiam/mqt.git
    cd mqt
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run the analysis script (optional)**:
    If you add new presets to `src/assets/presets`, regenerate the forensic data:
    ```bash
    npm run analyze
    ```

4.  **Start the development server**:
    ```bash
    npm run dev
    ```

5.  **Build for production**:
    ```bash
    npm run build
    ```

## Project Structure

-   `src/components`: Core UI components (SplitView, Controls, Hero, etc.).
-   `src/data`: Contains `style_prompts.json`, the forensic DNA database.
-   `scripts/analyze_presets.js`: Tool to extract color/style attributes from images.

---
*Created by SnoopLabs*
