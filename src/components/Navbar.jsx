import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../styles/index.css';

const Navbar = () => {
    const location = useLocation();

    const links = [
        { path: '/', label: 'About' },
        { path: '/student-zone', label: 'Student Zone' },
        { path: '/resources', label: 'Resources' },
    ];

    return (
        <nav style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            padding: '1rem 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 1000,
            background: 'rgba(5, 5, 16, 0.8)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(0, 240, 255, 0.1)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img src="/images/logo.png" alt="ICEP Logo" style={{ height: '40px' }} />
                <span style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    background: 'linear-gradient(90deg, #00f0ff, #7000ff)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    ICEP - NTU
                </span>
            </div>

            <div style={{ display: 'flex', gap: '2rem' }}>
                {links.map((link) => (
                    <Link
                        key={link.path}
                        to={link.path}
                        style={{
                            position: 'relative',
                            color: location.pathname === link.path ? '#00f0ff' : '#e0e0e0',
                            textDecoration: 'none',
                            fontSize: '1rem',
                            fontWeight: 500,
                        }}
                    >
                        {link.label}
                        {location.pathname === link.path && (
                            <motion.div
                                layoutId="underline"
                                style={{
                                    position: 'absolute',
                                    bottom: '-4px',
                                    left: 0,
                                    right: 0,
                                    height: '2px',
                                    background: '#00f0ff',
                                    boxShadow: '0 0 10px #00f0ff'
                                }}
                            />
                        )}
                    </Link>
                ))}
            </div>
        </nav>
    );
};

export default Navbar;
