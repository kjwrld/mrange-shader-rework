import { ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

interface CanvasWrapperProps {
    children: ReactNode;
}

const CanvasWrapper: React.FC<CanvasWrapperProps> = ({ children }) => {
    return (
        <Canvas
            // camera={{ position: [0, -1, 5], fov: 90 }}
            camera={{ position: [0, -1, 5], fov: 80 }}
            gl={{ antialias: false }}
        >
            <color attach="background" args={["white"]} />
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
