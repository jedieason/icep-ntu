import React, { useRef, useLayoutEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useScroll, ScrollControls, Stars, Scroll, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';

const Earth = () => {
    const earthRef = useRef();
    const scroll = useScroll();
    const [colorMap, normalMap, specularMap] = useTexture([
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg'
    ]);

    useFrame((state, delta) => {
        if (!earthRef.current) return;

        // Initial rotation
        earthRef.current.rotation.y += delta * 0.05;

        // Scroll based animation
        const r1 = scroll.range(0, 1);

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
                <meshPhongMaterial
                    map={colorMap}
                    normalMap={normalMap}
                    specularMap={specularMap}
                    shininess={5}
                />
            </mesh>
            {/* Atmosphere glow - Subtle */}
            <mesh scale={[1.02, 1.02, 1.02]}>
                <sphereGeometry args={[1.5, 32, 32]} />
                <meshBasicMaterial
                    color="#4285f4"
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
            <color attach="background" args={['#ffffff']} />
            <ambientLight intensity={1.5} />
            <directionalLight position={[5, 3, 5]} intensity={3.0} />
            <Suspense fallback={null}>
                <Earth />
            </Suspense>
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
