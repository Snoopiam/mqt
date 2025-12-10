import React, { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

const Uploader = ({ onUpload }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = e.dataTransfer.files;
        if (files && files[0]) {
            // Validate file type
            if (files[0].type.startsWith('image/')) {
                onUpload(files[0]);
            } else {
                alert('Please upload an image file.');
            }
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const files = e.target.files;
        if (files && files[0]) {
            onUpload(files[0]);
        }
    };

    return (
        <div
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick();
                }
            }}
            role="button"
            tabIndex={0}
            aria-label="Upload image"
            style={{
                width: '100%',
                maxWidth: '600px',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: `2px dashed ${isDragOver ? 'var(--brand-orange)' : 'var(--border-subtle)'}`,
                borderRadius: '16px',
                padding: '5rem 2rem',
                backgroundColor: isDragOver ? 'rgba(255, 77, 0, 0.05)' : 'var(--bg-panel)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isDragOver ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isDragOver ? 'var(--shadow-lg)' : 'none',
                outline: 'none', // We should add focus visible style in CSS or inline
            }}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept="image/*"
            />

            <div style={{
                width: '80px', height: '80px',
                backgroundColor: isDragOver ? 'var(--brand-orange)' : 'rgba(255, 255, 255, 0.05)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '2rem',
                transition: 'all 0.3s ease',
                boxShadow: isDragOver ? '0 10px 20px rgba(255, 77, 0, 0.4)' : 'none'
            }}>
                <UploadCloud size={40} color={isDragOver ? 'white' : 'var(--brand-orange)'} />
            </div>

            <h3 style={{
                margin: '0 0 0.75rem 0',
                fontSize: '1.5rem',
                fontWeight: 600,
                color: 'var(--text-primary)'
            }}>
                Upload Floor Plan
            </h3>

            <p style={{
                margin: 0,
                color: 'var(--text-secondary)',
                fontSize: '1rem',
                marginBottom: '1.5rem'
            }}>
                Drag & drop or click to browse
            </p>

            <div style={{
                display: 'flex',
                gap: '1rem',
                marginTop: '1rem'
            }}>
                <span style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '4px 8px',
                    borderRadius: '4px'
                }}>JPG</span>
                <span style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '4px 8px',
                    borderRadius: '4px'
                }}>PNG</span>
                <span style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '4px 8px',
                    borderRadius: '4px'
                }}>PDF</span>
            </div>
        </div>
    );
};

export default Uploader;
