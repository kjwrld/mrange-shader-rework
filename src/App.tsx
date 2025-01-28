import { useEffect, useRef } from "react";
import { Leva } from "leva";
import * as THREE from "three";
import CanvasWrapper from "./components/CanvasWrapper";
import BufferA from "./components/BufferAShader";

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
            </CanvasWrapper>
        </>
    );
};

export default App;
