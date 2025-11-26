import React, { useRef, useLayoutEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { useScroll, ScrollControls, Stars, Scroll } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';

const Earth = () => {
    const earthRef = useRef();
    const scroll = useScroll();
    const texture = useLoader(THREE.TextureLoader, 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg');

    useFrame((state, delta) => {
        if (!earthRef.current) return;

        // Initial rotation
        earthRef.current.rotation.y += delta * 0.05;

        // Scroll based animation
        // r1 is the scroll offset (0 to 1)
        const r1 = scroll.range(0, 1);

        // Rotate towards Taiwan (approximate logic)
        // Taiwan is ~121E, 23.5N.
        // In Three.js, we need to align this to the camera.
        // Let's say we want to end up with Taiwan facing the camera.
        // We can interpolate rotation.

        // Target rotation to face Taiwan (approximate)
        const targetRotationY = 4.5;
        const targetRotationX = 0.4;

        if (r1 > 0) {
            earthRef.current.rotation.y = THREE.MathUtils.lerp(earthRef.current.rotation.y, targetRotationY, r1 * 0.1);
            earthRef.current.rotation.x = THREE.MathUtils.lerp(0, targetRotationX, r1);

            // Zoom effect
            state.camera.position.z = THREE.MathUtils.lerp(5, 2.0, r1);
        }
    });

    return (
        <group ref={earthRef}>
            <mesh>
                <sphereGeometry args={[1.5, 64, 64]} />
                <meshStandardMaterial
                    map={texture}
                    roughness={0.6}
                    metalness={0.1}
                />
            </mesh>
            {/* Atmosphere glow */}
            <mesh scale={[1.02, 1.02, 1.02]}>
                <sphereGeometry args={[1.5, 32, 32]} />
                <meshBasicMaterial
                    color="#4285f4"
                    transparent={true}
                    opacity={0.1}
                    side={THREE.BackSide}
                />
            </mesh>
        </group>
    );
};

const Scene = () => {
    return (
        <>
            <color attach="background" args={['#f8f9fa']} />
            <ambientLight intensity={1.2} />
            <directionalLight position={[5, 3, 5]} intensity={2.0} />
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
