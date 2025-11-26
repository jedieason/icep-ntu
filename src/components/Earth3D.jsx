import React, { useRef, useLayoutEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useScroll, ScrollControls, Stars, Scroll } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';

const Earth = () => {
    const earthRef = useRef();
    const scroll = useScroll();

    useFrame((state, delta) => {
        if (!earthRef.current) return;

        // Initial rotation
        earthRef.current.rotation.y += delta * 0.1;

        // Scroll based animation
        // r1 is the scroll offset (0 to 1)
        const r1 = scroll.range(0, 1);

        // Rotate towards Taiwan (approximate logic)
        // Taiwan is ~121E, 23.5N.
        // In Three.js, we need to align this to the camera.
        // Let's say we want to end up with Taiwan facing the camera.
        // We can interpolate rotation.

        // Target rotation to face Taiwan
        const targetRotationY = 4.5; // Tuned value
        const targetRotationX = 0.4; // Tuned value

        if (r1 > 0) {
            earthRef.current.rotation.y = THREE.MathUtils.lerp(earthRef.current.rotation.y, targetRotationY, r1 * 0.1);
            earthRef.current.rotation.x = THREE.MathUtils.lerp(0, targetRotationX, r1);

            // Zoom effect (move camera or scale earth)
            // Moving camera is better.
            state.camera.position.z = THREE.MathUtils.lerp(5, 2.5, r1);
        }
    });

    return (
        <group ref={earthRef}>
            <mesh>
                <sphereGeometry args={[1.5, 64, 64]} />
                <meshStandardMaterial
                    color="#001e4d"
                    emissive="#000a1a"
                    roughness={0.4}
                    metalness={0.6}
                    wireframe={false}
                />
            </mesh>
            {/* Wireframe overlay for tech feel */}
            <mesh>
                <sphereGeometry args={[1.51, 32, 32]} />
                <meshBasicMaterial
                    color="#00f0ff"
                    wireframe={true}
                    transparent={true}
                    opacity={0.1}
                />
            </mesh>
            {/* Atmosphere glow */}
            <mesh scale={[1.1, 1.1, 1.1]}>
                <sphereGeometry args={[1.5, 32, 32]} />
                <meshBasicMaterial
                    color="#00f0ff"
                    transparent={true}
                    opacity={0.05}
                    side={THREE.BackSide}
                />
            </mesh>
        </group>
    );
};

const Scene = () => {
    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1.5} color="#00f0ff" />
            <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <Earth />
        </>
    );
};

const Earth3D = ({ children }) => {
    return (
        <div style={{ width: '100%', height: '100vh' }}>
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                <ScrollControls pages={5} damping={0.2}>
                    <Scene />
                    <Scroll html style={{ width: '100%' }}>
                        {children}
                    </Scroll>
                </ScrollControls>
            </Canvas>
        </div>
    );
};

export default Earth3D;
