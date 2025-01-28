import React from "react";
import CanvasWrapper from "./components/CanvasWrapper";
import MainScene from "./MainScene";

const App: React.FC = () => {
    return (
        <>
            <CanvasWrapper>
                <MainScene />
            </CanvasWrapper>
        </>
    );
};

export default App;
