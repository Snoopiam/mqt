import React, { useState } from 'react';
import {
    Dna, Scan, Microscope, FlaskConical, Save, ArrowLeft, Upload, X, Terminal, Play, RotateCcw
} from 'lucide-react';



const StyleDNALaboratory = ({ onBack, onStyleCreated }) => {
    // --- State Logic Copied from DevDashboard ---
    const [image, setImage] = useState(null); // Reference Style Image
    const [testFloorPlan, setTestFloorPlan] = useState(null); // Target Floor Plan for Testing
    const [persona, setPersona] = useState('style_engineer');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [extractedStyle, setExtractedStyle] = useState(null);
    
    // Comparison State
    const [isGeneratingTest, setIsGeneratingTest] = useState(false);
    const [isComparing, setIsComparing] = useState(false);
    const [testImage1, setTestImage1] = useState(null); // Slot A (Fast)
    const [testImage2, setTestImage2] = useState(null); // Slot B (Pro)
    const [comparisonResult, setComparisonResult] = useState(null); // Focusing comparison on selected image for now

    // Refinement feedback - stores what went wrong for AI to adjust approach
    const [lastFailureFeedback, setLastFailureFeedback] = useState(null);
    const [refinementAttempt, setRefinementAttempt] = useState(0);

    const [logs, setLogs] = useState([]);

    const addLog = (msg) => {
        setLogs(prev => [...prev, `> ${msg}`]);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setImage(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleTestFloorPlanUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setTestFloorPlan(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const runExtraction = async (isStrict = false, retryCount = 0) => {
        if (!image) return;
        setIsAnalyzing(true);
        // Reset only if it's a fresh run
        if (retryCount === 0) {
            setExtractedStyle(null);
            setTestImage1(null);
            setTestImage2(null);
            setComparisonResult(null);
        }
        
        const modeLabel = isStrict ? 'CRITICAL STRICT MODE' : 'Standard Mode';
        addLog(`Initiating Extraction Sequence... (${modeLabel})`);
        
        try {
            // STEP 1: EXTRACT DNA ONLY
            addLog(`[1/1] Extracting Visual DNA...`);
            const response = await fetch('http://localhost:8080/api/styles/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image, persona_id: 'style_engineer', strict_mode: isStrict })
            });
            const data = await response.json();
            
            if (data.status !== 'success') {
                throw new Error(data.detail);
            }

            const newStyle = data.style;
            setExtractedStyle(newStyle);
            addLog(`DNA Extracted: ${newStyle.name}`);
            addLog(`WAITING FOR USER: Initialize Manual Verification Protocol.`);

        } catch (err) {
            addLog(`System Error: ${err.message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const runTestGeneration = async (tier = 'FREE', isRedo = false) => {
        if (!extractedStyle) {
            addLog('Error: No DNA extracted yet.');
            return;
        }
        if (!testFloorPlan) {
            addLog('Error: No Test Floor Plan uploaded. Please upload a target plan.');
            return;
        }

        setIsGeneratingTest(true);

        let tierName = 'MODEL 1 (FAST)';
        let targetSlot = 1;

        if (tier === 'ULTRA' || tier === 'PREMIUM') {
            tierName = 'MODEL 2 (PRO)';
            targetSlot = 2;
        }

        // Build refinement context if this is a redo
        let refinementContext = null;
        if (isRedo && lastFailureFeedback) {
            setRefinementAttempt(prev => prev + 1);
            refinementContext = {
                attempt: refinementAttempt + 1,
                previousScore: lastFailureFeedback.score,
                whatWentWrong: lastFailureFeedback.differences || [],
                whatWorked: lastFailureFeedback.matchedAttributes || [],
                aiAnalysis: lastFailureFeedback.analysis,
                suggestions: lastFailureFeedback.suggestions || []
            };
            addLog(`REDO Attempt #${refinementAttempt + 1}: Adjusting approach based on feedback...`);
            addLog(`> Previous issues: ${refinementContext.whatWentWrong.join(', ') || 'None specified'}`);
        } else {
            // Fresh generation - reset refinement state
            setRefinementAttempt(0);
            setLastFailureFeedback(null);
        }

        addLog(`Initiating ${isRedo ? 'REFINED' : 'Manual'} Test Sequence: ${tierName}...`);

        try {
             // 1. We must stage it to generate
            addLog(`> Staging DNA for ${tierName} Run...`);
            const saveRes = await fetch('http://localhost:8080/api/styles', {
                 method: 'POST',
                 headers: {'Content-Type': 'application/json'},
                 body: JSON.stringify({ style: extractedStyle })
            });
            const saveJson = await saveRes.json();
            if (saveJson.status !== 'success') throw new Error('Staging Failed');

            const stagingId = saveJson.id;

            // 2. Generate - include refinement feedback if available
            const generatePayload = {
                image: testFloorPlan,
                prompt: isRedo
                    ? `REFINEMENT ATTEMPT - Previous result was not satisfactory. Adjust your approach.`
                    : "Verification Test Subject - Maintain strict fidelity.",
                style_id: stagingId,
                tier: tier
            };

            // Add refinement context if this is a redo
            if (refinementContext) {
                generatePayload.refinement = refinementContext;
            }

            const response = await fetch('http://localhost:8080/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(generatePayload)
            });
            const data = await response.json();
            if (data.status === 'success') {
                // Prepend Data URI scheme if missing
                const imgSource = data.image.startsWith('data:')
                    ? data.image
                    : `data:image/png;base64,${data.image}`;

                if (targetSlot === 1) setTestImage1(imgSource);
                if (targetSlot === 2) setTestImage2(imgSource);

                addLog(`${tierName} ${isRedo ? 'REDO' : 'Test'} Complete. Image Rendered.`);
                if (isRedo) {
                    addLog(`> Run verification to check if improvements worked.`);
                }
            } else {
                addLog(`${tierName} Failed: ${data.detail}`);
            }
        } catch (e) {
            addLog(`Test Failed: ${e.message}`);
        } finally {
            setIsGeneratingTest(false);
        }
    };

    const runComparison = async (imageToCompare, slotName) => {
        if (!extractedStyle || !imageToCompare) return;
        setIsComparing(true);

        // Determine tier based on slot
        const tier = slotName === 'PRO' ? 'PREMIUM' : 'FREE';
        addLog(`Running DNA Integrity Audit (${slotName}, Tier: ${tier})...`);

        try {
            const response = await fetch('http://localhost:8080/api/styles/compare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    preset: extractedStyle,
                    generatedImage: imageToCompare,
                    referenceImage: image,  // Include original reference for visual comparison
                    persona_id: 'style_engineer',
                    tier: tier  // Pass tier for tier-aware scoring
                })
            });
            const data = await response.json();
            if (data.status === 'success') {
                setComparisonResult(data.comparison);
                addLog(`Audit Complete. Score: ${data.comparison.visualMatchScore}/100`);

                // Store feedback for potential redo - if score < 100, save what went wrong
                if (data.comparison.visualMatchScore < 100) {
                    setLastFailureFeedback({
                        score: data.comparison.visualMatchScore,
                        analysis: data.comparison.analysis,
                        differences: data.comparison.differences || [],
                        matchedAttributes: data.comparison.matchedAttributes || [],
                        suggestions: data.comparison.suggestions || [],
                        tier: tier
                    });
                    addLog(`> Feedback captured. Use REDO to try a different approach.`);
                } else {
                    // Perfect score - clear failure feedback
                    setLastFailureFeedback(null);
                    setRefinementAttempt(0);
                    addLog(`> PERFECT MATCH! No refinement needed.`);
                }
            } else {
                addLog(`Audit Error: ${data.detail}`);
            }
        } catch (e) {
            addLog(`Audit Failed: ${e.message}`);
        } finally {
            setIsComparing(false);
        }
    };



    const handleSaveStyle = async () => {
        if (!extractedStyle) return;
        addLog('Saving to Library...');
        try {
            const res = await fetch('http://localhost:8080/api/styles', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ style: extractedStyle })
            });
            const d = await res.json();
            if (d.status === 'success') {
                addLog(`Style Saved! ID: ${d.id}`);
                // Update the extracted style with the new ID so it's consistent
                const savedStyle = { ...extractedStyle, id: d.id };
                setExtractedStyle(savedStyle);
                
                if (onStyleCreated) onStyleCreated(savedStyle);
            } else {
                addLog(`Save Failed: ${d.detail}`);
            }
        } catch(e) { 
            addLog(`Error: ${e.message}`); 
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: '#030303', color: 'white',
            display: 'flex', flexDirection: 'column',
            fontFamily: '"Geist Mono", "JetBrains Mono", monospace' // Tech vibe
        }}>
            {/* --- HEADER --- */}
            <div style={{
                height: '70px', borderBottom: '1px solid #222',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 32px', background: '#0a0a0a'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button 
                        onClick={onBack}
                        style={{ 
                            background: 'none', border: 'none', color: '#666', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '8px', borderRadius: '8px', transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = '#222'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#666'; e.currentTarget.style.background = 'none'; }}
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div style={{ width: '1px', height: '24px', background: '#333' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: 'linear-gradient(135deg, #ff4d00, #ff0055)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 15px rgba(255, 77, 0, 0.4)'
                        }}>
                            <Dna size={18} color="white" />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Style DNA Laboratory</h1>
                            <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '2px' }}>Structural Analysis & Extraction</div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                     <div style={{
                         padding: '6px 12px', background: '#111', borderRadius: '20px',
                         border: '1px solid #222', fontSize: '0.75rem', color: '#888',
                         display: 'flex', alignItems: 'center', gap: '6px'
                     }}>
                         <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0f0', boxShadow: '0 0 5px #0f0' }} />
                         System Online
                     </div>
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                
                {/* LEFT PANEL: INPUTS */}
                <div style={{ width: '400px', borderRight: '1px solid #222', display: 'flex', flexDirection: 'column', background: '#050505' }}>
                    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px', overflowY: 'auto' }}>
                        
                        {/* SECTION 1: REFERENCE */}
                        <div>
                            <SectionLabel icon={Scan} label="Reference Input" />
                            <div style={{ 
                                marginTop: '12px',
                                border: '2px dashed #333', borderRadius: '12px', 
                                height: '220px', display: 'flex', justifyContent: 'center', alignItems: 'center',
                                overflow: 'hidden', position: 'relative', background: '#0a0a0a',
                                transition: 'all 0.2s', cursor: 'pointer'
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#555'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#333'}
                            >
                                {image ? (
                                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                                        <img src={image} style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.8 }} />
                                        <button 
                                            onClick={(e) => { e.preventDefault(); setImage(null); }}
                                            style={{ 
                                                position: 'absolute', top: '8px', right: '8px',
                                                background: 'rgba(0,0,0,0.8)', border: 'none', color: 'white',
                                                borderRadius: '50%', padding: '4px', cursor: 'pointer'
                                            }}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', color: '#444' }}>
                                        <Upload size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>Upload Style Reference</p>
                                        <p style={{ margin: '4px 0 0', fontSize: '0.75rem', opacity: 0.5 }}>JPG, PNG support</p>
                                    </div>
                                )}
                                <input type="file" onChange={handleImageUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                            </div>
                        </div>

                        {/* SECTION 1.5: TEST SUBJECT (FLOOR PLAN) */}
                        <div>
                            <SectionLabel icon={Scan} label="Test Subject (Floor Plan)" />
                            <div style={{ 
                                marginTop: '12px',
                                border: '2px dashed #333', borderRadius: '12px', 
                                height: '220px', display: 'flex', justifyContent: 'center', alignItems: 'center',
                                overflow: 'hidden', position: 'relative', background: '#0a0a0a',
                                transition: 'all 0.2s', cursor: 'pointer'
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#555'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#333'}
                            >
                                {testFloorPlan ? (
                                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                                        <img src={testFloorPlan} style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.8 }} />
                                        <button 
                                            onClick={(e) => { e.preventDefault(); setTestFloorPlan(null); }}
                                            style={{ 
                                                position: 'absolute', top: '8px', right: '8px',
                                                background: 'rgba(0,0,0,0.8)', border: 'none', color: 'white',
                                                borderRadius: '50%', padding: '4px', cursor: 'pointer'
                                            }}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', color: '#444' }}>
                                        <Upload size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>Upload Floor Plan</p>
                                        <p style={{ margin: '4px 0 0', fontSize: '0.75rem', opacity: 0.5 }}>Used for Validation Test</p>
                                    </div>
                                )}
                                <input type="file" onChange={handleTestFloorPlanUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                            </div>
                        </div>

                        {/* SECTION 2: ANALYSIS MODE (Fixed) */}
                        <div>
                            <SectionLabel icon={Microscope} label="Analysis Mode" />
                            <div style={{ 
                                marginTop: '12px', padding: '16px', borderRadius: '8px', border: '1px solid #222', background: '#0a0a0a',
                                display: 'flex', alignItems: 'center', gap: '12px'
                            }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff4d00', boxShadow: '0 0 10px #ff4d00' }} />
                                <div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ccc' }}>Architectural Style Engineer</div>
                                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>Strict material & structural verification.</div>
                                </div>
                            </div>
                        </div>

                        {/* ACTION */}
                        <button 
                            onClick={() => runExtraction(false)}
                            disabled={!image || isAnalyzing}
                            style={{
                                padding: '16px', background: isAnalyzing ? '#222' : 'white', color: isAnalyzing ? '#888' : 'black',
                                border: 'none', borderRadius: '8px', fontWeight: 700, cursor: isAnalyzing ? 'wait' : 'pointer',
                                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
                                fontSize: '1rem', marginTop: 'auto', transition: 'all 0.2s',
                                opacity: !image ? 0.5 : 1
                            }}
                        >
                            {isAnalyzing ? <FlaskConical className="animate-pulse" size={20} /> : <Dna size={20} />}
                            {isAnalyzing ? 'Analyzing DNA Sequence...' : 'Extract Visual DNA'}
                        </button>
                    </div>

                    {/* CONSOLE */}
                    <div style={{ 
                        height: '200px', background: 'black', borderTop: '1px solid #222',
                        padding: '16px', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem',
                        overflowY: 'auto', color: '#00ff41'
                    }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', opacity: 0.5, borderBottom: '1px solid #222', paddingBottom: '8px' }}>
                            <Terminal size={12} />
                            <span>SYSTEM LOGS</span>
                         </div>
                        {logs.length === 0 && <span style={{ color: '#333' }}>// Ready for input...</span>}
                        {logs.map((L, i) => <div key={i} style={{ marginBottom: '4px' }}>{L}</div>)}
                    </div>
                </div>

                {/* RIGHT PANEL: RESULTS */}
                <div style={{ flex: 1, background: '#0e0e0e', display: 'flex', flexDirection: 'column' }}>
                    
                    {extractedStyle ? (
                        <div style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
                             <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                                
                                {/* HEADER */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '32px' }}>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: '#ff4d00', fontWeight: 600, letterSpacing: '2px', marginBottom: '8px' }}>NEW STRAIN DETECTED</div>
                                        <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, color: 'white' }}>{extractedStyle.name}</h2>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button 
                                            onClick={handleSaveStyle} 
                                            style={{ 
                                                background: '#222', color: 'white', border: '1px solid #444', 
                                                padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', 
                                                display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 600
                                            }}
                                        >
                                            <Save size={18} /> Save to Library
                                        </button>
                                    </div>
                                </div>

                                {/* DNA CARD */}
                                <div style={{ 
                                    background: '#141414', border: '1px solid #2a2a2a', borderRadius: '16px', overflow: 'hidden',
                                    marginBottom: '32px'
                                }}>
                                    <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '40px' }}>
                                        <div>
                                            <h3 style={{ marginTop: 0, fontSize: '1.1rem', color: '#ccc' }}>Analysis Report</h3>
                                            <p style={{ color: '#888', lineHeight: 1.7, fontSize: '0.95rem' }}>{extractedStyle.description}</p>
                                            
                                            <div style={{ marginTop: '24px' }}>
                                                <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Color Chromosomes</div>
                                                <div style={{ display: 'flex', gap: '16px' }}>
                                                    {Object.values(extractedStyle.color_palette || {}).map((hex, i) => (
                                                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: hex, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }} />
                                                            <span style={{ fontSize: '0.7rem', color: '#555', fontFamily: 'monospace' }}>{hex}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div style={{ background: '#0a0a0a', padding: '24px', borderRadius: '12px', border: '1px solid #222' }}>
                                             <div style={{ fontSize: '0.75rem', color: '#ff4d00', marginBottom: '16px', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                                                <span>ENGINEER DIRECTIVE</span>
                                                <span>STRUCTURAL ANALYSIS</span>
                                             </div>
                                             <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem', color: '#aaa', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                                {extractedStyle.persona}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* VERIFICATION LAB */}
                                <div style={{ borderTop: '1px solid #222', paddingTop: '32px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                        <h3 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <FlaskConical size={24} color="#888" />
                                            Verification Chamber
                                        </h3>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                                        
                                        {/* Viewer 1: FAST */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ 
                                                background: 'black', borderRadius: '16px', overflow: 'hidden', 
                                                border: '1px solid #333', aspectRatio: '4/3', position: 'relative'
                                            }}>
                                                {testImage1 ? (
                                                    <img src={testImage1} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#333' }}>
                                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px dashed #333', marginBottom: '12px' }} />
                                                        <span style={{ fontSize: '0.8rem' }}>Model 1 (Fast)</span>
                                                    </div>
                                                )}
                                                <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', color: '#888' }}>FAST</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => runComparison(testImage1, 'FAST')}
                                                    disabled={!testImage1 || isComparing}
                                                    style={{
                                                        flex: 1, background: '#222', color: testImage1 ? 'white' : '#444', border: '1px solid #333',
                                                        padding: '8px', borderRadius: '8px', cursor: testImage1 ? 'pointer' : 'default',
                                                        fontSize: '0.75rem', fontWeight: 600
                                                    }}
                                                >
                                                    Verify
                                                </button>
                                                {lastFailureFeedback && lastFailureFeedback.tier === 'FREE' && (
                                                    <button
                                                        onClick={() => runTestGeneration('FREE', true)}
                                                        disabled={isGeneratingTest}
                                                        style={{
                                                            background: '#1a1a2e', color: '#00d4ff', border: '1px solid #00d4ff',
                                                            padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                                                            fontSize: '0.75rem', fontWeight: 600,
                                                            display: 'flex', alignItems: 'center', gap: '4px'
                                                        }}
                                                        title="Try a different approach based on feedback"
                                                    >
                                                        <RotateCcw size={12} /> Redo
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Viewer 2: PRO */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ 
                                                background: 'black', borderRadius: '16px', overflow: 'hidden', 
                                                border: '1px solid #333', aspectRatio: '4/3', position: 'relative'
                                            }}>
                                                {testImage2 ? (
                                                    <img src={testImage2} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#333' }}>
                                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px dashed #333', marginBottom: '12px' }} />
                                                        <span style={{ fontSize: '0.8rem' }}>Model 2 (Pro)</span>
                                                    </div>
                                                )}
                                                <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(50,20,0,0.9)', border: '1px solid #520', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', color: '#f80' }}>PRO</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => runComparison(testImage2, 'PRO')}
                                                    disabled={!testImage2 || isComparing}
                                                    style={{
                                                        flex: 1, background: '#331100', color: testImage2 ? '#ff4d00' : '#420', border: '1px solid #420',
                                                        padding: '8px', borderRadius: '8px', cursor: testImage2 ? 'pointer' : 'default',
                                                        fontSize: '0.75rem', fontWeight: 600
                                                    }}
                                                >
                                                    Verify
                                                </button>
                                                {lastFailureFeedback && lastFailureFeedback.tier === 'PREMIUM' && (
                                                    <button
                                                        onClick={() => runTestGeneration('PREMIUM', true)}
                                                        disabled={isGeneratingTest}
                                                        style={{
                                                            background: '#2e1a1a', color: '#ff6b35', border: '1px solid #ff6b35',
                                                            padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                                                            fontSize: '0.75rem', fontWeight: 600,
                                                            display: 'flex', alignItems: 'center', gap: '4px'
                                                        }}
                                                        title="Try a different approach based on feedback"
                                                    >
                                                        <RotateCcw size={12} /> Redo
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Comparison Result (Shared) */}
                                        <div style={{ 
                                            background: '#141414', borderRadius: '16px', border: '1px solid #222', pading: '0',
                                            display: 'flex', flexDirection: 'column', height: '100%'
                                        }}>
                                            {comparisonResult ? (
                                                <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                                                        <div style={{ 
                                                            width: '64px', height: '64px', borderRadius: '50%', 
                                                            background: comparisonResult.visualMatchScore > 80 ? 'rgba(40, 167, 69, 0.1)' : comparisonResult.visualMatchScore > 50 ? 'rgba(255, 193, 7, 0.1)' : 'rgba(220, 53, 69, 0.1)',
                                                            border: `2px solid ${comparisonResult.visualMatchScore > 80 ? '#28a745' : comparisonResult.visualMatchScore > 50 ? '#ffc107' : '#dc3545'}`,
                                                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                                                            fontSize: '1.4rem', fontWeight: '800', 
                                                            color: comparisonResult.visualMatchScore > 80 ? '#28a745' : comparisonResult.visualMatchScore > 50 ? '#ffc107' : '#dc3545'
                                                        }}>
                                                            {comparisonResult.visualMatchScore}
                                                        </div>
                                                        <div>
                                                            <div style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>Match Confidence</div>
                                                            <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '4px' }}>Based on Structural Engineering standards</div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div style={{ padding: '16px', background: '#0a0a0a', borderRadius: '8px', flex: 1, overflowY: 'auto', maxHeight: '200px' }}>
                                                        <p style={{ margin: 0, color: '#ccc', lineHeight: 1.6, fontSize: '0.85rem' }}>{comparisonResult.analysis}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#444', padding: '24px', textAlign: 'center' }}>
                                                    Select a model to verify its DNA match score.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                    {/* MANUAL VERIFICATION CONTROLS */}
                                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px', borderTop: '1px solid #222', paddingTop: '16px' }}>
                                        <button 
                                            onClick={() => runTestGeneration('FREE')}
                                            disabled={isGeneratingTest}
                                            style={{
                                                flex: 1, padding: '10px', background: '#222', border: '1px solid #444',
                                                borderRadius: '8px', color: '#ccc', fontWeight: 600, cursor: 'pointer',
                                                fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                            }}
                                        >
                                            <Play size={14} /> Test Model 1 (Flash Image)
                                        </button>
                                        
                                        <button 
                                            onClick={() => runTestGeneration('PREMIUM')}
                                            disabled={isGeneratingTest}
                                            style={{
                                                flex: 1, padding: '10px', background: '#331100', border: '1px solid #ff4d00',
                                                borderRadius: '8px', color: '#ff4d00', fontWeight: 600, cursor: 'pointer',
                                                fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                            }}
                                        >
                                            <Play size={14} /> Test Model 2 (Imagen 4.0)
                                        </button>
                                    </div>

                                    {/* Action Footer */}
                                <div style={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
                                    <button 
                                        onClick={() => runExtraction(true)} // STRICT MODE
                                        disabled={isAnalyzing}
                                        style={{
                                            flex: 1, padding: '12px', background: 'rgba(255, 0, 0, 0.1)', border: '1px solid #aa0000',
                                            borderRadius: '8px', color: '#ff4444', fontWeight: 600, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 0, 0, 0.2)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 0, 0, 0.1)'}
                                    >
                                        <Microscope size={16} />
                                        Re-Extract (Strict Mode)
                                    </button>

                                    <button 
                                        onClick={handleSaveStyle}
                                        style={{
                                            flex: 1, padding: '12px', background: '#222', border: '1px solid #333',
                                            borderRadius: '8px', color: 'white', fontWeight: 600, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                        }}
                                    >
                                        <Save size={16} />
                                        Save to Library
                                    </button>
                                    
                                    <button 
                                        onClick={runTestGeneration}
                                        disabled={isGeneratingTest}
                                        style={{
                                            flex: 1, padding: '12px', background: '#ff4d00', border: 'none',
                                            borderRadius: '8px', color: 'white', fontWeight: 600, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                        }}
                                    >
                                        <FlaskConical size={16} />
                                        {isGeneratingTest ? 'Fabricating...' : 'Generate Test Subject'}
                                    </button>
                                </div>
                             </div>
                        </div>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#333' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                                <Dna size={32} opacity={0.2} />
                            </div>
                            <h2 style={{ fontSize: '1.2rem', color: '#555', fontWeight: 500 }}>Laboratory Empty</h2>
                            <p style={{ color: '#444' }}>Upload a reference frame to begin sequence extraction.</p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

const SectionLabel = ({ icon: Icon, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#888', marginBottom: '4px' }}>
        <Icon size={14} />
        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</span>
    </div>
);

export default StyleDNALaboratory;
