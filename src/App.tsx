import { useEffect, useRef } from "react";
import { Leva } from "leva";
import * as THREE from "three";
import CanvasWrapper from "./components/CanvasWrapper";
import BufferA from "./components/BufferAShader";
import FXAA from "./components/FXAAShader";

const App: React.FC = () => {
    const renderTarget = useRef<THREE.WebGLRenderTarget>();

    useEffect(() => {
        renderTarget.current = new THREE.WebGLRenderTarget(
            window.innerWidth,
            window.innerHeight
        );
    }, []);

    return (
        <>
            <Leva collapsed />
            <CanvasWrapper>
                <BufferA />
                {renderTarget.current && (
                    <FXAA texture={renderTarget.current.texture} />
                )}
            </CanvasWrapper>
        </>
    );
};

export default App;
