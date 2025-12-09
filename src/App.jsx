import React, { useState } from 'react';
import { generateRender } from './services/api';
import Layout from './components/Layout';
import Uploader from './components/Uploader';
import SplitView from './components/SplitView';
import Controls from './components/Controls';
import Hero from './components/Hero';
import { ArrowLeft } from 'lucide-react';
// ... (imports)


function App() {
  const [showHero, setShowHero] = useState(true);
  const [originalImage, setOriginalImage] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPreset, setCurrentPreset] = useState(null);

  const handleStart = () => {
    setShowHero(false);
  };

  const handleUpload = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setOriginalImage(url);
    setGeneratedImage(url);
  };

  // AUTO-LOAD FOR VERIFICATION


  // AUTO-LOAD FOR VERIFICATION




  const handleGenerate = async () => {
    if (!originalImage || !currentPreset) return;

    setIsGenerating(true);
    try {
      // Prepare data for API
      // In a real scenario, we'd need the base64 string. 
      // For this demo/mock, we pass the URL, but the API service handles the logic.

      // Find current preset forensic data
      // We know controls has this data, but App.jsx might need to fetch it or pass it.
      // For simplicity, we'll let Controls pass the ID, but we need the DATA.
      // Let's import styleData here too or pass it up from Controls?
      // Better: Import styleData here to look it up.

      // Dynamic import logic is tricky inside the function without top-level import.
      // Let's assume styleData is available or we pass the ID.

      // actually, let's just make the call. The API service mock handles the image return.
      const header = await import('./data/style_prompts.json');
      const styleData = header.default;
      const forensicData = styleData[Object.keys(styleData).find(key => styleData[key].id === currentPreset)];

      const result = await generateRender(originalImage, forensicData);
      setGeneratedImage(result);

    } catch (error) {
      console.error("Generation failed", error);
      alert("Failed to generate render. Check console.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setOriginalImage(null);
    setGeneratedImage(null);
  };

  if (showHero) {
    return <Hero onStart={handleStart} />;
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
