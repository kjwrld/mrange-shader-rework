import { useEffect, useRef } from "react";
import * as THREE from "three";
import CanvasWrapper from "./components/CanvasWrapper";
import BufferA from "./components/BufferAShader";

const App: React.FC = () => {
    const renderTarget = useRef<THREE.WebGLRenderTarget>();
    const sceneTexture = useRef<THREE.Texture>();

    useEffect(() => {
        renderTarget.current = new THREE.WebGLRenderTarget(
            window.innerWidth,
            window.innerHeight
        );
        sceneTexture.current = renderTarget.current.texture;
        if (sceneTexture.current) {
            console.log("we are anti-aliasing!");
        }
    }, []);

    return (
        <>
            <CanvasWrapper>
                <BufferA />
                {/* {sceneTexture.current && renderTarget.current && (
                    <fXAAShaderMaterial
                        tDiffuse={renderTarget.current.texture} // Ensure texture is passed
                    />
                )} */}
            </CanvasWrapper>
        </>
    );
};

export default App;
