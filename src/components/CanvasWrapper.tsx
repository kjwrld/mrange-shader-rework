import { ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

interface CanvasWrapperProps {
    children: ReactNode;
}

const CanvasWrapper: React.FC<CanvasWrapperProps> = ({ children }) => {
    return (
        <Canvas
            camera={{ position: [0, 0, 5], fov: 90 }}
            gl={{ antialias: false }}
        >
            <color attach="background" args={["black"]} />
            <OrbitControls
                enableZoom={false}
                enableRotate={false}
                enablePan={false}
            />
            {children}
        </Canvas>
    );
};

export default CanvasWrapper;
