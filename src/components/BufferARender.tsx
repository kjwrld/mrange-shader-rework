// components/BufferARender.tsx
import React, { useRef } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import { useFBO } from "@react-three/drei";
import BufferA from "./BufferAShader";

interface BufferARenderProps {
    onTarget: (tex: THREE.Texture) => void;
}

export default function BufferARender({ onTarget }: BufferARenderProps) {
    const { gl, camera } = useThree();
    const fbo = useFBO({ stencilBuffer: false, depthBuffer: true });

    // We'll mount BufferA in a sub-scene:
    const hiddenScene = useRef(new THREE.Scene()).current;

    // Add BufferA once
    const bufferAMesh = useRef<THREE.Object3D | null>(null);

    // On first render, add a <BufferA /> object to hiddenScene
    React.useEffect(() => {
        if (!bufferAMesh.current) {
            // We can create a group that holds BufferA as R3F, or create the actual BufferA mesh manually.
            // Simpler approach: Just create a manual Mesh + material from BufferA code
            // But let's do it by "rendering" <BufferA /> in hiddenScene. For brevity, let's do a manual approach:
            // Actually we'll do a naive approach: a single child:
            // (If you prefer R3F portals, we can do that. This is just quick.)
        }
    }, []);

    // We'll do the rendering each frame
    useFrame(() => {
        const oldTarget = gl.getRenderTarget();
        gl.setRenderTarget(fbo);
        gl.clear();
        // Render the hiddenScene with the main camera
        gl.render(hiddenScene, camera);
        gl.setRenderTarget(oldTarget);

        onTarget(fbo.texture);
    });

    return (
        <>
            <group
                ref={(g) => {
                    if (g && !hiddenScene.children.includes(g)) {
                        hiddenScene.add(g);
                    }
                }}
            >
                <BufferA />
            </group>
        </>
    );
}
