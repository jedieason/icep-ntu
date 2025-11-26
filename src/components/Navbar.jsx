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
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(0, 86, 179, 0.1)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img src="/icep-ntu/images/logo.png" alt="ICEP Logo" style={{ height: '40px' }} />
                <span style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: '#0056b3'
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
                            color: location.pathname === link.path ? '#0056b3' : '#555',
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
                                    background: '#0056b3',
                                    boxShadow: '0 0 5px rgba(0, 86, 179, 0.3)'
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
