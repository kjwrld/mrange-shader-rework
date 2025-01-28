// SkaplunPass.tsx
// Author: @skaplun
// https://www.shadertoy.com/view/styGDw

import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import React, { useRef, useMemo } from "react";
import { useThree, useFrame } from "@react-three/fiber";

const SkaplunMaterial = shaderMaterial(
    {
        iResolution: new THREE.Vector3(1, 1, 1),
        iTime: 0,
        prevPass: null, // fractal
        NoiseTex: null, // noise
        pencilFactor: 1.0,
    },
    /* vertex */ `
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = vec4(position,1.0);
    }
  `,
    /* fragment */ `
    precision highp float;

    // Distortion-based cross-hatch pass

    uniform vec3 iResolution;
    uniform float iTime;
    uniform sampler2D prevPass;
    uniform sampler2D NoiseTex;
    uniform float pencilFactor;
    varying vec2 vUv;

    #define PI 3.14159265359
    #define PI2 6.28318530718
    #define VIGNETTING
    #define STROKE_THICKNESS (min(iResolution.x,iResolution.y)/500.)
    #define GRADIENT_EPS (STROKE_THICKNESS * 0.4)

    struct DistortionParams {
      float value;
      float amplitude;
    };

    float saturate(float x){ return clamp(x,0.,1.)+0.1; }

    // Distortion macros
    DistortionParams NO_DISTORTION = DistortionParams(0.0,0.0);

    DistortionParams DISTORTION_OUTLINE_1(float x){
      // e.g. (1.7 * pow(1.3, -x * 5.), .15 * pow(1.3, x * 5.))
      return DistortionParams(
        1.7 * pow(1.3, -x*5.0),
        0.15 * pow(1.3, x*5.0)
      );
    }
    DistortionParams DISTORTION_OUTLINE_2(float x){
      // (10.7 * pow(1.3, -x * 5.), .4 * pow(1.3, x * 5.))
      return DistortionParams(
        10.7 * pow(1.3, -x*5.0),
        0.4 * pow(1.3, x*5.0)
      );
    }

    // Distortion sampling from the snippet
    vec4 distortion(vec2 pos){
      vec2 noiseRes = vec2(textureSize(NoiseTex, 0));
      vec2 uv = pos/noiseRes;
      uv += 0.6 * sin(uv*noiseRes*PI2)/PI2/noiseRes;
      return texture2D(NoiseTex, uv*0.5);
    }

    vec4 distortedDiffuseColor(vec2 pos, DistortionParams dp){
      vec2 distVal = (distortion(pos*0.05*dp.value/STROKE_THICKNESS)-0.5).xy 
                     * 10.0 * dp.amplitude;
      vec2 uv = (pos + distVal*STROKE_THICKNESS)/iResolution.xy;
      return texture2D(prevPass, uv);
    }

    float luminance(vec2 pos, DistortionParams dp){
      return saturate(dot(distortedDiffuseColor(pos, dp).xyz, vec3(0.333)));
    }

    vec2 gradient(vec2 pos, DistortionParams dp){
      vec2 d = vec2(GRADIENT_EPS,0.);
      return vec2(
        luminance(pos+d.xy, dp) - luminance(pos-d.xy, dp),
        luminance(pos+d.yx, dp) - luminance(pos-d.yx, dp)
      ) / (GRADIENT_EPS*2.0);
    }

    vec3 skaplunMain(vec2 fragCoord){
      float stroke=0.0;
      for(int i=0; i<3; i++){
        float fi=float(i)/2.0;
        float strokeStrength = 0.03 + 0.5*fi;
        float val1 = length(gradient(fragCoord, DISTORTION_OUTLINE_1(fi))) * STROKE_THICKNESS;
        stroke += 0.6*(0.5+fi)*smoothstep(0., strokeStrength, val1);

        float val2 = length(gradient(fragCoord, DISTORTION_OUTLINE_2(fi))) * STROKE_THICKNESS;
        stroke += 0.4*(0.2+fi)*smoothstep(0., strokeStrength, val2);
      }
      vec4 r2 = distortion(fragCoord*1.2/sqrt(STROKE_THICKNESS));
      vec3 col = vec3(1.0) - saturate(0.7*stroke*(0.5 + 0.5*r2.z));

      // subtract 2 random => -1..1
      vec4 rA = distortion(fragCoord*1.2/sqrt(STROKE_THICKNESS));
      vec4 rB = distortion(fragCoord*1.2/sqrt(STROKE_THICKNESS)+vec2(1.,-1.)*1.5);
      vec4 r = rA - rB;

      // cross hatch
      const int HATCHES_COUNT=5;
      float fragLum = luminance(fragCoord + 2.5*STROKE_THICKNESS*(distortion(fragCoord*0.02).xy-0.5), NO_DISTORTION)*1.5;
      float hatchesSum=0.;
      float strongestHatch=0.;
      float actualHatchesCount=0.;
      for(int i=0;i<HATCHES_COUNT;i++){
        float hatchAng = -0.5 - 0.08*float(i)*float(i);
        float ca=cos(hatchAng-1.6), sa=sin(hatchAng-1.6);
        mat2 ro=mat2(ca, -sa, sa, ca);
        vec2 rotatedUV = ro*(fragCoord/sqrt(STROKE_THICKNESS)*vec2(0.05,1.)*2.3);
        float rh = pow(distortion(rotatedUV+vec2(sin(rotatedUV.y),0.)), vec4(1.)).x;
        float currentHatch=1.-smoothstep(0.5,1.5,rh+fragLum)-0.3*abs(r.z);

        hatchesSum+=currentHatch;
        if(currentHatch>strongestHatch) strongestHatch=currentHatch;
        actualHatchesCount+=1.;

        if(i>=2 && float(i)>(1.-fragLum)*float(HATCHES_COUNT)) break;
      }
      col *= 1.-saturate(mix(hatchesSum/actualHatchesCount, strongestHatch,0.5));
      col = 1. - ((1.-col)*0.7);

      // paper
      col *= 0.95 + 0.06*r.xxx + 0.06*r.xyz;

      #ifdef VIGNETTING
      {
        vec2 scc = (fragCoord-0.5*iResolution.xy)/iResolution.x;
        float vign=1.-0.3*dot(scc,scc);
        vign*=1.-0.7*exp(-sin(fragCoord.x/iResolution.x*PI)*40.);
        vign*=1.-0.7*exp(-sin(fragCoord.y/iResolution.y*PI)*20.);
        col*=vign;
      }
      #endif

      return col;
    }

    void main(){
      vec2 fragCoord = vUv*iResolution.xy;
      // base fractal
      vec3 baseCol = texture2D(prevPass, vUv).rgb;
      // skaplun effect
      vec3 pencilCol = skaplunMain(fragCoord);
      // blend
      vec3 final = mix(baseCol, pencilCol, pencilFactor);
      gl_FragColor = vec4(final,1.0);
    }
  `
);

export default function SkaplunPass({
    fractalTex,
    noiseTex,
    pencilFactor,
}: {
    fractalTex: THREE.Texture;
    noiseTex: THREE.Texture;
    pencilFactor: number;
}) {
    const matRef = useRef<any>();
    const { clock, size } = useThree();

    const geo = useMemo(() => new THREE.PlaneGeometry(2, 2), []);
    const mat = useMemo(() => new SkaplunMaterial(), []);
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame(() => {
        if (!matRef.current) return;
        matRef.current.iTime = clock.getElapsedTime();
        matRef.current.iResolution.set(size.width, size.height, 1);
        matRef.current.prevPass = fractalTex;
        matRef.current.NoiseTex = noiseTex;
        matRef.current.pencilFactor = pencilFactor;
    });

    React.useEffect(() => {
        if (meshRef.current) {
            meshRef.current.renderOrder = 9999;
            meshRef.current.frustumCulled = false;
        }
    }, []);

    return (
        <mesh ref={meshRef} geometry={geo} material={mat}>
            <primitive object={mat} ref={matRef} attach="material" />
        </mesh>
    );
}
