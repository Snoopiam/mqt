import React, { useState } from 'react';
import { generateRender } from './services/api';

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};
import Layout from './components/Layout';
import Uploader from './components/Uploader';
import SplitView from './components/SplitView';
import Controls from './components/Controls';
import Hero from './components/Hero';

import { ArrowLeft, Download } from 'lucide-react';
import styleData from './data/style_prompts.json';
// ... (imports)


function App() {
  const [showHero, setShowHero] = useState(true);

  const [originalImage, setOriginalImage] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPreset, setCurrentPreset] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

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
    if (!originalImage || !currentPreset) return;

    setIsGenerating(true);
    try {
      // Prepare data for API
      let imageToSend = originalImage;

      if (uploadedFile) {
        imageToSend = await fileToBase64(uploadedFile);
      }

      // Find current preset forensic data
      const forensicData = styleData[Object.keys(styleData).find(key => styleData[key].id === currentPreset)];

      if (!forensicData) {
        throw new Error("Preset data not found");
      }

      const result = await generateRender(imageToSend, forensicData);
      setGeneratedImage(result);

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

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `mqt-render-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };



  if (showHero) {
    return (
      <>
        <Hero onStart={handleStart} />

      </>
    );
  }

  return (
    <Layout>
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
              <ArrowLeft size={20} />
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
                zIndex: 20,
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
          />
        </div>
      )}
    </Layout>
  );
}

export default App;
