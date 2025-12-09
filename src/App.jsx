import React, { useState } from 'react';
import Layout from './components/Layout';
import Uploader from './components/Uploader';
import SplitView from './components/SplitView';
import Controls from './components/Controls';
import Hero from './components/Hero';
import { ArrowLeft } from 'lucide-react';

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
  React.useEffect(() => {
    import('./assets/test_layout.png').then(module => {
      setOriginalImage(module.default);
      setGeneratedImage(module.default);
      setShowHero(false);
      // set current preset to one of the new names if possible, e.g. the first one in the list
    });
  }, []);



  const handleGenerate = () => {
    setIsGenerating(true);
    // Mock generation loading state
    setTimeout(() => {
      setIsGenerating(false);
      // In a real app, this would be the API result
    }, 2500);
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
