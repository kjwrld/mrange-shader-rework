import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ScreenQuad } from "@react-three/drei";
import TwistedTorusMaterial from "./TwistedTorusMaterial";

const Raymarch = () => {
    const materialRef = useRef<any>(null);

    useFrame(({ clock, size }) => {
        if (materialRef.current) {
            materialRef.current.u_time = clock.getElapsedTime();
            materialRef.current.u_resolution.set(size.width, size.height, 1, 1);
        }
    });

    return (
        <ScreenQuad>
            <twistedTorusMaterial ref={materialRef} />
        </ScreenQuad>
    );
};

export default Raymarch;
