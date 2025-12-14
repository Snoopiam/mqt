
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Tag, Layers, Settings, Fingerprint, Barcode } from 'lucide-react';
import styleData from '../data/style_prompts.json';

const Controls = ({ currentPreset, onSelect, onGenerate, isGenerating, currentStyles, onToggleDev, onPromptChange, currentTier, onTierChange }) => {
    // 1. Data Prep
    const sourceData = currentStyles || styleData;
    const presets = Object.entries(sourceData).map(([key, p]) => ({
        ...p,
        id: key,
        name: p.title || key,
        category: p.category || "Standard Collection" // Default to Standard if missing
    }));

    // 2. Accordion State
    const [selectedCategory, setSelectedCategory] = useState(null);

    // 3. Loading Text Logic
    const [loadingText, setLoadingText] = useState("Neural Processing...");
    React.useEffect(() => {
        if (isGenerating) {
            const messages = ["Parsing Plan...", "Geometry...", "Lighting...", "Materials...", "Polishing..."];
            let i = 0;
            setLoadingText(messages[0]);
            const interval = setInterval(() => {
                i = (i + 1) % messages.length;
                setLoadingText(messages[i]);
            }, 2500);
            return () => clearInterval(interval);
        } else {
            setLoadingText("Neural Processing...");
        }
    }, [isGenerating]);

    // 4. Selection Handler (Toggle Logic)
    const handleCardClick = (id) => {
        if (currentPreset === id) {
            onSelect(null); // Deselect
        } else {
            onSelect(id);
        }
    };

    return (
        <div className="glass-panel" style={{
            width: '360px', height: '100%', display: 'flex', flexDirection: 'column', zIndex: 30, overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{ padding: '24px 24px 16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Layers size={18} color="var(--brand-orange)" />
                        Visual Styles
                    </h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Select a style to generate
                    </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                     <button
                        onClick={onToggleDev}
                        title="Developer Console"
                        style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', padding: '4px' }}
                    >
                        <Settings size={16} />
                    </button>
                    {/* Tier Selector */}
                    <div style={{ 
                        display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '2px' 
                    }}>
                        <button 
                            onClick={() => onTierChange && onTierChange('FREE')}
                            style={{ 
                                background: currentTier === 'FREE' ? '#444' : 'transparent',
                                color: currentTier === 'FREE' ? '#fff' : '#888',
                                border: 'none', borderRadius: '4px', fontSize: '0.65rem', padding: '4px 8px', cursor: 'pointer', fontWeight: 600
                            }}
                        >
                            FAST (Free)
                        </button>
                        <button 
                            onClick={() => onTierChange && onTierChange('PREMIUM')}
                             style={{ 
                                background: currentTier === 'PREMIUM' ? 'var(--brand-orange)' : 'transparent',
                                color: currentTier === 'PREMIUM' ? '#fff' : '#888',
                                border: 'none', borderRadius: '4px', fontSize: '0.65rem', padding: '4px 8px', cursor: 'pointer', fontWeight: 600,
                                boxShadow: currentTier === 'PREMIUM' ? '0 2px 6px rgba(255,75,0,0.3)' : 'none'
                             }}
                        >
                            HD (Pro)
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area: Accordion Stack */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    {/* 1. Signature Collection */}
                    <AccordionSection 
                        title="Signature Collection"
                        subtitle={<span>{presets.filter(s => s.category === 'Signature').length} <i>Uniques</i></span>}
                        icon={Fingerprint}
                        color="var(--brand-orange)"
                        isOpen={selectedCategory === 'Signature'}
                        onClick={() => setSelectedCategory(selectedCategory === 'Signature' ? null : 'Signature')}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                            {presets.filter(s => s.category === 'Signature').map(style => (
                                <StyleCard 
                                    key={style.id} 
                                    data={style} 
                                    isActive={currentPreset === style.id}
                                    isLoading={isGenerating && currentPreset === style.id}
                                    onClick={() => handleCardClick(style.id)}
                                    isSignature={true}
                                    icon={Fingerprint}
                                    customColor="var(--brand-orange)"
                                />
                            ))}
                        </div>
                    </AccordionSection>

                    {/* 2. Standard Collection */}
                    <AccordionSection 
                        title="Standard Collection"
                        subtitle={<span>{presets.filter(s => s.category !== 'Signature').length} <i>Generics</i></span>}
                        icon={Barcode}
                        color="#00aaff"
                        isOpen={selectedCategory === 'Standard'}
                        onClick={() => setSelectedCategory(selectedCategory === 'Standard' ? null : 'Standard')}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                            {presets.filter(s => s.category !== 'Signature').map(style => (
                                <StyleCard 
                                    key={style.id} 
                                    data={style} 
                                    isActive={currentPreset === style.id}
                                    isLoading={isGenerating && currentPreset === style.id}
                                    onClick={() => handleCardClick(style.id)}
                                    isSignature={false}
                                    icon={Barcode}
                                    customColor="#00aaff"
                                />
                            ))}
                        </div>
                    </AccordionSection>

                </div>


            </div>

            {/* Footer: Generate Button */}
            <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                <button
                    onClick={onGenerate}
                    disabled={!currentPreset && !document.querySelector('textarea')?.value}
                    style={{
                        width: '100%', padding: '14px',
                        background: isGenerating ? '#222' : 'var(--brand-orange)',
                        color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600,
                        cursor: isGenerating ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        transition: 'all 0.3s',
                        boxShadow: isGenerating ? 'none' : '0 4px 12px rgba(255, 77, 0, 0.3)'
                    }}
                >
                    {isGenerating ? (
                        <>
                            <div className="spinner" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                            <span>{loadingText}</span>
                            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                        </>
                    ) : (
                        <>
                            <Zap size={18} fill="currentColor" />
                            Generate Render
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

// --- COMPONENTS PORTED FROM PLAYGROUND ---

const AccordionSection = ({ title, subtitle, icon, color, isOpen, onClick, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
        <NeonHeroCard 
            title={title} 
            subtitle={subtitle}
            icon={icon}
            onClick={onClick}
            color={color}
            isCompact={isOpen} 
        />
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} 
                    style={{ overflow: 'hidden', margin: '0 -4px', padding: '0 4px' }}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

const NeonHeroCard = ({ title, subtitle, icon: Icon, onClick, color, isCompact }) => (
    <motion.div
        onClick={onClick}
        whileHover={{ scale: 1.02, borderColor: color }}
        animate={{ 
            height: isCompact ? '100px' : '140px',
            background: isCompact ? 'rgba(20,20,20,0.8)' : 'rgba(20,20,20,0.6)'
        }} 
        style={{
            position: 'relative', overflow: 'hidden', cursor: 'pointer',
            borderRadius: '16px', border: '1px solid #333',
            backdropFilter: 'blur(10px)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            textAlign: 'center'
        }}
    >
        <div style={{ 
            width: isCompact ? '32px' : '48px', height: isCompact ? '32px' : '48px', 
            borderRadius: '50%', background: `${color}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: isCompact ? '8px' : '16px',
            border: `1px solid ${color}40`, boxShadow: `0 0 20px ${color}20`,
            transition: 'all 0.3s'
        }}>
            <Icon size={isCompact ? 16 : 24} color={color} />
        </div>
        <h3 style={{ margin: 0, fontSize: isCompact ? '1rem' : '1.1rem', fontWeight: 700, color: 'white', transition: 'all 0.3s' }}>{title}</h3>
        {!isCompact && <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '4px' }}>{subtitle}</div>}
        <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: `radial-gradient(circle, ${color}10, transparent 70%)`, pointerEvents: 'none' }} />
    </motion.div>
);

const StyleCard = ({ data, isActive, isLoading, onClick, isSignature, icon: Icon, customColor }) => {
    const [isHovered, setIsHovered] = useState(false);
    const activeColor = customColor || '#666';

    return (
        <motion.div
            onClick={onClick}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            whileHover={{ scale: 1.01, y: -2 }}
            animate={{ 
                scale: isActive ? 1.02 : 1,
                borderColor: isActive ? activeColor : (isSignature ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'),
                backgroundColor: isActive ? 'rgba(20,20,20,0.8)' : 'rgba(10,10,10,0.5)'
            }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{
                borderRadius: '16px',
                border: '1px solid transparent',
                overflow: 'hidden', cursor: 'pointer', position: 'relative',
                backdropFilter: 'blur(10px)',
            }}
        >
            <div style={{ padding: '12px 14px', position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {Icon && <Icon size={14} color={isActive ? activeColor : '#666'} />}
                        <h3 style={{ 
                            margin: 0, fontSize: '0.9rem', fontWeight: 700, 
                            color: isActive ? 'white' : 'rgba(255,255,255,0.9)',
                            letterSpacing: '-0.3px', transition: 'color 0.2s'
                        }}>
                            {data.title}
                        </h3>
                    </div>
                    {isActive ? (
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: activeColor, boxShadow: `0 0 10px ${activeColor}` }} />
                    ) : (
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#333' }} />
                    )}
                </div>

                <AnimatePresence>
                    {(isHovered || isActive) && (
                        <motion.div
                            initial={{ height: 0, opacity: 0, marginTop: 0 }}
                            animate={{ height: 'auto', opacity: 1, marginTop: 8 }}
                            exit={{ height: 0, opacity: 0, marginTop: 0 }}
                            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }} 
                            style={{ fontSize: '0.75rem', color: '#aaa', lineHeight: '1.4', overflow: 'hidden' }}
                        >
                            {data.description}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            {/* Active Border Gradient */}
            {isActive && (
                 <motion.div 
                    layoutId="activeBorder"
                    style={{ position: 'absolute', inset: 0, border: `1px solid ${activeColor}`, borderRadius: '16px', opacity: 0.5, pointerEvents: 'none' }}
                 />
            )}

            {isLoading && <LoadingBar color={activeColor} />}
        </motion.div>
    );
};

const LoadingBar = ({ color }) => (
    <motion.div
        initial={{ scaleX: 0, opacity: 1 }}
        animate={{ scaleX: 1, opacity: [1, 1, 0] }}
        transition={{ scaleX: { duration: 1.5, ease: "easeInOut" }, opacity: { duration: 0.3, delay: 1.2 } }}
        style={{ 
            position: 'absolute', bottom: 0, left: 0, right: 0, 
            height: '2px', background: color, transformOrigin: 'left', zIndex: 10,
            boxShadow: `0 0 10px ${color}`
        }}
    />
);

export default Controls;
