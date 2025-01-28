// FlockarooPass.tsx
// created by Florian Berger (flockaroo) - 2018
// License CC BY-NC-SA 3.0

import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import React, { useRef, useMemo } from "react";
import { useThree, useFrame } from "@react-three/fiber";

const FlockarooMaterial = shaderMaterial(
    {
        iResolution: new THREE.Vector3(1, 1, 1),
        iTime: 0,
        iChannel0: null, // fractal
        iChannel1: null, // noise
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

    // referencing the original cross-hatch logic
    // We'll do "flockarooMain()" and then blend with fractal color

    uniform vec3 iResolution;
    uniform float iTime;
    uniform sampler2D iChannel0; // fractal
    uniform sampler2D iChannel1; // noise
    uniform float pencilFactor;
    varying vec2 vUv;

    #define FLICKER 1.0
    #define PI2 6.28318530718
    #define sc (iResolution.x/600.)

    vec2 roffs;
    float ramp;
    float rsc;

    vec2 uvSmooth(vec2 uv, vec2 res){
      return uv + 0.6*sin(uv*res*PI2)/(PI2*res);
    }

    vec4 getRand(vec2 pos){
      // sample iChannel1
      vec2 tres = vec2(textureSize(iChannel1,0));
      vec2 uv = pos/tres.xy;
      uv = uvSmooth(uv, tres);
      return texture2D(iChannel1, uv);
    }

    vec4 getCol(vec2 pos){
      // sample fractal from iChannel0
      // plus some offset logic from snippet
      vec4 r1 = (getRand((pos+roffs)*0.05*rsc/sc + iTime*131.*FLICKER)-0.5)*10.*ramp;
      vec2 uv = (pos + r1.xy*sc)/iResolution.xy;
      return texture2D(iChannel0, uv);
    }

    float getVal(vec2 pos){
      return clamp(dot(getCol(pos).xyz, vec3(0.333)), 0., 1.);
    }

    vec2 getGrad(vec2 pos, float eps){
      vec2 d=vec2(eps,0.);
      return vec2(
        getVal(pos+d.xy)-getVal(pos-d.xy),
        getVal(pos+d.yx)-getVal(pos-d.yx)
      )/(eps*2.);
    }

    vec3 flockarooMain(vec2 fragCoord){
      // the main effect from snippet
      vec4 r = getRand(fragCoord*1.2/sqrt(sc)) 
             - getRand(fragCoord*1.2/sqrt(sc)+vec2(1.,-1.)*1.5);
      vec4 r2 = getRand(fragCoord*1.2/sqrt(sc));

      float br=0.;
      roffs=vec2(0.);
      ramp=.7;
      rsc=.7;
      int num=3;
      for(int i=0;i<num;i++){
        float fi = float(i)/float(num-1);
        float t=.03 + .25*fi;
        float w = t*2.;
        // first line
        ramp=.0*pow(1.3, fi*5.);
        rsc=1.0*pow(1.3, -fi*5.);
        br += 2.6*(0.5+fi)*smoothstep(t-w/2., t+w/2., length(getGrad(fragCoord, 0.4*sc))*sc);

        // second line
        ramp=.35*pow(1.3, fi*5.);
        rsc=5.7*pow(1.3, -fi*5.);
        br += 0.4*(0.2+fi)*smoothstep(t-w/2., t+w/2., length(getGrad(fragCoord, 0.4*sc))*sc);
      }

      vec3 col = vec3(1.) - 0.7*br*(0.5 + 0.5*r2.z)*3./float(num);
      col = clamp(col,0.,1.);

      // cross hatch
      ramp=0.;
      int hnum=5;
      float hatch=0.;
      float hatch2=0.;
      float sum=0.;
      for(int i=0;i<hnum;i++){
        float brv = getVal(fragCoord + 1.5*sc*(getRand(fragCoord*0.02 + iTime*1120.).xy-0.5)
                    * clamp(FLICKER,-1.,1.))*1.7;
        float ang=-0.5-0.08*float(i)*float(i);
        float ca=cos(ang-1.6), sa=sin(ang-1.6);
        mat2 ro=mat2(ca, -sa, sa, ca);
        vec2 uvh=ro*(fragCoord/sqrt(sc)*vec2(0.05,1.)*1.3);
        vec4 rh = pow(getRand(uvh+1003.123*iTime*FLICKER+vec2(sin(uvh.y),0.)), vec4(1.));
        float val=1.-smoothstep(0.5,1.5,(rh.x)+brv)-0.3*abs(r.z);
        hatch+=val;
        if(val>hatch2) hatch2=val;
        sum+=1.;
        if(float(i)>(1.-brv)*float(hnum) && i>=2) break;
      }
      col *= 1.-clamp(mix(hatch/sum,hatch2,0.5),0.,1.);
      col=1.-((1.-col)*0.7);

      // paper
      col *= 1.05 + 0.06*r.xxx + 0.06*r.xyz;

      // vignette
      {
        vec2 scc=(fragCoord - 0.5*iResolution.xy)/iResolution.x;
        float vign=1.-0.3*dot(scc,scc);
        vign*=1.-0.7*exp(-sin(fragCoord.x/iResolution.x*3.1416)*40.);
        vign*=1.-0.7*exp(-sin(fragCoord.y/iResolution.y*3.1416)*20.);
        // col*=vign;
      }
      return col;
    }

    void main(){
      vec2 fragCoord = vUv * iResolution.xy;
      // fractal color
      vec3 baseCol = texture2D(iChannel0, vUv).rgb;
      // flockaroo effect
      vec3 pencilCol = flockarooMain(fragCoord);
      // blend
      vec3 final = mix(baseCol, pencilCol, pencilFactor);
      gl_FragColor = vec4(final,1.0);
    }
  `
);

export default function FlockarooPass({
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
    const mat = useMemo(() => new FlockarooMaterial(), []);
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame(() => {
        if (!matRef.current) return;
        matRef.current.iTime = clock.getElapsedTime();
        matRef.current.iResolution.set(size.width, size.height, 1);
        matRef.current.iChannel0 = fractalTex; // fractal
        matRef.current.iChannel1 = noiseTex; // noise
        matRef.current.pencilFactor = pencilFactor;
    });

    // Force draw on top
    React.useEffect(() => {
        if (meshRef.current) {
            meshRef.current.renderOrder = 1000;
            meshRef.current.frustumCulled = false;
        }
    }, []);

    return (
        <mesh ref={meshRef} geometry={geo} material={mat}>
            <primitive object={mat} ref={matRef} attach="material" />
        </mesh>
    );
}
