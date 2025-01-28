// MainScene.tsx
import React, { useState } from "react";
import BufferARender from "./components/BufferARender";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import FlockarooPass from "./components/FlockarooPass";

export default function MainScene() {
    // Load noise texture inside the Canvas
    const noiseTex = useTexture("/mrange-shader-rework/noise_texture.png");
    noiseTex.wrapS = noiseTex.wrapT = THREE.RepeatWrapping;

    const [fractalTex, setFractalTex] = useState<THREE.Texture | null>(null);
    // const [pencilFactor, setPencilFactor] = useState(1);

    // Fade pencil=1 to pencil=0 after 3s
    // React.useEffect(() => {
    //     const timer = setTimeout(() => {
    //         let startTime = performance.now();
    //         let duration = 2.0; // seconds
    //         function animate() {
    //             let now = performance.now();
    //             let t = Math.min(1.0, (now - startTime) / (duration * 1000));
    //             let factor = 1.0 - t;
    //             setPencilFactor(factor);
    //             if (t < 1) requestAnimationFrame(animate);
    //         }
    //         animate();
    //     }, 2000);

    //     return () => clearTimeout(timer);
    // }, []);

    return (
        <>
            {/* 1) Render BufferA to an offscreen FBO, get fractalTex */}
            <BufferARender onTarget={setFractalTex} />

            {fractalTex && (
                <FlockarooPass
                    fractalTex={fractalTex}
                    noiseTex={noiseTex}
                    pencilFactor={0.0}
                />
            )}
        </>
    );
}
