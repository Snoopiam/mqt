import React, { useState, useEffect } from 'react';
import { Settings, Zap, Grid, Tag, Droplet } from 'lucide-react';
import styleData from '../data/style_prompts.json';

// Dynamically import all images from the presets folder
const presetImages = import.meta.glob('../assets/presets/*.{jpg,png,jpeg}', { eager: true });

const Controls = ({ currentPreset, onSelect, onGenerate, isGenerating }) => {
    const [presets, setPresets] = useState([]);

    useEffect(() => {
        // Merge the imported images with the forensic JSON data
        const loadedPresets = Object.entries(presetImages).map(([path, module]) => {
            const fileName = path.split('/').pop(); // Get filename with extension to match JSON keys
            const id = fileName.split('.')[0];
            const forensicData = styleData[fileName] || {};

            return {
                id: id,
                name: forensicData.title || id.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                image: module.default,
                ...forensicData
            };
        });
        setPresets(loadedPresets);
    }, []);

    const activePresetData = presets.find(p => p.id === currentPreset);

    return (
        <div style={{
            width: '360px', // Slightly wider for forensic data
            borderLeft: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            boxShadow: '-4px 0 20px rgba(0,0,0,0.2)',
            zIndex: 5,
            height: '100%',
            overflow: 'hidden'
        }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
                <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Visual Forensics</h2>
                <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Select a style to view its DNA
                </p>
            </div>

            {/* Scrollable Area */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0 1.5rem',
                paddingBottom: '2rem'
            }}>
                <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '1rem', marginTop: '1rem' }}>
                    Detected Styles
                </h3>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: '0.75rem'
                }}>
                    {presets.map(preset => (
                        <button
                            key={preset.id}
                            onClick={() => onSelect(preset.id)}
                            style={{
                                display: 'flex', alignItems: 'flex-start', gap: '1rem',
                                padding: '0.75rem',
                                backgroundColor: currentPreset === preset.id ? 'var(--bg-panel)' : 'transparent',
                                border: `1px solid ${currentPreset === preset.id ? 'var(--brand-orange)' : 'var(--border-subtle)'}`,
                                borderRadius: '8px',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                textAlign: 'left',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Thumbnail */}
                            <div style={{
                                width: '60px', height: '60px', borderRadius: '6px',
                                backgroundImage: `url(${preset.image})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                border: '1px solid rgba(255,255,255,0.1)',
                                flexShrink: 0
                            }} />

                            <div style={{ minWidth: 0, flex: 1 }}>
                                <span style={{
                                    display: 'block',
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    marginBottom: '4px',
                                    color: currentPreset === preset.id ? 'var(--brand-orange)' : 'var(--text-primary)'
                                }}>
                                    {preset.name}
                                </span>

                                {/* Forensic Tags */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    <span style={tagStyle}>{preset.lighting_engine}</span>
                                    <span style={tagStyle}>{preset.viewpoint}</span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Active Preset Forensic Analysis Panel */}
                {activePresetData && activePresetData.hex_palette && (
                    <div style={{
                        marginTop: '2rem',
                        padding: '1rem',
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)'
                    }}>
                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Forensic DNA
                        </h4>

                        {/* Hex Palette */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                            {activePresetData.hex_palette.map((hex, i) => (
                                <div key={i} title={hex} style={{
                                    width: '24px', height: '24px', borderRadius: '4px',
                                    backgroundColor: hex,
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    cursor: 'help'
                                }} />
                            ))}
                        </div>

                        {/* Attribute List */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px', fontSize: '0.8rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Materiality:</span>
                            <span style={{ color: 'var(--text-primary)' }}>{activePresetData.materiality}</span>

                            <span style={{ color: 'var(--text-muted)' }}>Lighting:</span>
                            <span style={{ color: 'var(--text-primary)' }}>{activePresetData.lighting_style}</span>
                        </div>
                    </div>
                )}
            </div>

            <div style={{
                padding: '1.5rem',
                borderTop: '1px solid var(--border-subtle)',
                marginTop: 'auto',
                backgroundColor: 'var(--bg-secondary)'
            }}>
                <button
                    onClick={onGenerate}
                    disabled={isGenerating}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        backgroundColor: isGenerating ? 'var(--bg-panel)' : 'var(--brand-orange)',
                        color: isGenerating ? 'var(--text-muted)' : 'black',
                        fontWeight: '800',
                        fontSize: '1rem',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: isGenerating ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        transition: 'all 0.2s'
                    }}
                >
                    <Zap size={20} className={isGenerating ? "spin" : ""} />
                    {isGenerating ? 'Rendering...' : 'Generate Render'}
                </button>
            </div>
        </div>
    )
}

const tagStyle = {
    fontSize: '0.65rem',
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap'
};

export default Controls;
