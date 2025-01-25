import { extend, useFrame } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useRef } from "react";

const FXAAShaderMaterial = shaderMaterial(
    {
        iResolution: new THREE.Vector3(
            window.innerWidth,
            window.innerHeight,
            1
        ),
        tDiffuse: null, // Texture from the render target
    },
    `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    `
    #define RESOLUTION iResolution

    uniform vec3 iResolution;
    uniform sampler2D tDiffuse;

    vec4 fxaa(sampler2D tex, vec2 uv, vec2 texelSz) {
      const float span_max = 8.0;
      const float reduce_min = (1.0 / 128.0);
      const float reduce_mul = (1.0 / 32.0);
      const vec3 luma = vec3(0.299, 0.587, 0.114);

      vec3 rgbCC = texture2D(tex, uv).rgb;
      vec3 rgb00 = texture2D(tex, uv + vec2(-1.0, -1.0) * texelSz).rgb;
      vec3 rgb10 = texture2D(tex, uv + vec2(1.0, -1.0) * texelSz).rgb;
      vec3 rgb01 = texture2D(tex, uv + vec2(-1.0, 1.0) * texelSz).rgb;
      vec3 rgb11 = texture2D(tex, uv + vec2(1.0, 1.0) * texelSz).rgb;

      float lumaCC = dot(rgbCC, luma);
      float luma00 = dot(rgb00, luma);
      float luma10 = dot(rgb10, luma);
      float luma01 = dot(rgb01, luma);
      float luma11 = dot(rgb11, luma);

      vec2 dir = vec2((luma01 + luma11) - (luma00 + luma10), (luma00 + luma01) - (luma10 + luma11));
      float dirReduce = max((luma00 + luma10 + luma01 + luma11) * reduce_mul, reduce_min);
      float rcpDir = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);

      dir = clamp(dir * rcpDir, -span_max, span_max) * texelSz.xy;
      vec4 A = 0.5 * (texture2D(tex, uv - dir * (1.0 / 6.0)) + texture2D(tex, uv + dir * (1.0 / 6.0)));
      vec4 B = A * 0.5 + 0.25 * (texture2D(tex, uv - dir * 0.5) + texture2D(tex, uv + dir * 0.5));

      float lumaMin = min(lumaCC, min(min(luma00, luma10), min(luma01, luma11)));
      float lumaMax = max(lumaCC, max(max(luma00, luma10), max(luma01, luma11)));
      float lumaB = dot(B.rgb, luma);

      return ((lumaB < lumaMin) || (lumaB > lumaMax)) ? A : B;
    }

    void main() {
      vec2 texelSz = 1.0 / iResolution.xy;
      gl_FragColor = fxaa(tDiffuse, vUv, texelSz);
    }
  `
);

extend({ FXAAShaderMaterial });

export default function FXAA({ texture }: { texture: THREE.Texture }) {
    const materialRef = useRef<any>();

    useFrame(({ size }) => {
        if (materialRef.current) {
            materialRef.current.iResolution.set(size.width, size.height, 1);
        }
    });

    return (
        <mesh>
            <planeGeometry args={[window.innerWidth, window.innerHeight]} />
            <fXAAShaderMaterial ref={materialRef} tDiffuse={texture} />
        </mesh>
    );
}
