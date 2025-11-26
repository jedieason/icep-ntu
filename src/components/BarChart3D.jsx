import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Box } from '@react-three/drei';
import * as THREE from 'three';

const Bar = ({ position, height, color, label, count }) => {
    // Base height is small, add height based on count
    const actualHeight = Math.max(0.1, height);

    return (
        <group position={position}>
            <Box args={[0.8, actualHeight, 0.8]} position={[0, actualHeight / 2, 0]}>
                <meshStandardMaterial color={color} roughness={0.3} metalness={0.8} />
            </Box>
            {/* Label (Name) */}
            <Text
                position={[0, -0.5, 0.5]}
                fontSize={0.3}
                color="#ffffff"
                anchorX="center"
                anchorY="top"
                rotation={[-Math.PI / 4, 0, 0]}
            >
                {label}
            </Text>
            {/* Count Label */}
            <Text
                position={[0, actualHeight + 0.5, 0]}
                fontSize={0.4}
                color="#00f0ff"
                anchorX="center"
                anchorY="bottom"
            >
                {count}
            </Text>
        </group>
    );
};

const BarChart3D = ({ data }) => {
    // data is participation object: { Name: { Date: count } }

    const chartData = useMemo(() => {
        if (!data) return [];
        return Object.entries(data).map(([name, records]) => {
            const total = Object.values(records).reduce((sum, val) => sum + (parseInt(val) || 0), 0);
            return { name, total };
        });
    }, [data]);

    if (!data) return null;

    return (
        <div style={{ width: '100%', height: '500px', marginTop: '2rem', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '16px', overflow: 'hidden' }}>
            <Canvas camera={{ position: [5, 5, 10], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <spotLight position={[-10, 10, -10]} angle={0.3} penumbra={1} intensity={1} color="#00f0ff" />

                <group position={[-chartData.length / 2, -1, 0]}>
                    {chartData.map((item, index) => (
                        <Bar
                            key={item.name}
                            position={[index * 1.5, 0, 0]}
                            height={item.total * 0.5} // Scale factor
                            count={item.total}
                            label={item.name}
                            color={new THREE.Color().setHSL(index / chartData.length, 0.8, 0.5)}
                        />
                    ))}
                    {/* Floor */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[chartData.length * 0.75 - 0.75, 0, 0]}>
                        <planeGeometry args={[chartData.length * 2 + 2, 10]} />
                        <meshStandardMaterial color="#050510" transparent opacity={0.8} />
                        <gridHelper args={[chartData.length * 2 + 2, chartData.length * 2 + 2, 0x00f0ff, 0x222222]} rotation={[-Math.PI / 2, 0, 0]} />
                    </mesh>
                </group>

                <OrbitControls minPolarAngle={0} maxPolarAngle={Math.PI / 2.5} />
            </Canvas>
        </div>
    );
};

export default BarChart3D;
