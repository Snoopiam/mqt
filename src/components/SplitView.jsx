
import React, { useState, useRef, useEffect } from 'react';
import { motion as AnimatedElement, useSpring, useTransform, useDragControls } from 'framer-motion';
import { Minus as ZoomOutButton, Plus as ZoomInButton, Move as DragSliderHandle, RotateCcw as ResetViewButton } from 'lucide-react';

const SplitView = ({ beforeImage, afterImage }) => {
    const containerRef = useRef(null);
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isResizing, setIsResizing] = useState(false);

    // Zoom/Pan State
    const [scale, setScale] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const isDraggingPan = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });

    // Spring Physics for Slider
    // We map the slider 0-100 to a motion value
    const x = useSpring(50, { stiffness: 300, damping: 30 }); // Elastic feel

    const handleMouseMove = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();

        // Handle Slider Drag
        if (isResizing) {
            let newPos = ((e.clientX - rect.left) / rect.width) * 100;
            newPos = Math.max(0, Math.min(100, newPos));
            setSliderPosition(newPos);
            x.set(newPos); // Update spring
        }

        // Handle Pan Drag
        if (isDraggingPan.current) {
            const dx = e.clientX - lastMousePos.current.x;
            const dy = e.clientY - lastMousePos.current.y;
            setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            lastMousePos.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleMouseDown = (e) => {
        setIsResizing(true);
    };

    const handleMouseUp = () => {
        setIsResizing(false);
        isDraggingPan.current = false;
    };

    // Pan Handlers
    const startPan = (e) => {
        if (isResizing) return; // Prioritize slider
        isDraggingPan.current = true;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    // Zoom Handlers
    const handleWheel = (e) => {
        if (e.ctrlKey || e.metaKey || e.deltaY) {
            e.preventDefault();
            // User requested 10% steps, avoiding multiplication artifacts by working with integers
            const direction = e.deltaY > 0 ? -1 : 1;
            const currentPercent = Math.round(scale * 10); // e.g. 1.2 -> 12
            const newPercent = Math.max(1, Math.min(50, currentPercent + direction)); // Min 10%, Max 500%
            setScale(newPercent / 10);
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
    }, [isResizing, scale]);


    return (
        <div
            className="glass-panel"
            ref={containerRef}
            onWheel={handleWheel}
            onMouseDown={startPan}
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                cursor: isDraggingPan.current ? 'grabbing' : 'grab',
                userSelect: 'none'
            }}
        >
            {/* Layer 1: Original Image (Full View) */}
            <div style={{
                position: 'absolute', inset: 0,
                overflow: 'hidden',
                pointerEvents: 'none'
            }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                    transformOrigin: 'center',
                    transition: isDraggingPan.current ? 'none' : 'transform 0.1s ease-out',
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
                clipPath: useTransform(x, value => `inset(0 ${100 - value}% 0 0)`) // Container clip
            }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                    transformOrigin: 'center',
                    transition: isDraggingPan.current ? 'none' : 'transform 0.1s ease-out',
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

            {/* Drag Handle (Visuals) */}
            <AnimatedElement.div
                style={{
                    position: 'absolute',
                    top: 0, bottom: 0,
                    left: useTransform(x, value => `${value}%`),
                    width: '4px',
                    background: 'var(--brand-orange)',
                    borderLeft: '1px solid rgba(255,255,255,0.5)', // Contrast boost
                    borderRight: '1px solid rgba(255,255,255,0.5)', // Contrast boost
                    cursor: 'ew-resize',
                    zIndex: 20,
                    boxShadow: '0 0 15px rgba(0,0,0,0.5)' // Stronger shadow
                }}
                onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e); }}
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

            {/* HUD Controls */}
            <div style={{
                position: 'absolute', bottom: '24px', right: '24px',
                display: 'flex', gap: '8px', zIndex: 30
            }}>
                <div style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    background: 'rgba(0, 0, 0, 0.85)', // High contrast dark background
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(4px)'
                }}>
                    <button onClick={() => setScale(s => Math.max(0.1, Math.round((s - 0.1) * 10) / 10))} style={zoomControlButtonStyle}><ZoomOutButton size={16} /></button>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, minWidth: '40px', textAlign: 'center', color: 'white' }}>{Math.round(scale * 100)}%</span>
                    <button onClick={() => setScale(s => Math.min(5, Math.round((s + 0.1) * 10) / 10))} style={zoomControlButtonStyle}><ZoomInButton size={16} /></button>
                    <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.3)' }} />
                    <button onClick={() => { setScale(1); setPan({ x: 0, y: 0 }); }} style={zoomControlButtonStyle} title="Fit to Screen"><ResetViewButton size={16} /></button>
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
    padding: '6px', // Larger hit area
    borderRadius: '4px',
    transition: 'background 0.2s',
    ':hover': { background: 'rgba(255,255,255,0.1)' } // Note: Inline styles don't support pseudo-classes easily in React basic style objects, but we'll keep it simple for now or use a class if needed. For now, just clearer base style.
};

export default SplitView;
