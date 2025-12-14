# MQT: The AI Maquettiste

**MQT** (short for _Maquettiste_) is an advanced web application designed to bridge the gap between technical floor plans and artistic architectural presentations. It allows users to upload 2D CAD drawings and instantly visualize them in various artistic styles using a "Visual Forensics" approach to style transfer, powered by Google Gemini AI.

---

## 🌟 Key Features

- **Gemini AI Rendering**: Powered by Google's Gemini API for intelligent floor plan analysis and visualization generation.
- **Forensic Style Transfer**: Select from 12+ curated architectural styles (e.g., "Dark Teal Minimalist", "Orange Accent Modern") defined by precise color palettes, lighting, and materiality.
- **High-Fidelity Interaction**: Premium "Forensic Flip Cards" that reveal style DNA on hover, and an elastic "Spring Physics" comparison slider.
- **Glassmorphism UI**: A production-grade "Apple Vision" inspired aesthetic with frosted glass sidebars and controls.
- **Split-View Comparison**: Real-time side-by-side comparison featuring synchronized Zoom and Pan for detailed inspection.
- **Single Server Architecture**: One unified Node.js server - no Python, no multiple processes.

---

## 🛠️ Tech Stack

- **Frontend**: React 19 (Vite)
- **Backend**: Node.js (Express)
- **AI Model**: Google Gemini API (Vision + Image Generation)
- **Animation**: Framer Motion (Spring Physics, 3D Transforms)
- **Styling**: Vanilla CSS (CSS Variables, Glassmorphism Tokens)
- **Icons**: Lucide React
- **Image Processing**: Sharp

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **Google Gemini API Key** - [Get one here](https://aistudio.google.com/app/apikey)

### Installation

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/Snoopiam/mqt.git
    cd mqt
    ```

2.  **Install Dependencies**:

    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:

    Copy the example environment file and add your Gemini API key:

    ```bash
    cp .env.example .env
    ```

    Edit `.env`:

    ```bash
    GEMINI_API_KEY=your_gemini_api_key_here
    ```

### Running the Application

#### Development Mode (with Hot Reload)

```bash
npm run dev
```

Access at **`http://localhost:8080`**

That's it! One command runs everything.

#### Production Mode

```bash
npm run build
npm start
```

Or use the preview command:

```bash
npm run preview
```

---

## 📖 User Manual

### Getting Started with MQT

#### 1. The Landing Page

When you first open MQT, you'll see the Hero landing page.

- **Action**: Click the **"Start Creating"** button to enter the main studio.

#### 2. Uploading Your Floor Plan

You'll see a large upload area in the center of the screen.

- **Supported Formats**: JPG, PNG
- **Recommended**: High-contrast line drawings or CAD exports
- **Method**: Drag and drop your file into the box, or click to browse your computer

#### 3. The Studio Interface

Once an image is uploaded, the interface transforms into Studio Mode.

**The Workspace (Center)**

- **Split View**: Your original image is on the left, the generated render on the right
- **Slider**: Drag the vertical slider bar left or right to reveal more of either image
- **Zoom & Pan**:
  - **Zoom**: Scroll your mouse wheel or use the `+` / `-` buttons
  - **Pan**: Click and drag anywhere on the image to move around. Both images move in perfect sync!

**The Control Panel (Right)**
This is where you define the artistic style.

- **Style Selector**: A list of 12 forensic styles (e.g., "Dark Teal Minimalist", "Terracotta Monochrome")
  - **Smart Swatches**: Color gradients generated from the style's DNA palette
  - **Selection**: Click any style to apply its "DNA" to your settings
- **Forensic Data**: Below the list, see the deep details of the selected style:

  - **Color DNA**: The exact Hex codes used in rendering
  - **Lighting Engine**: The simulated lighting style
  - **Materiality**: Key materials (e.g., Concrete, Wood, Glass)

- **Generate**: Click the **"Generate Render"** button to create your visualization

  > **Note**: Generation typically takes 10-30 seconds depending on your API tier.

#### 4. Comparing Results

- Use the **spring physics slider** to compare original vs. rendered
- **Zoom in** to inspect details and verify geometry preservation
- **Pan** to explore different areas of the render

#### 5. Starting Over

To upload a new floor plan:

- Click the **"Back" arrow** icon in the top-left corner of the workspace
- This returns you to the upload screen

---

## ⚙️ Configuration

### Environment Variables

MQT uses environment variables for configuration. Copy `.env.example` to `.env` and configure:

```bash
# Required: Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Model Tier: FREE | MID | PREMIUM | ULTRA
# FREE: 100 generations/day, uses gemini-2.5-flash
# MID: Unlimited, uses gemini-2.5-flash
# PREMIUM: Unlimited, uses Imagen 3
# ULTRA: Unlimited, uses gemini-3-pro-preview
MODEL_TIER=FREE

# Application Profile: USER | DEV
APP_PROFILE=USER

# Server Port (default: 8080)
PORT=8080

# Feature Toggles (all default to false)
ENABLE_REFINEMENT=false
ENABLE_PRESET_LEARNING=false
ENABLE_MULTI_FORMAT_DOWNLOAD=false
```

### Adding Custom Styles

MQT's "Visual Forensics" system allows you to expand the style library by editing `server/styles.js`.

---

## 🔧 Troubleshooting

### Common Issues & Solutions

#### "Gemini API not initialized" Error

**Problem**: Backend returns 503 error

**Solutions**:

- Ensure `GEMINI_API_KEY` is set in `.env`
- Verify your API key is valid at [Google AI Studio](https://aistudio.google.com/)
- Restart the server after changing `.env`

#### "Daily limit reached" Error

**Problem**: Backend returns 429 error

**Cause**: FREE tier has 100 generations/day limit

**Solutions**:

- Wait until tomorrow (resets at midnight)
- Set `MODEL_TIER=MID` or higher (requires billing)

#### Generation Fails with "Model did not return image"

**Problem**: API call succeeds but no image is returned

**Solutions**:

- Check your Gemini API tier supports image generation
- Ensure you're using a model that supports image output
- Check the server logs for detailed error messages

#### Upload Fails

**Problem**: File won't upload or shows error

**Solutions**:

- Ensure file is JPG or PNG format
- Check file size is under 10MB
- Open browser DevTools (F12) → Console tab for detailed error messages

---

## 📁 Project Structure

```
MQT/
├── src/                  # Frontend (React components, services, styles)
│   ├── components/       # React components
│   ├── services/         # API client
│   └── data/             # Style data (JSON)
├── server/               # Backend (Node.js Express server)
│   ├── index.js          # Main server entry point
│   ├── config.js         # Configuration management
│   ├── gemini.js         # Gemini API integration
│   └── styles.js         # Style presets
├── dist/                 # Built frontend (production)
├── package.json          # Dependencies and scripts
├── vite.config.js        # Vite configuration
├── Dockerfile            # Container build
└── README.md             # This file
```

---

## 🗺️ Roadmap

See [ROADMAP.md](ROADMAP.md) for detailed development plans.

**Highlights**:

- ✅ **Completed**: Gemini API migration, single-server architecture
- 🔄 **In Progress**: Refinement feature, preset learning
- 📋 **Planned**: Natural language prompts, user accounts

---

## 🚢 Deployment

### Docker

```bash
docker build -t mqt-app .
docker run -p 8080:8080 -e GEMINI_API_KEY=your_key mqt-app
```

### Google Cloud Run

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed Cloud Run deployment instructions.

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

- 🐛 **Bug Reports**: Open an issue with detailed reproduction steps
- ✨ **Feature Requests**: Suggest new features or improvements
- 📝 **Documentation**: Improve guides, add examples
- 🔧 **Code**: Submit pull requests for bug fixes or features

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Snoopiam/mqt/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Snoopiam/mqt/discussions)
- **Email**: support@snooplabs.ai

---

## 📄 License

See [LICENSE](LICENSE) file for details.

---

_Created by [SnoopLabs](https://snooplabs.ai)_  
_Last Updated: December 12, 2025_
