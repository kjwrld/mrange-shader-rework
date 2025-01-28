// components/PencilPass.tsx
import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";

// A basic pencil-shader based on your snippet:
const PencilShaderMaterial = shaderMaterial(
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

    // You can define your #defines here or use uniforms
    #define PI 3.14159265359
    #define PI2 6.28318530718
    #define VIGNETTING
    #define STROKE_THICKNESS (min(iResolution.x,iResolution.y)/500.)
    #define GRADIENT_EPS (STROKE_THICKNESS * .4)

    uniform vec3 iResolution;
    uniform float iTime;
    uniform float pencilFactor;   // how strong the pencil effect
    uniform sampler2D prevPass;   // fractal color
    uniform sampler2D NoiseTex;   // noise

    varying vec2 vUv;

    // Example snippet: We'll just do a trivial effect:
    vec4 pencilEffect(vec2 fragCoord) {
      // Insert your cross-hatch logic here.
      // For brevity, let's just invert the fractal + add noise:
      vec4 fractCol = texture2D(prevPass, fragCoord/iResolution.xy);
      vec4 noise = texture2D(NoiseTex, fragCoord/iResolution.xy*2.);
      // Fake "pencil" effect => invert fractCol + noise
      vec3 pencilCol = 1.0 - fractCol.rgb + 0.2*noise.rgb;
      return vec4(pencilCol, 1.0);
    }

    void main(){
      vec2 fragCoord = vUv * iResolution.xy;
      // base fractal color
      vec3 baseCol = texture2D(prevPass, vUv).rgb;
      // pencil color
      vec3 penCol = pencilEffect(fragCoord).rgb;

      // blend
      vec3 finalColor = mix(baseCol, penCol, pencilFactor);
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

export default function PencilPass({
    fractalTex,
    noiseTex,
    factor,
}: {
    fractalTex: THREE.Texture;
    noiseTex: THREE.Texture;
    factor: number;
}) {
    const matRef = useRef<any>(null);
    const { size, clock } = useThree();

    useFrame(() => {
        if (!matRef.current) return;
        matRef.current.iTime = clock.getElapsedTime();
        matRef.current.iResolution.set(size.width, size.height, 1);
        matRef.current.prevPass = fractalTex;
        matRef.current.NoiseTex = noiseTex;
        matRef.current.pencilFactor = factor;
    });

    const planeGeo = useMemo(() => new THREE.PlaneGeometry(2, 2), []);
    const pencilMat = useMemo(() => new PencilShaderMaterial(), []);
    const planeRef = useRef<THREE.Mesh>(null);

    React.useEffect(() => {
        if (planeRef.current) {
            planeRef.current.renderOrder = 9999;
            planeRef.current.frustumCulled = false;
        }
    }, []);

    return (
        <mesh
            ref={planeRef}
            geometry={planeGeo}
            material={pencilMat}
            position={[0, 0, 0]}
        >
            <primitive object={pencilMat} ref={matRef} attach="material" />
        </mesh>
    );
}
