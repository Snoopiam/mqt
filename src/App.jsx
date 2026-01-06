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

const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

function App() {
  const [isHeroScreenVisible, setIsHeroScreenVisible] = useState(true);
  const [isStylePlaygroundVisible, setIsStylePlaygroundVisible] = useState(false);
  const [isDesignSystemVisible, setIsDesignSystemVisible] = useState(false);
  const [isDevToolsVisible, setIsDevToolsVisible] = useState(false);

  // Lift styles to state so we can add new ones dynamically
  const [availableStyles, setAvailableStyles] = useState(styleData);

  const [originalImage, setOriginalImage] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStylePreset, setSelectedStylePreset] = useState(null);
  const [selectedPricingTier, setSelectedPricingTier] = useState("FREE"); // Default to FAST/FREE
  const [customPrompt, setCustomPrompt] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [generationHistory, setGenerationHistory] = useState([]); // History of generated images

  // Style modifiers (line weight, saturation, sharpness) - per spec
  const [styleModifiers, setStyleModifiers] = useState({
    lineWeight: 50,      // 0-100: <40 = fine, >60 = bold
    colorIntensity: 50,  // 0-100: <40 = muted, >60 = vibrant
    sharpness: 50        // 0-100: <35 = soft/painterly, >65 = hyper-sharp
  });

  // Hidden Toggle for Dev Mode (Shift + D)
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.shiftKey && event.key === 'D') {
        setIsDevToolsVisible(prev => !prev);
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
    setSelectedStylePreset(newStyle.id);
  };

  // Cleanup memory on unmount or change
  React.useEffect(() => {
    return () => {
      if (originalImage) URL.revokeObjectURL(originalImage);
      if (generatedImage && generatedImage !== originalImage) URL.revokeObjectURL(generatedImage);
    };
  }, [originalImage, generatedImage]);

  const handleStartCreating = () => {
    setIsHeroScreenVisible(false);
  };

  const handleImageUpload = (file) => {
    if (!file) return;
    // Release old URL if exists
    if (originalImage) URL.revokeObjectURL(originalImage);

    const url = URL.createObjectURL(file);
    setOriginalImage(url);
    setGeneratedImage(url);
    setUploadedFile(file);
  };

  const handleGenerateRender = async () => {
    // START GENERATION: Require Image AND (Preset OR Custom Prompt)
    if (!originalImage || (!selectedStylePreset && !customPrompt)) {
        alert("Please select a style preset OR describe a custom style.");
        return;
    }

    setIsGenerating(true);
    try {
      // Prepare data for API
      let imageToSend = originalImage;

      if (uploadedFile) {
        imageToSend = await convertFileToBase64(uploadedFile);
      }

      let forensicData;

      // PRIORITY 1: CUSTOM PROMPT
      if (customPrompt && customPrompt.trim().length > 0) {
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
      else if (selectedStylePreset) {
         // Key is the ID, so we can access directly and inject the id
         const presetData = availableStyles[selectedStylePreset];
         if (presetData) {
           forensicData = { ...presetData, id: selectedStylePreset };
         }
      }

      if (!forensicData) {
        throw new Error("Style data invalid");
      }

      // Pass selectedPricingTier and styleModifiers to the API
      const result = await generateRender(imageToSend, forensicData, selectedPricingTier, styleModifiers);
      setGeneratedImage(result);

      // Add to History
      setGenerationHistory(prev => [result, ...prev].slice(0, 10)); // Keep last 10

    } catch (error) {
      // console.error("Generation failed", error);
      alert(`Generation failed: ${error.message || "Unknown error"}. Please check the console.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetWorkspace = () => {
    if (originalImage) URL.revokeObjectURL(originalImage);
    if (generatedImage && generatedImage !== originalImage) URL.revokeObjectURL(generatedImage);

    setOriginalImage(null);
    setGeneratedImage(null);
    setUploadedFile(null);
  };


  // Helper to convert base64 to blob synchronously
  const convertBase64ToBlob = (imageData, contentType = 'image/png') => {
    try {
        // Handle blob URLs - can't convert directly
        if (imageData.startsWith('blob:')) {
            return null;
        }

        // Validate data URI format
        if (!imageData.includes(',')) {
            return null;
        }

        const base64Data = imageData.split(',')[1];
        if (!base64Data) {
            return null;
        }

        const byteCharacters = atob(base64Data);
        const byteArrays = [];
        const sliceSize = 512;

        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);
            const byteNumbers = new Array(slice.length);
            for (let byteIndex = 0; byteIndex < slice.length; byteIndex++) {
                byteNumbers[byteIndex] = slice.charCodeAt(byteIndex);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        return new Blob(byteArrays, { type: contentType });
    } catch (e) {
        return null;
    }
  };

  const handleDownloadRender = () => {
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
      alert("Invalid image format. Please try generating again.");
      return;
    }

    // Get style name for filename
    let styleName = 'custom';
    if (selectedStylePreset && availableStyles[selectedStylePreset]) {
        styleName = availableStyles[selectedStylePreset].title || selectedStylePreset;
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

            // Clean up after download starts
            setTimeout(() => {
                if (link.parentNode) {
                    document.body.removeChild(link);
                }
            }, 500);
        });
    } catch (error) {
        // Method 2: Blob fallback
        try {
            const blob = convertBase64ToBlob(generatedImage, mimeType);
            if (blob) {
                const url = window.URL.createObjectURL(blob);
                const fallbackLink = document.createElement('a');
                fallbackLink.href = url;
                fallbackLink.download = filename;
                document.body.appendChild(fallbackLink);
                fallbackLink.click();
                document.body.removeChild(fallbackLink);
                window.URL.revokeObjectURL(url);
            } else {
                throw new Error('Blob conversion returned null');
            }
        } catch (fallbackError) {
            alert('Download failed. Try right-clicking the image and selecting "Save image as..."');
        }
    }
  };

  if (isStylePlaygroundVisible) {
    return <StyleCardPlayground onBack={() => setIsStylePlaygroundVisible(false)} />;
  }

  if (isDesignSystemVisible) {
    return (
        <StyleDNALaboratory
            onBack={() => setIsDesignSystemVisible(false)}
            onStyleCreated={handleStyleCreated}
        />
    );
  }

  if (isHeroScreenVisible) {
    return (
      <>
        <Hero
            onStartCreating={handleStartCreating}
            onOpenStylePlayground={() => setIsStylePlaygroundVisible(true)}
            onOpenStyleDNALab={() => setIsDesignSystemVisible(true)}
        />
        <DevDashboard
          isOpen={isDevToolsVisible}
          onClose={() => setIsDevToolsVisible(false)}
          onStyleCreated={handleStyleCreated}
          history={generationHistory}
        />
      </>
    );
  }

  return (
    <Layout>
      <DevDashboard
          isOpen={isDevToolsVisible}
          onClose={() => setIsDevToolsVisible(false)}
          onStyleCreated={handleStyleCreated}
          history={generationHistory}
          onHistorySelect={setGeneratedImage}
      />
      {!originalImage ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100%', width: '100%', padding: '2rem'
        }}>
          <Uploader onUpload={handleImageUpload} />

          {/* Back to Hero Button (Optional, but good for navigation) */}
          <button
            onClick={() => setIsHeroScreenVisible(true)}
            style={{
              position: 'absolute', top: '24px', left: '24px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-color-secondary)',
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
          <div style={{ flex: 1, position: 'relative', backgroundColor: 'var(--background-color-primary)' }}>
            <SplitView
              beforeImage={originalImage}
              afterImage={generatedImage || originalImage}
            />

            {/* Back Button */}
            <button
              onClick={handleResetWorkspace}
              title="Upload New Plan"
              aria-label="Go back and upload new plan"
              style={{
                position: 'absolute', top: '24px', left: '24px',
                padding: '12px',
                minWidth: '44px',
                minHeight: '44px',
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
              onMouseEnter={(event) => {
                event.currentTarget.style.background = 'rgba(255, 77, 0, 0.8)';
                event.currentTarget.style.borderColor = 'transparent';
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.background = 'rgba(0,0,0,0.6)';
                event.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
              }}
            >
              <GoBackArrow size={20} />
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownloadRender}
              title="Download Render"
              aria-label="Download generated render"
              style={{
                position: 'absolute', top: '24px', right: '24px',
                padding: '12px',
                minWidth: '44px',
                minHeight: '44px',
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(8px)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                cursor: 'pointer',
                zIndex: 100,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.background = 'var(--brand-orange)';
                event.currentTarget.style.borderColor = 'transparent';
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.background = 'rgba(0,0,0,0.6)';
                event.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
              }}
            >
              <Download size={20} />
            </button>
          </div>

            {/* Sidebar */}
            <Controls
              currentPreset={selectedStylePreset}
              onSelect={setSelectedStylePreset}
              onGenerate={handleGenerateRender}
              isGenerating={isGenerating}
              // Pass the dynamic styles
              currentStyles={availableStyles}
              onToggleDev={() => setIsDevToolsVisible(prev => !prev)}
              currentTier={selectedPricingTier}
              onTierChange={setSelectedPricingTier}
              // Style modifiers (line weight, saturation, sharpness)
              modifiers={styleModifiers}
              onModifiersChange={setStyleModifiers}
            />
        </div>
      )}
    </Layout>
  );
}

export default App;
