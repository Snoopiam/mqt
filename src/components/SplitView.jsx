
import React, { useState, useRef, useEffect } from 'react';
import { motion as AnimatedElement, useSpring, useTransform, useDragControls, AnimatePresence } from 'framer-motion';
import { Minus as ZoomOutButton, Plus as ZoomInButton, Move as DragSliderHandle, RotateCcw as ResetViewButton, Scan, Move, Maximize2, Layout } from 'lucide-react';

const SplitView = ({ beforeImage, afterImage, viewMode = 'split', onViewModeChange }) => {
    const containerRef = useRef(null);
    const [comparisonSliderPosition, setComparisonSliderPosition] = useState(50);
    const [isSliderDragging, setIsSliderDragging] = useState(false);

    // Zoom/Pan State
    const [zoomScale, setZoomScale] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const isPanningActive = useRef(false);
    const lastMousePosition = useRef({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false); // For UI feedback

    // Check if zoomed in
    const isZoomed = zoomScale > 1;

    // Spring Physics for Slider
    // We map the slider 0-100 to a motion value
    const sliderSpringValue = useSpring(50, { stiffness: 300, damping: 30 }); // Elastic feel

    const handleMouseMove = (event) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();

        // Handle Slider Drag
        if (isSliderDragging) {
            let newPos = ((event.clientX - rect.left) / rect.width) * 100;
            newPos = Math.max(0, Math.min(100, newPos));
            setComparisonSliderPosition(newPos);
            sliderSpringValue.set(newPos); // Update spring
        }

        // Handle Pan Drag
        if (isPanningActive.current) {
            const dx = event.clientX - lastMousePosition.current.x;
            const dy = event.clientY - lastMousePosition.current.y;
            setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            lastMousePosition.current = { x: event.clientX, y: event.clientY };
        }
    };

    const handleSliderMouseDown = (event) => {
        setIsSliderDragging(true);
    };

    const handleMouseUp = () => {
        setIsSliderDragging(false);
        isPanningActive.current = false;
        setIsPanning(false);
    };

    // Pan Handlers
    const handlePanStart = (event) => {
        if (isSliderDragging) return; // Prioritize slider
        isPanningActive.current = true;
        setIsPanning(true);
        lastMousePosition.current = { x: event.clientX, y: event.clientY };
    };

    // Zoom Handlers
    const handleZoomWheel = (event) => {
        if (event.ctrlKey || event.metaKey || event.deltaY) {
            event.preventDefault();
            // User requested 10% steps, avoiding multiplication artifacts by working with integers
            const direction = event.deltaY > 0 ? -1 : 1;
            const currentPercent = Math.round(zoomScale * 10); // e.g. 1.2 -> 12
            const newPercent = Math.max(1, Math.min(50, currentPercent + direction)); // Min 10%, Max 500%
            setZoomScale(newPercent / 10);
        }
    };

    // Attach/Detach global listeners
    useEffect(() => {
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [isSliderDragging, zoomScale]);


    return (
        <div
            className="glass-panel"
            ref={containerRef}
            onWheel={handleZoomWheel}
            onMouseDown={handlePanStart}
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                cursor: isPanningActive.current ? 'grabbing' : (isZoomed ? 'grab' : 'default'),
                userSelect: 'none',
                border: isZoomed ? '2px solid rgba(255, 77, 0, 0.3)' : '2px solid transparent',
                transition: 'border-color 0.3s ease'
            }}
        >
            {/* Background Grid Reference - Visual Aid for Panning */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    opacity: isZoomed ? 0.15 : 0,
                    transition: 'opacity 0.5s ease-in-out',
                    backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                    zIndex: 1
                }}
            />

            {/* Zoom Level HUD Badge - Top Center */}
            <AnimatePresence>
                {isZoomed && (
                    <AnimatedElement.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: 'absolute',
                            top: '16px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 40,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                            background: isPanning ? 'var(--brand-orange)' : 'rgba(0, 0, 0, 0.85)',
                            color: isPanning ? '#1a1a2e' : 'var(--brand-orange)',
                            transition: 'background 0.2s, color 0.2s'
                        }}
                    >
                        <Scan size={14} />
                        <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                            {Math.round(zoomScale * 100)}%
                        </span>
                        {isPanning && <Move size={12} style={{ marginLeft: '4px', animation: 'pulse 1s infinite' }} />}
                    </AnimatedElement.div>
                )}
            </AnimatePresence>

            {/* Layer 1: Original Image (Full View) */}
            <div style={{
                position: 'absolute', inset: 0,
                overflow: 'hidden',
                pointerEvents: 'none',
                zIndex: 2
            }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
                    transformOrigin: 'center',
                    transition: isPanningActive.current ? 'none' : 'transform 0.1s ease-out',
                    willChange: 'transform',
                    width: '100%', height: '100%'
                }}>
                    <img
                        src={beforeImage}
                        alt="Original"
                        style={{
                            width: '100%', height: '100%',
                            objectFit: 'contain'
                        }}
                    />
                </div>
            </div>

            {/* Layer 2: Generated Image (Clipped by Slider) */}
            <AnimatedElement.div style={{
                position: 'absolute', inset: 0,
                overflow: 'hidden',
                pointerEvents: 'none',
                clipPath: useTransform(sliderSpringValue, value => `inset(0 ${100 - value}% 0 0)`),
                zIndex: 3
            }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
                    transformOrigin: 'center',
                    transition: isPanningActive.current ? 'none' : 'transform 0.1s ease-out',
                    willChange: 'transform',
                    width: '100%', height: '100%'
                }}>
                    <img
                        src={afterImage}
                        alt="Render"
                        style={{
                            width: '100%', height: '100%',
                            objectFit: 'contain'
                        }}
                    />
                </div>
            </AnimatedElement.div>

            {/* MQT Watermark on Generated Side */}
            <AnimatedElement.div
                style={{
                    position: 'absolute',
                    bottom: '80px',
                    right: '140px',
                    zIndex: 15,
                    pointerEvents: 'none',
                    mixBlendMode: 'overlay',
                    clipPath: useTransform(sliderSpringValue, value => `inset(0 ${100 - value}% 0 0)`)
                }}
            >
                <p style={{
                    color: 'rgba(255, 255, 255, 0.35)',
                    fontWeight: 900,
                    fontSize: '16px',
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase',
                    userSelect: 'none',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                    MQT
                </p>
            </AnimatedElement.div>

            {/* Drag Handle (Visuals) */}
            <AnimatedElement.div
                style={{
                    position: 'absolute',
                    top: 0, bottom: 0,
                    left: useTransform(sliderSpringValue, value => `${value}%`),
                    width: '4px',
                    background: 'var(--brand-orange)',
                    borderLeft: '1px solid rgba(255,255,255,0.5)', // Contrast boost
                    borderRight: '1px solid rgba(255,255,255,0.5)', // Contrast boost
                    cursor: 'ew-resize',
                    zIndex: 20,
                    boxShadow: '0 0 15px rgba(0,0,0,0.5)' // Stronger shadow
                }}
                onMouseDown={(event) => { event.stopPropagation(); handleSliderMouseDown(event); }}
            >
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: '36px', height: '36px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    border: '3px solid var(--brand-orange)'
                }}>
                    <DragSliderHandle size={18} color="#FF4D00" />
                </div>
            </AnimatedElement.div>

            {/* Pan Hint - Bottom Left */}
            <AnimatePresence>
                {isZoomed && !isPanning && (
                    <AnimatedElement.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: 'absolute',
                            bottom: '24px',
                            left: '24px',
                            zIndex: 30,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 10px',
                            borderRadius: '20px',
                            background: 'rgba(0, 0, 0, 0.6)',
                            backdropFilter: 'blur(4px)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: '10px',
                            pointerEvents: 'none'
                        }}
                    >
                        <Move size={12} />
                        <span>Drag to pan</span>
                    </AnimatedElement.div>
                )}
            </AnimatePresence>

            {/* Image Labels */}
            <div style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                zIndex: 25,
                pointerEvents: 'none'
            }}>
                <div style={{
                    background: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(8px)',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    Blueprint
                </div>
            </div>

            <AnimatedElement.div
                style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    zIndex: 25,
                    pointerEvents: 'none',
                    clipPath: useTransform(sliderSpringValue, value => value > 5 ? 'none' : 'inset(0 100% 0 0)')
                }}
            >
                <div style={{
                    background: 'var(--brand-orange)',
                    color: '#1a1a2e',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(255, 77, 0, 0.3)'
                }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1a1a2e' }} />
                    Styled 4K
                </div>
            </AnimatedElement.div>

            {/* HUD Controls */}
            <div style={{
                position: 'absolute', bottom: '24px', right: '24px',
                display: 'flex', gap: '8px', zIndex: 30
            }}>
                <div style={{
                    padding: '8px 12px',
                    borderRadius: '12px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    background: 'rgba(0, 0, 0, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(8px)'
                }}>
                    <button onClick={() => setZoomScale(s => Math.max(0.5, Math.round((s - 0.25) * 100) / 100))} style={zoomControlButtonStyle} title="Zoom Out" aria-label="Zoom out"><ZoomOutButton size={16} /></button>
                    <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        minWidth: '45px',
                        textAlign: 'center',
                        color: isZoomed ? 'var(--brand-orange)' : 'white',
                        fontFamily: 'monospace',
                        transition: 'color 0.2s'
                    }}>
                        {Math.round(zoomScale * 100)}%
                    </span>
                    <button onClick={() => setZoomScale(s => Math.min(5, Math.round((s + 0.25) * 100) / 100))} style={zoomControlButtonStyle} title="Zoom In" aria-label="Zoom in"><ZoomInButton size={16} /></button>
                    <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.2)' }} />
                    <button
                        onClick={() => { setZoomScale(1); setPanOffset({ x: 0, y: 0 }); }}
                        style={{
                            ...zoomControlButtonStyle,
                            color: isZoomed ? 'var(--brand-orange)' : 'white'
                        }}
                        title="Reset View"
                        aria-label="Reset view to 100%"
                    >
                        <ResetViewButton size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const zoomControlButtonStyle = {
    background: 'transparent',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
    minWidth: '44px',
    minHeight: '44px',
    borderRadius: '8px',
    transition: 'background 0.2s',
};

export default SplitView;
