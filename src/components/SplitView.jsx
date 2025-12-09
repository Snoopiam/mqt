import React, { useRef, useState, useEffect } from 'react';
import { MoveHorizontal, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

const SplitView = ({ beforeImage, afterImage }) => {
    const [sliderPosition, setSliderPosition] = useState(50);
    const containerRef = useRef(null);

    // Transform State
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const lastPos = useRef({ x: 0, y: 0 });

    // Slider Drag Handlers
    const handleSliderStart = (e) => {
        e.stopPropagation();
        setIsResizing(true);
    };

    const handleSliderMove = (clientX) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        setSliderPosition((x / rect.width) * 100);
    };

    // Pan Handlers
    const handlePanStart = (clientX, clientY) => {
        setIsDragging(true);
        lastPos.current = { x: clientX, y: clientY };
    };

    const handlePanMove = (clientX, clientY) => {
        const dx = clientX - lastPos.current.x;
        const dy = clientY - lastPos.current.y;
        setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        lastPos.current = { x: clientX, y: clientY };
    };

    // Global Event Listeners for Dragging
    useEffect(() => {
        const onMouseMove = (e) => {
            if (isResizing) {
                e.preventDefault();
                handleSliderMove(e.clientX);
            } else if (isDragging) {
                e.preventDefault();
                handlePanMove(e.clientX, e.clientY);
            }
        };

        const onTouchMove = (e) => {
            if (isResizing) {
                handleSliderMove(e.touches[0].clientX);
            } else if (isDragging) {
                handlePanMove(e.touches[0].clientX, e.touches[0].clientY);
            }
        };

        const onUp = () => {
            setIsResizing(false);
            setIsDragging(false);
        };

        if (isResizing || isDragging) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('touchmove', onTouchMove, { passive: false });
            window.addEventListener('mouseup', onUp);
            window.addEventListener('touchend', onUp);
        }

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('mouseup', onUp);
            window.removeEventListener('touchend', onUp);
        };
    }, [isResizing, isDragging]);

    // Zoom Handler
    const handleWheel = (e) => {
        if (e.ctrlKey || e.metaKey || e.deltaY) {
            // Simple zoom logic
            e.preventDefault();
            const zoomSensitivity = 0.001;
            const delta = -e.deltaY * zoomSensitivity;
            const newScale = Math.min(Math.max(0.1, scale + delta), 5);
            setScale(newScale);
        }
    };

    const handleZoomIn = () => setScale(s => Math.min(s * 1.2, 5));
    const handleZoomOut = () => setScale(s => Math.max(s / 1.2, 0.1));
    const handleFit = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }

    // Common Image Style
    const imageStyle = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
        transformOrigin: 'center center',
        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        userSelect: 'none',
        pointerEvents: 'none', // Allow events to pass to container
        imageRendering: 'high-quality' // Optimize for readability
    };

    return (
        <div
            ref={containerRef}
            onWheel={handleWheel}
            onMouseDown={(e) => handlePanStart(e.clientX, e.clientY)}
            onTouchStart={(e) => handlePanStart(e.touches[0].clientX, e.touches[0].clientY)}
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                cursor: isDragging ? 'grabbing' : 'grab',
                backgroundColor: '#050505',
                touchAction: 'none'
            }}
        >
            {/* Render Layer (Background) */}
            <img
                src={afterImage}
                alt="Render"
                style={imageStyle}
                draggable={false}
            />

            {/* Original Layer (Foreground - Clipped) */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0,
                width: `${sliderPosition}%`,
                height: '100%',
                overflow: 'hidden',
                borderRight: '1px solid rgba(255,255,255,0.5)',
                pointerEvents: 'none',
                backgroundColor: '#050505'
            }}>
                <img
                    src={beforeImage}
                    alt="Original"
                    style={{
                        ...imageStyle,
                        // We need to counter the width clipping? No, the container is 100% width of parent, but CLIPPED.
                        // Wait. If the parent div is 50% width, the image inside (100% width) will be squished? 
                        // YES.
                        // FIX: The width of the image inside must be the width of the MAIN container, not this clipped container.
                        width: containerRef.current ? containerRef.current.clientWidth : '100vw',
                        maxWidth: 'none'
                    }}
                    draggable={false}
                />
            </div>

            {/* Slider Handle */}
            <div
                onMouseDown={handleSliderStart}
                onTouchStart={handleSliderStart}
                style={{
                    position: 'absolute',
                    top: 0, bottom: 0,
                    left: `${sliderPosition}%`,
                    width: '40px', // Invisible grab area
                    transform: 'translateX(-50%)',
                    cursor: 'col-resize',
                    zIndex: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
            >
                {/* Visible Line */}
                <div style={{ width: '2px', height: '100%', backgroundColor: 'white', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }} />

                {/* Handle Circle */}
                <div style={{
                    position: 'absolute',
                    width: '40px', height: '40px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'black',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    border: '2px solid var(--bg-primary)'
                }}>
                    <MoveHorizontal size={20} />
                </div>
            </div>

            {/* Zoom Controls */}
            <div style={{
                position: 'absolute',
                bottom: '24px', left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex', gap: '8px',
                background: 'rgba(0,0,0,0.8)',
                padding: '8px', borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                zIndex: 30
            }}>
                <button onClick={handleZoomOut} style={btnStyle} title="Zoom Out"><ZoomOut size={18} /></button>
                <button onClick={handleFit} style={btnStyle} title="Reset"><Maximize size={18} /></button>
                <button onClick={handleZoomIn} style={btnStyle} title="Zoom In"><ZoomIn size={18} /></button>
            </div>

            {/* Labels */}
            <LabelBox text="ORIGINAL" left />
            <LabelBox text="RENDER" right />

        </div>
    );
};

const btnStyle = {
    background: 'transparent',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};

const LabelBox = ({ text, left, right }) => (
    <div style={{
        position: 'absolute',
        top: '20px',
        [left ? 'left' : 'right']: '20px',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        padding: '6px 12px', borderRadius: '6px',
        color: 'white', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.1em',
        border: '1px solid rgba(255,255,255,0.1)',
        pointerEvents: 'none',
        zIndex: 5
    }}>
        {text}
    </div>
);

export default SplitView;
