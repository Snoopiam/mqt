import React, { useState } from 'react';
import { generateRender } from './services/api';
import Layout from './components/Layout';
import Uploader from './components/Uploader';
import SplitView from './components/SplitView';
import Controls from './components/Controls';
import Hero from './components/Hero';

import { ArrowLeft as GoBackArrow, Download } from 'lucide-react';
import styleData from './data/style_prompts.json';
// ... (imports)


import DevDashboard from './components/DevDashboard';
import StyleCardPlayground from './components/StyleCardPlayground';
import StyleDNALaboratory from './components/StyleDNALaboratory';

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

function App() {
  const [showHero, setShowHero] = useState(true);
  const [showStylePlayground, setShowStylePlayground] = useState(false);
  const [showDesignSystem, setShowDesignSystem] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);

  // Lift styles to state so we can add new ones dynamically
  const [availableStyles, setAvailableStyles] = useState(styleData);

  const [originalImage, setOriginalImage] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPreset, setCurrentPreset] = useState(null);
  const [currentTier, setCurrentTier] = useState("FREE"); // Default to FAST/FREE
  const [customPrompt, setCustomPrompt] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [history, setHistory] = useState([]); // History of generated images

  // Hidden Toggle for Dev Mode (Shift + D)
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.shiftKey && e.key === 'D') {
        setShowDevTools(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleStyleCreated = (newStyle) => {
    // Add new style to state
    setAvailableStyles(prev => ({
      ...prev,
      [newStyle.id]: newStyle
    }));
    // Switch to it immediately
    setCurrentPreset(newStyle.id);
  };

  // Cleanup memory on unmount or change
  React.useEffect(() => {
    return () => {
      if (originalImage) URL.revokeObjectURL(originalImage);
      if (generatedImage && generatedImage !== originalImage) URL.revokeObjectURL(generatedImage);
    };
  }, [originalImage, generatedImage]);

  const handleStart = () => {
    setShowHero(false);
  };

  const handleUpload = (file) => {
    if (!file) return;
    // Release old URL if exists
    if (originalImage) URL.revokeObjectURL(originalImage);

    const url = URL.createObjectURL(file);
    setOriginalImage(url);
    setGeneratedImage(url);
    setUploadedFile(file);
  };

  const handleGenerate = async () => {
    // START GENERATION: Require Image AND (Preset OR Custom Prompt)
    if (!originalImage || (!currentPreset && !customPrompt)) {
        alert("Please select a style preset OR describe a custom style.");
        return;
    }

    setIsGenerating(true);
    try {
      // Prepare data for API
      let imageToSend = originalImage;

      if (uploadedFile) {
        imageToSend = await fileToBase64(uploadedFile);
      }

      let forensicData;

      // PRIORITY 1: CUSTOM PROMPT
      if (customPrompt && customPrompt.trim().length > 0) {
        console.log("Using Custom Prompt:", customPrompt);
        forensicData = {
            id: 'custom_user_prompt',
            name: 'Custom Style',
            generated_prompt: customPrompt, // The backend uses this field
            base_prompt: customPrompt,
            persona: "You are a helpful AI visualizer. Follow the user's custom style description strictly.",
            negative_prompt: "low quality, text, watermark, bad perspective, distortion" // Default safety
        };
      }
      // PRIORITY 2: PRESET
      else if (currentPreset) {
         // Key is the ID, so we can access directly and inject the id
         const presetData = availableStyles[currentPreset];
         if (presetData) {
           forensicData = { ...presetData, id: currentPreset };
         }
      }

      if (!forensicData) {
        throw new Error("Style data invalid");
      }

      // Pass currentTier to the API
      const result = await generateRender(imageToSend, forensicData, currentTier);
      setGeneratedImage(result);

      // Add to History
      setHistory(prev => [result, ...prev].slice(0, 10)); // Keep last 10

    } catch (error) {
      // console.error("Generation failed", error);
      alert(`Generation failed: ${error.message || "Unknown error"}. Please check the console.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    if (originalImage) URL.revokeObjectURL(originalImage);
    if (generatedImage && generatedImage !== originalImage) URL.revokeObjectURL(generatedImage);

    setOriginalImage(null);
    setGeneratedImage(null);
    setUploadedFile(null);
  };


  // Helper to convert base64 to blob synchronously
  const base64ToBlob = (imageData, contentType = 'image/png') => {
    try {
        // Handle blob URLs - can't convert directly
        if (imageData.startsWith('blob:')) {
            console.warn('Cannot convert blob URL to blob directly');
            return null;
        }

        // Validate data URI format
        if (!imageData.includes(',')) {
            console.error('Invalid image data format - missing comma separator');
            return null;
        }

        const base64Data = imageData.split(',')[1];
        if (!base64Data) {
            console.error('Empty base64 data after split');
            return null;
        }

        const byteCharacters = atob(base64Data);
        const byteArrays = [];
        const sliceSize = 512;

        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        return new Blob(byteArrays, { type: contentType });
    } catch (e) {
        console.error("Blob conversion failed:", e);
        return null;
    }
  };

  const handleDownload = () => {
    console.log('[Download] Starting download...');
    console.log('[Download] generatedImage type:', generatedImage ? generatedImage.substring(0, 50) + '...' : 'null');

    if (!generatedImage) {
      alert("No image to download!");
      return;
    }

    // Check if image is still the original upload (blob URL) - not yet generated
    if (generatedImage.startsWith('blob:')) {
      alert("Please generate a render first before downloading.");
      return;
    }

    // Validate it's a proper data URI
    if (!generatedImage.startsWith('data:image/')) {
      console.error('[Download] Invalid format:', generatedImage.substring(0, 100));
      alert("Invalid image format. Please try generating again.");
      return;
    }

    // Get style name for filename
    let styleName = 'custom';
    if (currentPreset && availableStyles[currentPreset]) {
        styleName = availableStyles[currentPreset].title || currentPreset;
    } else if (customPrompt) {
        styleName = 'custom-prompt';
    }

    // Sanitize filename
    const sanitizedStyleName = styleName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    // Detect mime type from the data URI header
    let extension = 'png';
    let mimeType = 'image/png';

    if (generatedImage.startsWith('data:image/jpeg')) {
        extension = 'jpg';
        mimeType = 'image/jpeg';
    } else if (generatedImage.startsWith('data:image/webp')) {
        extension = 'webp';
        mimeType = 'image/webp';
    }

    const filename = `mqt-render-${sanitizedStyleName}-${timestamp}.${extension}`;
    console.log('[Download] Filename:', filename, 'MimeType:', mimeType);

    try {
        // Method 1: Direct data URI download (most reliable for modern browsers)
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = filename;
        link.style.display = 'none';

        // Must append to body for Firefox
        document.body.appendChild(link);

        // Use a slight delay to ensure the link is in DOM
        requestAnimationFrame(() => {
            link.click();
            console.log('[Download] Link clicked');

            // Clean up after download starts
            setTimeout(() => {
                if (link.parentNode) {
                    document.body.removeChild(link);
                }
                console.log('[Download] Cleanup complete');
            }, 500);
        });
    } catch (error) {
        console.error('[Download] Primary method failed:', error);

        // Method 2: Blob fallback
        try {
            const blob = base64ToBlob(generatedImage, mimeType);
            if (blob) {
                const url = window.URL.createObjectURL(blob);
                const fallbackLink = document.createElement('a');
                fallbackLink.href = url;
                fallbackLink.download = filename;
                document.body.appendChild(fallbackLink);
                fallbackLink.click();
                document.body.removeChild(fallbackLink);
                window.URL.revokeObjectURL(url);
                console.log('[Download] Blob fallback succeeded');
            } else {
                throw new Error('Blob conversion returned null');
            }
        } catch (fallbackError) {
            console.error('[Download] Fallback also failed:', fallbackError);
            alert('Download failed. Try right-clicking the image and selecting "Save image as..."');
        }
    }
  };

  if (showStylePlayground) {
    return <StyleCardPlayground onBack={() => setShowStylePlayground(false)} />;
  }

  if (showDesignSystem) {
    return (
        <StyleDNALaboratory 
            onBack={() => setShowDesignSystem(false)} 
            onStyleCreated={handleStyleCreated} 
        />
    );
  }

  if (showHero) {
    return (
      <>
        <Hero
            onStart={handleStart}
            onOpenPlayground={() => setShowStylePlayground(true)}
            onOpenDesignSystem={() => setShowDesignSystem(true)}
        />
        <DevDashboard
          isOpen={showDevTools}
          onClose={() => setShowDevTools(false)}
          onStyleCreated={handleStyleCreated}
          history={history}
        />
      </>
    );
  }

  return (
    <Layout>
      <DevDashboard
          isOpen={showDevTools}
          onClose={() => setShowDevTools(false)}
          onStyleCreated={handleStyleCreated}
          history={history}
          onHistorySelect={setGeneratedImage}
      />
      {!originalImage ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100%', width: '100%', padding: '2rem'
        }}>
          <Uploader onUpload={handleUpload} />

          {/* Back to Hero Button (Optional, but good for navigation) */}
          <button
            onClick={() => setShowHero(true)}
            style={{
              position: 'absolute', top: '24px', left: '24px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            ← Back to Home
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden' }}>

          {/* Main Canvas */}
          <div style={{ flex: 1, position: 'relative', backgroundColor: 'var(--bg-primary)' }}>
            <SplitView
              beforeImage={originalImage}
              afterImage={generatedImage || originalImage}
            />

            {/* Back Button */}
            <button
              onClick={handleReset}
              title="Upload New Plan"
              style={{
                position: 'absolute', top: '24px', left: '24px',
                padding: '10px',
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(8px)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                cursor: 'pointer',
                zIndex: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 77, 0, 0.8)';
                e.currentTarget.style.borderColor = 'transparent';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0,0,0,0.6)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
              }}
            >
              <GoBackArrow size={20} />
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              title="Download Render"
              style={{
                position: 'absolute', top: '24px', right: '24px',
                padding: '10px',
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(8px)',
                color: 'white', // Download is primary action, but white keeps it clean
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                cursor: 'pointer',
                zIndex: 100, // Boosted Z-Index to prevent overlay issues
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--brand-orange)';
                e.currentTarget.style.borderColor = 'transparent';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0,0,0,0.6)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
              }}
            >
              <Download size={20} />
            </button>
          </div>

            {/* Sidebar */}
            <Controls
              currentPreset={currentPreset}
              onSelect={setCurrentPreset}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              // Pass the dynamic styles
              currentStyles={availableStyles}
              onToggleDev={() => setShowDevTools(prev => !prev)}
              currentTier={currentTier}
              onTierChange={setCurrentTier}
            />
        </div>
      )}
    </Layout>
  );
}

export default App;
