import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import * as THREE from "three";

const TwistedTorusMaterial = shaderMaterial(
    {
        u_time: 0,
        u_resolution: new THREE.Vector4(),
        twistAmount: 0.5,
        torusRadius: 1.0,
        torusThickness: 0.3,
    },
    // Vertex Shader
    `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    // Fragment Shader
    `
    uniform float u_time;
    uniform vec4 u_resolution;
    uniform float twistAmount;
    uniform float torusRadius;
    uniform float torusThickness;

    varying vec2 vUv;

    void main() {
      vec2 uv = vUv * 2.0 - 1.0;
      gl_FragColor = vec4(uv.x, uv.y, abs(sin(u_time)), 1.0);
    }
  `
);

extend({ TwistedTorusMaterial });

declare module "@react-three/fiber" {
    interface ThreeElements {
        twistedTorusMaterial: JSX.IntrinsicElements["shaderMaterial"];
    }
}

export default TwistedTorusMaterial;
