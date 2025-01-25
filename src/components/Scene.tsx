import { Canvas } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import Raymarch from "./Raymarch";

const Scene = () => {
    return (
        <Canvas>
            <OrthographicCamera
                makeDefault
                zoom={1}
                top={1 / 2}
                bottom={-1 / 2}
                left={-1 / 2}
                right={1 / 2}
                near={-1000}
                far={1000}
            />
            <Raymarch />
        </Canvas>
    );
};

export default Scene;
