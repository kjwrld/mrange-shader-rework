import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";

const PencilShaderMaterial = shaderMaterial(
    {
        iResolution: new THREE.Vector3(1, 1, 1),
        iTime: 0,
        iChannel0: null,
        iChannel1: null,
        uPencilFactor: 1.0,
    },
    /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,
    /* glsl */ `
    precision highp float;

    uniform vec3 iResolution;
    uniform float iTime;
    uniform sampler2D iChannel0; // BufferA color
    uniform sampler2D iChannel1; // Noise
    uniform float uPencilFactor;

    varying vec2 vUv;

    // ### PENCIL CODE from your snippet (slightly adapted) ###
    // We'll wrap it in a function: "pencilEffect()"
    // Then we can blend that with the original color.

    #define FLICKER 0.01
    #define PI2 6.28318530718

    float sc = 1.0; // we will set it in main()

    // The original code used iResolution and fragCoord. We adjust.
    // We'll define "fragCoord" in main from vUv and iResolution.

    vec2 uvSmooth(vec2 uv, vec2 res)
    {
        return uv + 0.6 * sin(uv * res * PI2) / (PI2 * res);
    }

    vec4 getRand(vec2 pos)
    {
        // iChannel1 is random/noise
        // If you want to keep the original "textureSize" usage,
        // call textureSize(iChannel1, 0) in WebGL2. We'll do a simpler approach:
        vec2 ruv = uvSmooth(pos, vec2(256.,256.)); // or any chosen size
        return texture2D(iChannel1, ruv);
    }

    vec4 getCol(vec2 pos)
    {
        // get color from iChannel0 (the BufferA)
        vec4 c = texture2D(iChannel0, pos / iResolution.xy);

        // optional: background or vignette
        return c;
    }

    float getVal(vec2 pos)
    {
        return clamp(dot(getCol(pos).xyz, vec3(0.333)),0.,1.);
    }

    vec2 getGrad(vec2 pos, float eps)
    {
        vec2 d=vec2(eps,0.);
        return vec2(
            getVal(pos + d.xy) - getVal(pos - d.xy),
            getVal(pos + d.yx) - getVal(pos - d.yx)
        )/(eps*2.);
    }

    vec4 pencilEffect(vec2 fragCoord)
    {
        // from your snippet:
        // .....................
        float br=0.;
        vec2 roffs = vec2(0.);
        float ramp = .7;
        float rsc=.7;

        int num=3;
        for(int i=0;i<num;i++)
        {
            float fi=float(i)/float(num-1);
            float t=.03+.25*fi, w=t*2.;
            ramp=.15*pow(1.3, fi*5.); 
            rsc=1.7*pow(1.3, -fi*5.);
            br += .6*(.5+fi)*smoothstep(t-w/2., t+w/2., length(getGrad(fragCoord, .4*sc))*sc);

            ramp=.3*pow(1.3, fi*5.); 
            rsc=10.7*pow(1.3, -fi*5.);
            br += .4*(.2+fi)*smoothstep(t-w/2., t+w/2., length(getGrad(fragCoord, .4*sc))*sc);
        }

        vec4 r = getRand(fragCoord*1.2/sqrt(sc) - iTime*131.*FLICKER);
        vec4 r2 = getRand(fragCoord*1.2/sqrt(sc));

        vec3 col = vec3(1.) - .7 * br*(.5 + .5*r2.z)*3./float(num);
        
        // cross hatch
        int hnum=5;
        float hatch=0.;
        float hatch2=0.;
        float sum=0.;
        for(int i=0;i<hnum;i++){
            float brr = getVal(fragCoord + 1.5*sc*(getRand(fragCoord*.02 + iTime*1120.).xy - .5)*clamp(FLICKER, -1.,1.))*1.7;
            float ang = -.5 - .08*float(i)*float(i);
            // simplified random usage:
            vec2 uvh = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * fragCoord / sqrt(sc) * vec2(.05,1.) *1.3;
            vec4 rh = getRand(uvh + 1003.123*iTime*FLICKER);
            hatch += 1. - smoothstep(.5,1.5,(rh.x)+brr) - .3*abs(r.z);
            hatch2= max(hatch2, 1. - smoothstep(.5,1.5,(rh.x)+brr)- .3*abs(r.z);
            sum +=1.;
            if(float(i)>(1.-brr)*float(hnum) && i>=2) break;
        }
        col *= 1.-clamp(mix(hatch/sum, hatch2, .5),0.,1.);
        col=1.-((1.-col)*.7);
        col *= .95 + .06*r.xxx + .06*r.xyz;

        float vign=1.;
        {
            vec2 scc=(fragCoord - .5*iResolution.xy)/iResolution.x;
            vign = 1.-.3*dot(scc,scc);
            vign*= 1.-.7*exp(-sin(fragCoord.x/iResolution.x*3.1416)*40.);
            vign*= 1.-.7*exp(-sin(fragCoord.y/iResolution.y*3.1416)*20.);
        }
        col *= clamp(vign,0.,1.);

        return vec4(col,1.0);
    }

    void main() {
      vec2 fragCoord = gl_FragCoord.xy; // same as your snippet expects
      sc = iResolution.x / 600.0;

      // 1) The “original” color from BufferA
      //    (No pencil effect)
      vec3 baseColor = texture2D(iChannel0, vUv).rgb;

      // 2) The pencil effect
      //    (this re-samples iChannel0 in the effect)
      vec4 pencilCol = pencilEffect(fragCoord);

      // 3) Blend between them
      //    uPencilFactor=1 => fully pencil
      //    uPencilFactor=0 => fully base
      vec3 finalColor = mix(baseColor, pencilCol.rgb, uPencilFactor);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

export default PencilShaderMaterial;
