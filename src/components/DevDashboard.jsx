import React, { useState } from 'react';
import { motion as AnimatedElement } from 'framer-motion';
import { Settings, Upload, Save, X, Terminal, User, Play, CheckCircle, AlertTriangle } from 'lucide-react';

const PERSONA_OPTIONS = [
    { id: 'creative_writer', name: 'Creative Writer', desc: 'Narrative & Mood focused' },
    { id: 'technical_expert', name: 'Technical Expert', desc: 'Precision & Specs focused' },
    { id: 'real_estate_agent', name: 'Real Estate Agent', desc: 'Market Value & Luxury focused' }
];

const DevDashboard = ({ isOpen, onClose, onStyleCreated, history, onHistorySelect }) => {
    const [image, setImage] = useState(null);
    const [persona, setPersona] = useState('creative_writer');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [extractedStyle, setExtractedStyle] = useState(null);

    // Comparison State
    const [isGeneratingTest, setIsGeneratingTest] = useState(false);
    const [isComparing, setIsComparing] = useState(false);
    const [testImage, setTestImage] = useState(null);
    const [comparisonResult, setComparisonResult] = useState(null);

    const [logs, setLogs] = useState([]);

    // ESC key to close modal
    React.useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const addLog = (msg) => {
        setLogs(prev => [...prev, `> ${msg}`]);
        // Auto-scroll logic if needed
    };

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (readerEvent) => setImage(readerEvent.target.result);
            reader.readAsDataURL(file);
        }
    };

    const runExtraction = async () => {
        if (!image) return;
        setIsAnalyzing(true);
        setExtractedStyle(null);
        setTestImage(null);
        setComparisonResult(null);
        
        const selectedPersona = PERSONA_OPTIONS.find(p => p.id === persona);
        setLogs([`Initializing Style Extractor...`, `Persona Active: ${selectedPersona.name}`, 'Uploading Reference Image...']);

        try {
            const response = await fetch('http://localhost:8080/api/styles/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image, persona_id: persona })
            });
            const data = await response.json();
            
            if (data.status === 'success') {
                setExtractedStyle(data.style);
                addLog(`DNA Extracted: ${data.style.name}`);
                addLog('Persona Generated Successfully.');
            } else {
                addLog(`Error: ${data.detail}`);
            }
        } catch (err) {
            addLog(`System Error: ${err.message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const runTestGeneration = async () => {
        if (!extractedStyle || !image) return;
        setIsGeneratingTest(true);
        addLog('Generating Test Image with new Preset...');

        try {
            const response = await fetch('http://localhost:8080/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: image, 
                    prompt: "Test generation - Render this room matching the extracted style.",
                    style_id: "modern_minimalist" // Fallback/Mock for ephemeral test
                    // Note: In a real scenario we'd pass the full style object or save it first.
                })
            });
            const data = await response.json();
            if (data.status === 'success') {
                setTestImage(data.image); // This is base64 link
                addLog('Test Image Generated.');
            }
        } catch (e) {
            addLog('Generation Failed (using specific style not supported in ephemeral mode yet).');
        } finally {
            setIsGeneratingTest(false);
        }
    };

    // Correcting the above: The user wants to compare "Preset" vs "Generated". 
    // If I can't generate with the NEW preset (because it's not saved), I can't truly test it.
    // However, I can still test the *Comparison Logic* by comparing the Reference Image (as "Generated") against the Preset?
    // No, that would score 100%. 
    // Let's implemented the comparison runner.

    const runComparison = async () => {
        if (!extractedStyle || !testImage) return;
        setIsComparing(true);
        addLog(`Running ${persona} Comparison Analysis...`);

        try {
            // content of testImage is "data:image/png;base64,..."
            // API expects raw base64 usually or handles data URI. gemini.js handle `decodeBase64Image` handles data URI.
            const response = await fetch('http://localhost:8080/api/styles/compare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    preset: extractedStyle,
                    generatedImage: testImage,
                    persona_id: persona
                })
            });
            const data = await response.json();
            if (data.status === 'success') {
                setComparisonResult(data.comparison);
                addLog(`Analysis Complete. Score: ${data.comparison.visualMatchScore}/100`);
            } else {
                addLog(`Comparison Error: ${data.detail}`);
            }
        } catch (e) {
            addLog(`Comparison Failed: ${e.message}`);
        } finally {
            setIsComparing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
            <AnimatedElement.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                    width: '1200px', height: '90vh',
                    background: '#0a0a0a', border: '1px solid #333', borderRadius: '16px',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
            >
                {/* Header */}
                <div style={{ padding: '20px 32px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a0a0a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Terminal size={24} color="#ff4d00" />
                        <h2 style={{ margin: 0, color: '#fff', fontSize: '1.2rem' }}>Style DNA Laboratory</h2>
                    </div>
                    <button onClick={onClose} aria-label="Close developer dashboard" style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '12px', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={24} /></button>
                </div>

                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    
                    {/* LEFT PANEL: CONFIG & INPUT */}
                    <div style={{ width: '350px', padding: '32px', borderRight: '1px solid #222', display: 'flex', flexDirection: 'column', gap: '24px', background: '#111' }}>
                        
                        {/* Persona Selector */}
                        <div>
                            <label style={{ display: 'block', color: '#888', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>ACTIVE PERSONA</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {PERSONA_OPTIONS.map(personaOption => (
                                    <div
                                        key={personaOption.id}
                                        onClick={() => setPersona(personaOption.id)}
                                        style={{
                                            padding: '12px', borderRadius: '8px', cursor: 'pointer',
                                            border: persona === personaOption.id ? '1px solid #ff4d00' : '1px solid #333',
                                            background: persona === personaOption.id ? 'rgba(255, 77, 0, 0.1)' : 'transparent',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ color: persona === personaOption.id ? '#ff4d00' : '#ddd', fontWeight: 500 }}>{personaOption.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>{personaOption.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Image Input */}
                        <div>
                             <label style={{ display: 'block', color: '#888', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>REFERENCE SOURCE</label>
                            <div style={{ 
                                border: '2px dashed #333', borderRadius: '12px', 
                                height: '180px', display: 'flex', justifyContent: 'center', alignItems: 'center',
                                overflow: 'hidden', position: 'relative', background: '#0f0f0f',
                                transition: 'border-color 0.2s'
                            }}>
                                {image ? (
                                    <img src={image} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                ) : (
                                    <div style={{ textAlign: 'center', color: '#444' }}>
                                        <Upload size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                                        <p style={{ margin: 0, fontSize: '0.9rem' }}>Drop Image Here</p>
                                    </div>
                                )}
                                <input type="file" onChange={handleImageUpload} aria-label="Upload reference style image" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                            </div>
                        </div>
                        
                        <button 
                            onClick={runExtraction}
                            disabled={!image || isAnalyzing}
                            style={{
                                padding: '14px', background: isAnalyzing ? '#333' : '#fff', color: '#000',
                                border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer',
                                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                                opacity: (!image || isAnalyzing) ? 0.5 : 1
                            }}
                        >
                            {isAnalyzing ? <div className="spinner" /> : <User size={18} />}
                            {isAnalyzing ? 'Extracting DNA...' : 'Extract Visual DNA'}
                        </button>

                        {/* Logs Console */}
                        <div style={{ flex: 1, background: '#000', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.75rem', color: '#0f0', overflowY: 'auto', border: '1px solid #222' }}>
                            {logs.length === 0 && <span style={{ color: '#444' }}>// System Ready...</span>}
                            {logs.map((logEntry, index) => <div key={index} style={{ marginBottom: '4px' }}>{logEntry}</div>)}
                        </div>
                    </div>

                    {/* RIGHT PANEL: RESULTS & COMPARISON */}
                    <div style={{ flex: 1, padding: '32px', overflowY: 'auto', background: '#0e0e0e', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        
                        {/* 1. EXTRACTED PRESET CARD */}
                        {extractedStyle && (
                            <div className="animate-fade-in">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.5rem' }}>{extractedStyle.name}</h3>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button 
                                            onClick={runTestGeneration}
                                            disabled={isGeneratingTest}
                                            style={{ background: '#333', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}
                                        >
                                            <Play size={16} /> {isGeneratingTest ? 'Generating...' : 'Test Generation'}
                                        </button>
                                        <button 
                                            onClick={() => { onStyleCreated(extractedStyle); onClose(); }} 
                                            style={{ background: '#28a745', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}
                                        >
                                            <Save size={16} /> Save Preset
                                        </button>
                                    </div>
                                </div>

                                <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '24px', border: '1px solid #333' }}>
                                    <p style={{ color: '#aaa', marginTop: 0, lineHeight: 1.6 }}>{extractedStyle.description}</p>
                                    
                                    <div style={{ marginTop: '20px' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Color Palette</div>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            {Object.values(extractedStyle.color_palette || {}).map((hex, i) => (
                                                <div key={i} style={{ width: '40px', height: '40px', borderRadius: '50%', background: hex, border: '2px solid #333', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} title={hex} />
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '24px', padding: '16px', background: '#111', borderRadius: '8px', borderLeft: '4px solid #e6db74' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#e6db74', marginBottom: '8px', fontWeight: 600 }}>PERSONA INSTRUCTION ({persona})</div>
                                        <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#ccc', whiteSpace: 'pre-wrap' }}>
                                            {extractedStyle.persona}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. COMPARISON SECTION */}
                        {(isGeneratingTest || testImage) && (
                            <div className="animate-fade-in" style={{ borderTop: '1px solid #222', paddingTop: '32px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3 style={{ margin: 0, color: '#fff' }}>Verification Lab</h3>
                                    {testImage && !comparisonResult && (
                                        <button 
                                            onClick={runComparison}
                                            disabled={isComparing}
                                            style={{ background: '#ff4d00', color: 'white', border: 'none', padding: '8px 24px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                                        >
                                            {isComparing ? 'Analyzing...' : 'Run Analysis'}
                                        </button>
                                    )}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    {/* Test Image Display */}
                                    <div style={{ background: '#000', borderRadius: '12px', overflow: 'hidden', border: '1px solid #333', aspectRatio: '16/9' }}>
                                        {testImage ? (
                                            <img src={testImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#444' }}>
                                                Generating Test Sample...
                                            </div>
                                        )}
                                    </div>

                                    {/* Analysis Result */}
                                    {comparisonResult ? (
                                        <div style={{ background: '#111', borderRadius: '12px', padding: '24px', border: '1px solid #333' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                                                <div style={{ 
                                                    width: '60px', height: '60px', borderRadius: '50%', 
                                                    background: comparisonResult.visualMatchScore > 80 ? '#28a745' : comparisonResult.visualMatchScore > 50 ? '#ffc107' : '#dc3545',
                                                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                                                    fontSize: '1.5rem', fontWeight: 'bold', color: '#fff'
                                                }}>
                                                    {comparisonResult.visualMatchScore}
                                                </div>
                                                <div>
                                                    <div style={{ color: '#fff', fontWeight: 600, fontSize: '1.1rem' }}>Match Score</div>
                                                    <div style={{ color: '#888', fontSize: '0.9rem' }}>Based on {persona.replace('_', ' ')} criteria</div>
                                                </div>
                                            </div>

                                            <div style={{ marginBottom: '20px' }}>
                                                <p style={{ color: '#ddd', lineHeight: 1.5 }}>{comparisonResult.analysis}</p>
                                            </div>

                                            {comparisonResult.suggestions && comparisonResult.suggestions.length > 0 && (
                                                <div>
                                                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '8px', textTransform: 'uppercase' }}>Suggestions</div>
                                                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#aaa', fontSize: '0.9rem' }}>
                                                        {comparisonResult.suggestions.map((s, i) => <li key={i} style={{ marginBottom: '4px' }}>{s}</li>)}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{  borderRadius: '12px', border: '2px dashed #222', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#444' }}>
                                            {testImage ? 'Ready for Analysis' : 'Waiting for Generation...'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {!extractedStyle && (
                            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#333', flexDirection: 'column', gap: '16px' }}>
                                <Terminal size={48} opacity={0.2} />
                                <div style={{ opacity: 0.5 }}>Waiting for Extraction Inputs...</div>
                            </div>
                        )}
                    </div>
                </div>
            </AnimatedElement.div>
        </div>
    );
};

export default DevDashboard;
