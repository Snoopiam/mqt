import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Layers, Zap, ArrowLeft, Loader2, Sparkles, Box, 
    Droplets, ChevronDown, Eye, Settings, Type, Palette, 
    LayoutTemplate, Grid, Fingerprint, Barcode
} from 'lucide-react';

import styleData from '../data/style_prompts.json';

// --- Configuration & Constants ---
const THEMES = {
    fonts: {
        sans: { name: 'Modern Sans', value: '"Outfit", system-ui, sans-serif', label: 'Outfit (Clean)' },
        serif: { name: 'Editorial Serif', value: '"Cormorant Garamond", serif', label: 'Cormorant (Elegant)' },
        mono: { name: 'Tech Mono', value: '"JetBrains Mono", monospace', label: 'JetBrains (Tech)' },
        custom: { name: 'Adobe Custom', value: 'inherit', label: 'Custom Adobe Setup' }
    },
    colors: {
        orange: { name: 'Brand Orange', primary: '#ff4d00', secondary: '#ff8800' },
        blue: { name: 'Cyber Blue', primary: '#007aff', secondary: '#00ffff' },
        gold: { name: 'Luxury Gold', primary: '#d4af37', secondary: '#f1d06e' },
        purple: { name: 'Creative Purple', primary: '#9d00ff', secondary: '#d580ff' }
    }
};

const CARD_VARIANTS = [
    { id: 'neon', name: 'Neon Glass V2', icon: Sparkles },
    { id: 'minimal', name: 'Minimal Modern', icon: Box },
    { id: '3d', name: 'Interactive 3D', icon: Layers },
    { id: 'accordion', name: 'Accordion Utility', icon: ChevronDown },
    { id: 'blur', name: 'Blur Reveal', icon: Eye }
];

// --- Main Component ---
const StyleCardPlayground = ({ onBack }) => {
    // Global State
    const [activeDesign] = useState('neon'); // Locked to Neon Glass V2
    const [globalFont, setGlobalFont] = useState('sans');
    const [customFontFamily, setCustomFontFamily] = useState('active-adobe-font-name');
    const [globalColor, setGlobalColor] = useState('orange');
    
    // Navigation State
    const [selectedCategory, setSelectedCategory] = useState(null); // null = Home, 'Signature' | 'Standard'
    
    // Interaction State
    const [activeCardId, setActiveCardId] = useState(null);
    const [loadingCardId, setLoadingCardId] = useState(null);

    // Derived Data
    const stylesList = useMemo(() => Object.entries(styleData).map(([key, data]) => ({ id: key, ...data })), []);
    const filteredStyles = useMemo(() => {
        if (!selectedCategory) return [];
        if (selectedCategory === 'Signature') return stylesList.filter(s => s.category === 'Signature');
        return stylesList.filter(s => s.category !== 'Signature');
    }, [selectedCategory, stylesList]);

    // Theme Context
    const activeTheme = {
        font: globalFont === 'custom' ? customFontFamily : THEMES.fonts[globalFont].value,
        color: THEMES.colors[globalColor],
        design: activeDesign
    };

    const handleCardClick = (id) => {
        if (activeCardId === id) {
            setActiveCardId(null);
            return;
        }
        setActiveCardId(id);
        setLoadingCardId(id);
        setTimeout(() => setLoadingCardId(null), 1500);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: '#050505', display: 'flex',
            color: 'white', fontFamily: activeTheme.font,
            overflow: 'hidden'
        }}>
            {/* Inject Google Fonts */}
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=JetBrains+Mono:wght@400;700&family=Outfit:wght@300;400;600;800&display=swap');
                `}
            </style>
            
            {/* Inject Adobe Fonts (User ID: wjz4rzl) */}
            <link rel="stylesheet" href="https://use.typekit.net/wjz4rzl.css" />

            {/* --- Left Panel: Global Controls (The "Kitchen") --- */}
            <div style={{
                width: '320px', background: '#0a0a0a', borderRight: '1px solid #222',
                display: 'flex', flexDirection: 'column', padding: '24px', gap: '32px',
                overflowY: 'auto'
            }}>
                {/* Header */}
                <div>
                    <button 
                        onClick={onBack} 
                        style={{ 
                            background: 'none', border: 'none', color: '#666', 
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                            marginBottom: '20px', padding: 0, fontFamily: 'inherit'
                        }}>
                        <ArrowLeft size={16} /> Back to App
                    </button>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Design System<br/>Playground</h1>
                    <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '0.9rem', lineHeight: '1.4' }}>
                        Premium refinement testbench. <br/>
                        <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Neon Glass V2 • Category Mode</span>
                    </p>
                </div>

                {/* Control Group: Typography */}
                <ControlGroup title="Global Typography" icon={Type}>
                     <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {Object.entries(THEMES.fonts).map(([key, font]) => (
                            <button
                                key={key}
                                onClick={() => setGlobalFont(key)}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '8px',
                                    background: globalFont === key ? '#222' : '#111',
                                    border: globalFont === key ? '1px solid #444' : '1px solid #222',
                                    color: globalFont === key ? 'white' : '#666',
                                    fontFamily: key === 'custom' ? 'inherit' : font.value, 
                                    fontSize: '0.8rem', cursor: 'pointer',
                                    transition: 'all 0.2s', whiteSpace: 'nowrap'
                                }}
                            >
                                {key === 'sans' ? 'Aa' : key === 'serif' ? 'Ag' : key === 'mono' ? '{}' : 'Adobe'}
                            </button>
                        ))}
                     </div>
                     <div style={{ marginTop: '12px', fontSize: '0.75rem', color: '#666', textAlign: 'right' }}>
                         {globalFont === 'custom' ? (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ whiteSpace: 'nowrap' }}>Font Family:</span>
                                <input 
                                    type="text" 
                                    value={customFontFamily}
                                    onChange={(e) => setCustomFontFamily(e.target.value)}
                                    placeholder="e.g. futura-pt"
                                    style={{ 
                                        background: '#111', border: '1px solid #333', color: 'white', 
                                        padding: '4px 8px', borderRadius: '4px', width: '100%', fontSize: '0.8rem'
                                    }}
                                />
                            </div>
                         ) : (
                             THEMES.fonts[globalFont].label
                         )}
                     </div>
                </ControlGroup>

                {/* Control Group: Accent Color */}
                <ControlGroup title="Accent Theme" icon={Palette}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {Object.entries(THEMES.colors).map(([key, col]) => (
                            <button
                                key={key}
                                onClick={() => setGlobalColor(key)}
                                style={{
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    background: col.primary,
                                    border: globalColor === key ? '3px solid white' : 'none',
                                    cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                                    transition: 'all 0.2s'
                                }}
                                title={col.name}
                            />
                        ))}
                    </div>
                </ControlGroup>
            </div>

             {/* --- Right Panel: Simulation Area (The "Sidebar") --- */}
             <div style={{ flex: 1, background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto', paddingTop: '40px' }}>
                <div style={{
                    width: '360px', // Exact sidebar width
                    paddingBottom: '100px'
                }}>
                    <div style={{ 
                        border: '1px dashed #333', borderRadius: '12px', padding: '2px',
                        display: 'flex', flexDirection: 'column', gap: '16px',
                        minHeight: '800px'
                    }}>
                        {/* Simulation Header */}
                        {/* Simulation Header: Removed for Accordion Flow */}
                        <div style={{ padding: '20px 16px', minHeight: '20px' }} />

                        {/* CONTENT AREA: Accordion Stack */}
                        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                            {/* 1. Signature Collection */}
                            <AccordionSection 
                                title="Signature Collection"
                                subtitle={<span>{stylesList.filter(s => s.category === 'Signature').length} <i>Uniques</i></span>}
                                icon={Fingerprint}
                                color={activeTheme.color.primary}
                                isOpen={selectedCategory === 'Signature'}
                                onClick={() => setSelectedCategory(selectedCategory === 'Signature' ? null : 'Signature')}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                                    {stylesList.filter(s => s.category === 'Signature').map(style => (
                                        <NeonCard 
                                            key={style.id} 
                                            data={style} 
                                            theme={activeTheme}
                                            isActive={activeCardId === style.id}
                                            isLoading={loadingCardId === style.id}
                                            onClick={() => handleCardClick(style.id)}
                                            isSignature={true}
                                            icon={Fingerprint} // Passing specific icon
                                        />
                                    ))}
                                </div>
                            </AccordionSection>

                            {/* 2. Standard Collection */}
                             <AccordionSection 
                                title="Standard Collection"
                                subtitle={<span>{stylesList.filter(s => s.category !== 'Signature').length} <i>Generics</i></span>}
                                icon={Barcode}
                                color="#00aaff"
                                isOpen={selectedCategory === 'Standard'}
                                onClick={() => setSelectedCategory(selectedCategory === 'Standard' ? null : 'Standard')}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                                    {stylesList.filter(s => s.category !== 'Signature').map(style => (
                                        <NeonCard 
                                            key={style.id} 
                                            data={style} 
                                            theme={activeTheme}
                                            isActive={activeCardId === style.id}
                                            isLoading={loadingCardId === style.id}
                                            onClick={() => handleCardClick(style.id)}
                                            isSignature={false}
                                            icon={Barcode}
                                            customColor="#00aaff" // Explicitly pass Blue
                                        />
                                    ))}
                                </div>
                            </AccordionSection>
                        </div>
                    </div>
                </div>
             </div>
        </div>
    );
};

// --- ACCORDION SECTION WRAPPER ---
const AccordionSection = ({ title, subtitle, icon, color, isOpen, onClick, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
        <NeonHeroCard 
            title={title} 
            subtitle={subtitle} // Ensure subtitle with italics is passed correctly
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
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} // SMOOTHED: Longer duration, gentler ease
                    style={{ overflow: 'hidden', margin: '0 -4px', padding: '0 4px' }} // Compensate for padding to prevent clip
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

// --- NEW HERO CARD COMPONENT ---
const NeonHeroCard = ({ title, subtitle, icon: Icon, onClick, color, isCompact }) => (
    <motion.div
        onClick={onClick}
        whileHover={{ scale: 1.02, borderColor: color }}
        animate={{ 
            height: isCompact ? '100px' : '140px', // Shrink slightly when open
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
        
        {/* Glow */}
        <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: `radial-gradient(circle, ${color}10, transparent 70%)`, pointerEvents: 'none' }} />
        
        {/* Active Indicator (Chevron?) optional */}
    </motion.div>
);

// --- Helper Components ---

const ControlGroup = ({ title, icon: Icon, children }) => (
    <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#ccc' }}>
            <Icon size={14} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</span>
        </div>
        {children}
    </div>
);

const CollectionHeader = ({ title, count, color }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', padding: '0 4px' }}>
        <span style={{ color: color, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</span>
        <span style={{ background: '#222', color: '#888', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>{count}</span>
    </div>
);

// --- THE UNIVERSAL CARD SWITCHER ---
const UniversalCard = (props) => {
    const { theme } = props;
    switch (theme.design) {
        case 'minimal': return <MinimalCard {...props} />;
        case '3d': return <Interactive3DCard {...props} />;
        case 'accordion': return <AccordionCard {...props} />;
        case 'blur': return <BlurCard {...props} />;
        default: return <NeonCard {...props} />;
    }
};

// --- DESIGN IMPLEMENTATIONS (REFINED) ---

// 1. Neon Card (Premium Polish)
// 1. Neon Card (Premium Polish)
const NeonCard = ({ data, theme, isActive, isLoading, onClick, isSignature, icon: Icon, customColor }) => {
    const [isHovered, setIsHovered] = useState(false);
    // Use customColor if provided, otherwise fallback to theme primary
    const activeColor = customColor || theme.color.primary;

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
            transition={{ duration: 0.4, ease: 'easeOut' }} // SMOOTHED
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
                        {/* Dynamic Icon */}
                        {Icon && <Icon size={14} color={isActive ? activeColor : '#666'} />}
                        <h3 style={{ 
                            margin: 0, fontSize: '0.95rem', fontWeight: 700, 
                            color: isActive ? 'white' : 'rgba(255,255,255,0.9)',
                            letterSpacing: '-0.3px', transition: 'color 0.2s'
                        }}>
                            {data.title}
                        </h3>
                    </div>
                    {isActive ? (
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: activeColor, boxShadow: `0 0 10px ${activeColor}` }} />
                    ) : (
                        // Standard Dot or Nothing (Removing Old Sparkles)
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#333' }} />
                    )}
                </div>

                <AnimatePresence>
                    {(isHovered || isActive) && (
                        <motion.div
                            initial={{ height: 0, opacity: 0, marginTop: 0 }}
                            animate={{ height: 'auto', opacity: 1, marginTop: 8 }}
                            exit={{ height: 0, opacity: 0, marginTop: 0 }}
                            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }} // Quint ease
                            style={{ fontSize: '0.75rem', color: '#aaa', lineHeight: '1.4', overflow: 'hidden' }}
                        >
                             {data.hex_palette?.length > 0 && (
                                <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', opacity: 0.8 }}>
                                    {data.hex_palette.slice(0, 5).map((c, i) => (
                                        <div key={i} style={{ flex: 1, height: '3px', background: c, borderRadius: '2px' }} />
                                    ))}
                                </div>
                            )}
                            {data.description}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            {/* Elegant Glow */}
            <div style={{ 
                position: 'absolute', inset: 0, 
                background: `radial-gradient(circle at top right, ${theme.color.primary}15, transparent 70%)`,
                opacity: isHovered || isActive ? 1 : 0, transition: 'opacity 0.5s'
            }} />
            
            {/* Active Border Gradient line */}
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

// 2. Minimal Card (Redesigned: "Swiss Print")
const MinimalCard = ({ data, theme, isActive, isLoading, onClick, isSignature }) => {
    return (
        <motion.div
            onClick={onClick}
            whileHover={{ x: 4 }}
            animate={{ 
                background: isActive ? '#f0f0f0' : 'transparent', // Light mode active for contrast
                color: isActive ? 'black' : 'white'
            }}
            transition={{ duration: 0.2 }}
            style={{
                borderRadius: '0px', // Strict square
                borderBottom: '1px solid #333', // Only dividers
                cursor: 'pointer', overflow: 'hidden', position: 'relative'
            }}
        >
            <div style={{ padding: '16px 8px', display: 'flex', alignItems: 'baseline', gap: '16px' }}>
                <div style={{ 
                    fontSize: '0.7rem', color: isActive ? '#000' : '#444', 
                    fontFamily: '"JetBrains Mono", monospace', width: '20px'
                }}>
                    {isSignature ? '01' : '02'}
                </div>
                <div style={{ flex: 1 }}>
                     <h3 style={{ 
                        margin: 0, fontSize: '1.1rem', fontWeight: 600, 
                        textTransform: 'none', letterSpacing: '-0.5px'
                    }}>{data.title}</h3>
                     {isActive && (
                        <motion.div 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ 
                                fontSize: '0.8rem', marginTop: '8px', fontWeight: 400, 
                                lineHeight: '1.4', maxWidth: '90%'
                            }}
                        >
                            {data.description}
                        </motion.div>
                     )}
                </div>
                <div style={{ // Swiss dot
                    width: '8px', height: '8px', borderRadius: '50%', 
                    background: isActive ? theme.color.primary : '#222' 
                }} />
            </div>
             {isLoading && <LoadingBar color="black" />}
        </motion.div>
    );
};

// 3. Interactive 3D (Redesigned: Premium Physical Slab)
const Interactive3DCard = ({ data, theme, isActive, isLoading, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
        <motion.div
            onClick={onClick}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            initial="idle"
            whileHover="hover"
            animate={isActive ? "active" : "idle"}
            style={{ 
                perspective: 1000, cursor: 'pointer', position: 'relative', zIndex: isActive ? 10 : 1,
                marginBottom: '4px' // Spacing for 3D depth
            }}
        >
            <motion.div
                variants={{
                    idle: { y: 0, scale: 1, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.5), 0 2px 4px -1px rgba(0,0,0,0.3)' },
                    hover: { y: -2, scale: 1.01, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.6), 0 4px 6px -2px rgba(0,0,0,0.4)' },
                    active: { y: 1, scale: 0.99, boxShadow: '0 0 0 1px ' + theme.color.primary + ', 0 2px 4px rgba(0,0,0,0.6)' }
                }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{
                    background: '#141414',
                    borderRadius: '8px',
                    border: '1px solid #2a2a2a',
                    overflow: 'hidden',
                    position: 'relative'
                    // removed height constraint to allow auto-grow like Neon
                }}
            >
                {/* Sheen Effect */}
                <motion.div
                    variants={{
                        idle: { opacity: 0, x: '-100%' },
                        hover: { opacity: 0.1, x: '100%', transition: { duration: 1.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1 } },
                        active: { opacity: 0.05, x: '0%' }
                    }}
                    style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(90deg, transparent, white, transparent)',
                        pointerEvents: 'none', zIndex: 3, transform: 'skewX(-20deg)'
                    }}
                />

                <div style={{ padding: '12px 14px', position: 'relative', zIndex: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <h3 style={{ 
                            margin: 0, fontSize: '0.9rem', fontWeight: 800, 
                            color: isActive ? 'white' : '#dedede', 
                            letterSpacing: '0.5px', textTransform: 'uppercase',
                            textShadow: isActive ? '0 0 10px rgba(255,255,255,0.3)' : 'none'
                        }}>{data.title}</h3>
                        
                        {/* Status Indicator */}
                        <div style={{ 
                            width: '4px', height: '4px', borderRadius: '50%',
                            background: isActive ? theme.color.primary : (isHovered ? '#666' : '#333'),
                            boxShadow: isActive ? `0 0 8px ${theme.color.primary}` : 'none',
                            transition: 'all 0.3s'
                        }} />
                    </div>

                    <AnimatePresence>
                        {(isHovered || isActive) && (
                            <motion.div
                                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                animate={{ height: 'auto', opacity: 1, marginTop: 8 }}
                                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                transition={{ duration: 0.3, ease: 'circOut' }}
                                style={{ overflow: 'hidden' }}
                            >
                                <div style={{ 
                                    fontSize: '0.7rem', color: '#888', lineHeight: '1.4', 
                                    fontWeight: 500, fontFamily: theme.design === '3d' ? '"JetBrains Mono", monospace' : 'inherit' 
                                }}>
                                    {data.description}
                                </div>
                                {data.lighting_engine && (
                                    <div style={{ 
                                        marginTop: '6px', fontSize: '0.65rem', color: '#555', 
                                        textTransform: 'uppercase', letterSpacing: '1px',
                                        display: 'flex', alignItems: 'center', gap: '6px'
                                    }}>
                                        <Layers size={10} /> {data.lighting_engine}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Bottom Edge Accent (Physicality) */}
                <div style={{ 
                    height: '2px', width: '100%', 
                    background: isActive ? theme.color.primary : '#222',
                    opacity: isActive ? 1 : 0.5,
                    transition: 'background 0.3s'
                }} />

            </motion.div>
            {isLoading && <LoadingBar color={theme.color.primary} />}
        </motion.div>
    );
};

// 4. Accordion Utility (Redesigned: "The Terminal")
const AccordionCard = ({ data, theme, isActive, isLoading, onClick }) => {
    return (
        <motion.div
            onClick={onClick}
            animate={{ 
                height: isActive ? 'auto' : '44px',
                background: isActive ? '#0d0d0d' : '#000',
                borderColor: isActive ? theme.color.primary : '#222'
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{
                border: '1px solid #222', 
                borderLeft: isActive ? `4px solid ${theme.color.primary}` : '1px solid #222',
                fontFamily: '"JetBrains Mono", monospace', // FORCE MONO
                overflow: 'hidden', cursor: 'pointer', position: 'relative',
                marginBottom: '-1px' // Collapse borders
            }}
        >
            <div style={{ 
                height: '44px', display: 'flex', alignItems: 'center', padding: '0 12px', 
                justifyContent: 'space-between',
                background: isActive ? 'rgba(255,255,255,0.03)' : 'transparent'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#555' }}>[{data.category ? data.category.substring(0,3).toUpperCase() : 'SYS'}]</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isActive ? theme.color.primary : '#ccc' }}>
                        {data.title.toLowerCase()}
                    </span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#444' }}>{isActive ? '▼' : '▶'}</div>
            </div>
            
            <div style={{ padding: '12px', borderTop: '1px dashed #222' }}>
                <div style={{ fontSize: '0.75rem', color: '#888', lineHeight: '1.6', borderLeft: '1px solid #333', paddingLeft: '8px' }}>
                    // {data.description}
                </div>
            </div>
            {isLoading && <LoadingBar color={theme.color.primary} />}
        </motion.div>
    );
};

// 5. Blur Reveal (Redesigned: "The Canvas")
const BlurCard = ({ data, theme, isActive, isLoading, onClick }) => {
    const bg = data.hex_palette?.[0] || '#333';
    
    return (
        <motion.div
            onClick={onClick}
            initial="idle"
            whileHover="active"
            animate={isActive ? "active" : "idle"}
            style={{
                height: isActive ? '140px' : '100px', 
                borderRadius: '8px',
                position: 'relative', overflow: 'hidden', cursor: 'pointer',
                marginBottom: '8px'
            }}
        >
            {/* Background: Full Bleed Color */}
            <motion.div
                variants={{
                    idle: { filter: 'blur(12px)', scale: 1.1, opacity: 0.8 },
                    active: { filter: 'blur(0px)', scale: 1, opacity: 1 }
                }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{ 
                    position: 'absolute', inset: 0, 
                    background: `linear-gradient(to bottom right, ${bg}, #000)`,
                }}
            />
            
            <div style={{ position: 'absolute', inset: 0, padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', zIndex: 2 }}>
                <h3 style={{ 
                    margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'white',
                    textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                }}>
                    {data.title}
                </h3>
                
                <motion.div
                    variants={{
                        idle: { height: 0, opacity: 0 },
                        active: { height: 'auto', opacity: 1, marginTop: 8 }
                    }}
                    style={{ overflow: 'hidden' }}
                >
                     <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', lineHeight: '1.4' }}>
                        {data.description}
                     </p>
                </motion.div>
            </div>
            
            {isLoading && <LoadingBar color="white" />}
        </motion.div>
    );
};

// Refined Loading Bar with Fade Off
const LoadingBar = ({ color }) => (
    <motion.div
        initial={{ scaleX: 0, opacity: 1 }}
        animate={{ scaleX: 1, opacity: [1, 1, 0] }} // Fade out at very end
        transition={{ 
            scaleX: { duration: 1.5, ease: "easeInOut" },
            opacity: { duration: 0.3, delay: 1.2 } 
        }}
        style={{ 
            position: 'absolute', bottom: 0, left: 0, right: 0, 
            height: '2px', background: color, transformOrigin: 'left', zIndex: 10,
            boxShadow: `0 0 10px ${color}` // Soft glow
        }}
    />
);

export default StyleCardPlayground;
