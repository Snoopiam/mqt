import React from 'react';

const Layout = ({ children }) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            backgroundColor: 'var(--bg-primary)'
        }}>
            <header style={{
                padding: '0 2rem',
                height: '80px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--bg-secondary)',
                backdropFilter: 'blur(10px)',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Logo Mark */}
                    <div style={{
                        width: '40px', height: '40px',
                        background: 'linear-gradient(135deg, var(--brand-orange), #ff8800)',
                        borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(255, 77, 0, 0.3)'
                    }}>
                        <span style={{ fontWeight: '900', color: 'black', fontSize: '1.2rem', letterSpacing: '-1px' }}>M</span>
                    </div>

                    {/* Text Branding */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <h1 style={{
                            margin: 0,
                            fontSize: '1.5rem',
                            fontWeight: 800,
                            letterSpacing: '-0.02em',
                            lineHeight: 1
                        }}>MQT</h1>
                        <span style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.15em',
                            fontWeight: 500,
                            marginTop: '4px'
                        }}>
                            The AI Maquettiste
                        </span>
                    </div>
                </div>

                <div>
                    {/* Placeholder for menu */}
                </div>
            </header>

            <main style={{
                flex: 1,
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {children}
            </main>
        </div>
    );
};

export default Layout;
