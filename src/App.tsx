// src/App.tsx
import React, { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ShaderMaterial, Vector2, DoubleSide, Mesh } from "three";

const fragmentShader = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform float u_time;

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    uv = uv * 2.0 - 1.0;
    uv.x *= u_resolution.x / u_resolution.y;

    float dist = length(uv);
    float color = 0.5 + 0.5 * cos(u_time + dist * 10.0);
    gl_FragColor = vec4(vec3(color), 1.0);
  }
`;

const vertexShader = `
  precision highp float;

  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const RayMarchingShader = () => {
    const meshRef = useRef<Mesh>(null);

    const material = useRef(
        new ShaderMaterial({
            uniforms: {
                u_time: { value: 0 },
                u_resolution: {
                    value: new Vector2(window.innerWidth, window.innerHeight),
                },
            },
            vertexShader,
            fragmentShader,
            side: DoubleSide,
        })
    ).current;

    useEffect(() => {
        const handleResize = () => {
            material.uniforms.u_resolution.value.set(
                window.innerWidth,
                window.innerHeight
            );
        };

        window.addEventListener("resize", handleResize);
        handleResize();

        return () => window.removeEventListener("resize", handleResize);
    }, [material]);

    useFrame(() => {
        material.uniforms.u_time.value += 0.01;
    });

    return (
        <mesh ref={meshRef} material={material}>
            <planeGeometry args={[2, 2]} />
        </mesh>
    );
};

const App = () => (
    <Canvas>
        <RayMarchingShader />
    </Canvas>
);

export default App;
