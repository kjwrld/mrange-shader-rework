import { useRef } from "react";
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";

// GLSL FXAA shader with color debugging
const FXAAShader = shaderMaterial(
    {
        iChannel0: null,
        iResolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
    },
    `
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
    `
  #define RESOLUTION iResolution

  void main() {
    vec2 uv = gl_FragCoord.xy / RESOLUTION.xy; // Normalize UV
    vec3 color = vec3(uv, 0.5);                // Debug UV-based gradient
    gl_FragColor = vec4(color, 1.0);           // Output color
  }
  `
);

extend({ FXAAShader });

console.log("FXAAShader extended:", FXAAShader);

interface FXAAProps {
    texture: THREE.Texture;
}

const FXAA: React.FC<FXAAProps> = ({ texture }) => {
    const materialRef = useRef<any>();

    return (
        <mesh>
            <planeGeometry args={[2, 2]} />
            {texture && <fxaaShader ref={materialRef} iChannel0={texture} />}
        </mesh>
    );
};

export { FXAAShader };
export default FXAA;
