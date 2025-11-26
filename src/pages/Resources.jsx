import React from 'react';
import { motion } from 'framer-motion';

const Resources = () => {
    return (
        <div style={{
            paddingTop: '100px',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: '#f8f9fa'
        }}>
            <div style={{
                background: 'rgba(5, 5, 16, 0.85)',
                backdropFilter: 'blur(10px)',
                padding: '3rem',
                borderRadius: '20px',
                border: '1px solid #00f0ff',
                boxShadow: '0 0 30px rgba(0, 240, 255, 0.3)',
                maxWidth: '800px',
                width: '90%',
                textAlign: 'center'
            }}>
                <h1 style={{
                    fontSize: '3rem',
                    marginBottom: '2rem',
                    background: 'linear-gradient(90deg, #00f0ff, #fff)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Resources
                </h1>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Calendar Link */}
                    <motion.a
                        href="https://calendar.google.com/calendar/u/1?cid=aWNlZ2xvYmFscHJvZ3JhbUBnbWFpbC5jb20"
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0, 86, 179, 0.15)' }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            display: 'block',
                            padding: '1.5rem',
                            background: '#fff',
                            border: '1px solid #e0e0e0',
                            borderRadius: '12px',
                            color: '#0056b3',
                            textDecoration: 'none',
                            fontSize: '1.1rem',
                            fontWeight: '500',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}
                    >
                        ICEP Shared Calendar
                    </motion.a>

                    {/* Background Download */}
                    <motion.a
                        href="/icep-ntu/images/background.png"
                        download
                        whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0, 86, 179, 0.15)' }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            display: 'block',
                            padding: '1.5rem',
                            background: '#fff',
                            border: '1px solid #e0e0e0',
                            borderRadius: '12px',
                            color: '#0056b3',
                            textDecoration: 'none',
                            fontSize: '1.1rem',
                            fontWeight: '500',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}
                    >
                        Download Meeting Background
                    </motion.a>

                </div>
            </div>
        </div>
    );
};

export default Resources;
