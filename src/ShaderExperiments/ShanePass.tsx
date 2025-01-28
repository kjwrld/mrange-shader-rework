// ShanePass.tsx
// by Shane Warne
// https://www.shadertoy.com/view/3dtBWX

import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import React, { useRef, useMemo } from "react";
import { useThree, useFrame } from "@react-three/fiber";

// We'll define the "ShanePassMaterial":
const ShanePassMaterial = shaderMaterial(
    {
        iResolution: new THREE.Vector3(1, 1, 1),
        iTime: 0,
        prevPass: null,
        NoiseTex: null,
        pencilFactor: 1.0,
    },
    /* vertex */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position,1.0);
    }
  `,
    /* fragment */ `
    precision highp float;

    #define PI 3.14159265359

    uniform vec3 iResolution;
    uniform float iTime;
    uniform float pencilFactor;
    uniform sampler2D prevPass;  // fractal
    uniform sampler2D NoiseTex;  // noise

    varying vec2 vUv;

    //--------------------------------------
    // Helpers from Shane's code
    //--------------------------------------

    // "n2D" style 2D noise
    float n2D(vec2 p){
      // simple hash-based noise
      return fract(sin(dot(p, vec2(27.619, 57.583))) * 43758.5453);
    }

    // 2D rotation
    mat2 rot2(float a){
      float c = cos(a), s = sin(a);
      return mat2(c, -s, s, c);
    }

    // saturate
    float saturate(float x){ return clamp(x, 0.0, 1.0); }

    // The "pencil" function from Shane Warne's snippet,
    // adapted to read fractal color as base and do layered noise.
    vec3 shanePencil( vec3 col, vec2 p ){
      // Scale p a bit for the noise frequencies
      vec2 q = p*4.0;
      const vec2 sc = vec2(1., 12.);
      
      // Add small distortion using n2D
      q += (vec2(n2D(q*4.), n2D(q*4. + 7.3)) - 0.5)*0.03;
      q = rot2(-3.14159/2.5) * q;

      // ensure col is in [0,1]
      col = min(col,1.0);

      // grayscale
      float gr = dot(col, vec3(.299, .587, .114));

      // layered noise
      float ns = (n2D(q*sc)*0.66 + n2D(q*2.*sc)*0.34);

      // rotate q, do more layers
      q = rot2(3.14159/2.) * q;
      float ns2 = (n2D(q*sc)*0.66 + n2D(q*2.*sc)*0.34);
      q = rot2(-3.14159/5.) * q;
      float ns3 = (n2D(q*sc)*0.66 + n2D(q*2.*sc)*0.34);

      float mm = max(ns, max(ns2, ns3));

      // Some basic contrast logic
      float contrast = 1.0;
      float hatchVal = 0.5 + (gr - mm)*contrast;
      return vec3(saturate(hatchVal));
    }
    //--------------------------------------

    void main(){
      // screen coords
      vec2 fragCoord = vUv * iResolution.xy;

      // base fractal color from prevPass
      vec3 baseCol = texture2D(prevPass, vUv).rgb;

      // "shane" pencil output
      vec3 pencilCol = shanePencil(baseCol, fragCoord);

      // Blend
      vec3 finalCol = mix(baseCol, pencilCol, pencilFactor);
      gl_FragColor = vec4(finalCol, 1.0);
    }
  `
);

// Then the R3F component that places a plane in front:
export default function ShanePass({
    fractalTex,
    noiseTex,
    factor,
}: {
    fractalTex: THREE.Texture;
    noiseTex: THREE.Texture;
    factor: number;
}) {
    const matRef = useRef<any>(null);
    const { clock, size } = useThree();

    // plane geometry for full screen
    const planeGeo = useMemo(() => new THREE.PlaneGeometry(2, 2), []);
    const shaneMat = useMemo(() => new ShanePassMaterial(), []);

    const planeRef = useRef<THREE.Mesh>(null);

    // Update uniforms each frame
    useFrame(() => {
        if (!matRef.current) return;
        matRef.current.iTime = clock.getElapsedTime();
        matRef.current.iResolution.set(size.width, size.height, 1);
        matRef.current.prevPass = fractalTex; // fractal FBO
        matRef.current.NoiseTex = noiseTex; // noise
        matRef.current.pencilFactor = factor; // blend
    });

    // Force draw on top
    React.useEffect(() => {
        if (planeRef.current) {
            planeRef.current.renderOrder = 9999;
            planeRef.current.frustumCulled = false;
        }
    }, []);

    return (
        <mesh ref={planeRef} geometry={planeGeo} material={shaneMat}>
            <primitive object={shaneMat} ref={matRef} attach="material" />
        </mesh>
    );
}
