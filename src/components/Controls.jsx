
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Tag, Layers } from 'lucide-react';
import styleData from '../data/style_prompts.json';

const Controls = ({ currentPreset, onSelect, onGenerate, isGenerating }) => {
    // Convert JSON object to array for mapping
    const presets = Object.values(styleData).map(p => ({
        ...p,
        name: p.title || p.id
    }));

    const activePresetData = presets.find(p => p.id === currentPreset);

    // Terminology Mapping for Non-Technical Users
    const termMap = {
        'Octane': 'Hyper-Real',
        'V-Ray': 'Cinematic',
        'Cycles': 'Studio',
        'Eevee': 'Standard',
        'Glossy': 'Polished',
        'Matte': 'Soft',
        'Metallic': 'Reflective'
    };

    const getTerm = (val) => {
        if (!val) return 'Unknown';
        // Check if val contains any of the keys
        const key = Object.keys(termMap).find(k => val.includes(k));
        return key ? val.replace(key, termMap[key]) : val;
    };

    // Helper: Dynamic Gradient
    const getGradient = (palette) => {
        if (!palette || palette.length === 0) return 'gray';
        const stops = palette.map((color, i) => `${color} ${i * (100 / palette.length)}%`).join(', ');
        return `linear-gradient(135deg, ${stops})`;
    };

    return (
        <div className="glass-panel" style={{
            width: '360px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 30,
            overflow: 'hidden' // Contain scroll
        }}>
            {/* Header */}
            <div style={{ padding: '24px 24px 16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={18} color="var(--brand-orange)" />
                    Style Forensics
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Select a forensic profile to apply.
                </p>
            </div>

            {/* Scrollable List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {presets.map((preset) => (
                        <PresetCard
                            key={preset.id}
                            preset={preset}
                            isActive={currentPreset === preset.id}
                            onClick={() => onSelect(preset.id)}
                            getGradient={getGradient}
                            getTerm={getTerm}
                        />
                    ))}
                </div>
            </div>

            {/* Footer / Generate Action */}
            <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                <div style={{ padding: '20px' }}>
                    <button
                        onClick={onGenerate}
                        disabled={!currentPreset || isGenerating}
                        style={{
                            width: '100%',
                            padding: '14px',
                            background: isGenerating ? '#333' : 'var(--brand-orange)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: (!currentPreset || isGenerating) ? 'not-allowed' : 'pointer',
                            opacity: (!currentPreset || isGenerating) ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease',
                            boxShadow: isGenerating ? 'none' : '0 4px 12px rgba(255, 77, 0, 0.3)'
                        }}
                    >
                        {isGenerating ? (
                            <>
                                <span className="loader" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }}></span>
                                Neural Processing...
                            </>
                        ) : (
                            <>
                                <Zap size={18} fill="currentColor" />
                                Generate Render
                            </>
                        )}
                    </button>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        </div>
    );
};

// 3D Flip Card Component
const PresetCard = ({ preset, isActive, onClick, getGradient, getTerm }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div
            style={{ position: 'relative', height: '80px', perspective: '1000px', cursor: 'pointer', outline: 'none' }}
            onMouseEnter={() => setIsFlipped(true)}
            onMouseLeave={() => setIsFlipped(false)}
            onFocus={() => setIsFlipped(true)}
            onBlur={() => setIsFlipped(false)}
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Select preset ${preset.name}`}
        >
            <motion.div
                initial={false}
                animate={{ rotateX: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                style={{
                    width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d',
                }}
            >
                {/* FRONT FACE */}
                <div className={`glass-card ${isActive ? 'active' : ''}`} style={{
                    position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden',
                    display: 'flex', alignItems: 'center', padding: '10px', gap: '12px', borderRadius: '8px',
                    borderColor: isActive ? 'var(--brand-orange)' : undefined,
                    background: isActive ? 'rgba(255, 77, 0, 0.1)' : undefined
                }}>
                    <div style={{
                        width: '50px', height: '50px', borderRadius: '6px',
                        background: getGradient(preset.hex_palette),
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }} />
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{preset.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Tag size={10} /> {preset.title.split(' ')[0]} Style
                        </div>
                    </div>
                </div>

                {/* BACK FACE (Forensic Data) */}
                <div style={{
                    position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden',
                    transform: 'rotateX(180deg)',
                    background: '#1a1a1a', borderRadius: '8px', border: '1px solid var(--brand-blue)',
                    padding: '8px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px'
                }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--brand-blue)', fontWeight: 700, letterSpacing: '0.05em' }}>FORENSIC MATCH</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                        <DataTag label="Light" value={getTerm ? getTerm(preset.lighting_engine) : preset.lighting_engine} />
                        <DataTag label="Texture" value={getTerm ? getTerm(preset.materiality) : preset.materiality} />
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const DataTag = ({ label, value }) => (
    <div style={{ fontSize: '0.65rem', background: 'rgba(0, 122, 255, 0.1)', padding: '2px 4px', borderRadius: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        <span style={{ opacity: 0.7 }}>{label}:</span> <span style={{ color: 'white' }}>{value.split(' ')[0]}</span>
    </div>
);

export default Controls;
