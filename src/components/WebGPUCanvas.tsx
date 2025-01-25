import React, { PropsWithChildren } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr } from "@react-three/drei";
import * as THREE from "three";

interface WebGPUCanvasProps extends PropsWithChildren {
    frameloop?: "always" | "demand" | "never";
}

const WebGPUCanvas: React.FC<WebGPUCanvasProps> = ({
    children,
    frameloop = "always",
}) => {
    return (
        <Canvas
            frameloop={frameloop}
            onCreated={({ gl }) => {
                gl.toneMapping = THREE.ACESFilmicToneMapping;
                gl.outputColorSpace = THREE.SRGBColorSpace; // Updated for latest Three.js
            }}
        >
            <AdaptiveDpr />
            {children}
        </Canvas>
    );
};

export default WebGPUCanvas;
