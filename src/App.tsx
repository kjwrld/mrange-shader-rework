import React from "react";
import { Leva } from "leva";
import CanvasWrapper from "./components/CanvasWrapper";
import BufferA from "./components/BufferAShader";
import OverlayUI from "./components/OverlayUI";

const App: React.FC = () => {
    return (
        <>
            <Leva collapsed />
            <CanvasWrapper>
                <BufferA />
            </CanvasWrapper>
            <OverlayUI />
        </>
    );
};

export default App;
