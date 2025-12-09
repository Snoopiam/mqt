import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

const Hero = ({ onStart }) => {
    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            backgroundColor: 'var(--bg-primary)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Ambience */}
            <div style={{
                position: 'absolute',
                top: '-20%', left: '-10%',
                width: '50%', height: '50%',
                background: 'radial-gradient(circle, rgba(255,77,0,0.15) 0%, rgba(0,0,0,0) 70%)',
                filter: 'blur(60px)',
                zIndex: 0
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-20%', right: '-10%',
                width: '60%', height: '60%',
                background: 'radial-gradient(circle, rgba(0,122,255,0.1) 0%, rgba(0,0,0,0) 70%)',
                filter: 'blur(60px)',
                zIndex: 0
            }} />

            {/* Content */}
            <div style={{ zIndex: 1, textAlign: 'center', maxWidth: '800px', padding: '0 2rem' }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    marginBottom: '1.5rem',
                    padding: '8px 16px',
                    borderRadius: '24px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <Sparkles size={16} color="var(--brand-orange)" />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                        AI-POWERED ARCHITECTURE VISUALIZATION
                    </span>
                </div>

                <h1 style={{
                    fontSize: 'clamp(4rem, 8vw, 8rem)',
                    fontWeight: '900',
                    lineHeight: 0.9,
                    letterSpacing: '-0.04em',
                    margin: '0 0 1rem 0',
                    background: 'linear-gradient(to bottom right, #ffffff, #888888)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    MQT
                </h1>

                <p style={{
                    fontSize: 'clamp(1.2rem, 2vw, 1.5rem)',
                    color: 'var(--text-secondary)',
                    margin: '0 0 3rem 0',
                    fontWeight: 300,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase'
                }}>
                    The AI Maquettiste
                </p>

                <p style={{
                    fontSize: '1.1rem',
                    color: 'var(--text-muted)',
                    maxWidth: '500px',
                    margin: '0 auto 4rem auto',
                    lineHeight: 1.6
                }}>
                    Transform standard 2D floor plans into professional, artistically styled architectural presentations in seconds.
                </p>

                <button
                    onClick={onStart}
                    style={{
                        padding: '1.2rem 3rem',
                        backgroundColor: 'var(--brand-orange)',
                        color: 'black',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'inline-flex', alignItems: 'center', gap: '12px',
                        boxShadow: '0 0 30px rgba(255, 77, 0, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 0 50px rgba(255, 77, 0, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 77, 0, 0.3)';
                    }}
                >
                    Start Creating
                    <ArrowRight size={20} />
                </button>
            </div>

            {/* Footer Branding */}
            <div style={{ position: 'absolute', bottom: '2rem', opacity: 0.3 }}>
                <p style={{ fontSize: '0.75rem', letterSpacing: '0.2em' }}>SNOOPLABS • 2025</p>
            </div>
        </div>
    );
};

export default Hero;
