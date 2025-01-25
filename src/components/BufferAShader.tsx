import { useRef } from "react";
import { extend, useFrame } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { useControls } from "leva";
import * as THREE from "three";

// GLSL shader for BufferA
const BufferAShader = shaderMaterial(
    {
        iTime: 0,
        iResolution: new THREE.Vector3(
            window.innerWidth,
            window.innerHeight,
            1
        ),
        twistAmount: 0.0,
        boxSize: new THREE.Vector2(0.5, 0.5),
        torusRadius: 2.5,
        torusPosition: new THREE.Vector3(0.0, 0.0, 0.0),
        torusRotation: new THREE.Vector3(0.0, 0.0, 0.0),
        sunDir: new THREE.Vector3(0.0, 0.0, 1.0),
        groundPosition: -5.0,
        ceilingPosition: 6.0,
        reflectionStrength: 1.0,
        skyHue: 0.57,
        skySaturation: 0.7,
        skyValue: 0.25,
        hoff: 0.0,
    },
    `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    `
  uniform float iTime;
  uniform vec3 iResolution;
  uniform float twistAmount;
  uniform vec2 boxSize;
  uniform float torusRadius;
  uniform vec3 torusPosition;
  uniform vec3 torusRotation;
  uniform vec3 sunDir;
  uniform float groundPosition;
  uniform float ceilingPosition;
  uniform float reflectionStrength;
  uniform float skyHue;
  uniform float skySaturation;
  uniform float skyValue;
  uniform float hoff;

  #define TIME iTime
  #define RESOLUTION iResolution
  #define ROT(a) mat2(cos(a), sin(a), -sin(a), cos(a))

  const float PI = 3.14159265359;
  const float TOLERANCE = 1.0E-4;
  const float MAX_RAY_LENGTH = 20.0;
  const float NORM_OFF = 0.005;

  const vec4 hsv2rgb_K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);

  vec3 hsv2rgb(vec3 c) {
      vec3 p = abs(fract(c.xxx + hsv2rgb_K.xyz) * 6.0 - hsv2rgb_K.www);
      return c.z * mix(hsv2rgb_K.xxx, clamp(p - hsv2rgb_K.xxx, 0.0, 1.0), c.y);
  }

  float rayPlane(vec3 ro, vec3 rd, vec4 p) {
      return -(dot(ro, p.xyz) + p.w) / dot(rd, p.xyz);
  }

  mat3 rotationMatrix(vec3 angles) {
      float cx = cos(angles.x), sx = sin(angles.x);
      float cy = cos(angles.y), sy = sin(angles.y);
      float cz = cos(angles.z), sz = sin(angles.z);

      return mat3(
          cy * cz, cz * sx * sy - cx * sz, cx * cz * sy + sx * sz,
          cy * sz, cx * cz + sx * sy * sz, -cz * sx + cx * sy * sz,
          -sy, cy * sx, cx * cy
      );
  }

  float box(vec2 p, vec2 b) {
      vec2 d = abs(p) - b;
      return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
  }

  float twistedBoxTorus(vec3 p, float twist, vec2 boxDims, float radius) {
      p -= torusPosition;
      p = rotationMatrix(torusRotation) * p;

      vec2 q = vec2(length(p.xz) - radius, p.y);
      float angle = atan(p.x, p.z) + twist * iTime;
      mat2 rot = ROT(angle);
      return box(rot * q, boxDims);
  }

  float rayMarch(vec3 ro, vec3 rd) {
      float t = 0.0;
      for (int i = 0; i < 100; i++) {
          vec3 p = ro + rd * t;
          float d = twistedBoxTorus(p, twistAmount, boxSize, torusRadius);
          if (d < TOLERANCE) return t;
          t += d;
          if (t > MAX_RAY_LENGTH) break;
      }
      return t;
  }

  vec3 normal(vec3 p) {
      vec2 e = vec2(NORM_OFF, 0.0);
      return normalize(vec3(
          twistedBoxTorus(p + e.xyy, twistAmount, boxSize, torusRadius) - twistedBoxTorus(p - e.xyy, twistAmount, boxSize, torusRadius),
          twistedBoxTorus(p + e.yxy, twistAmount, boxSize, torusRadius) - twistedBoxTorus(p - e.yxy, twistAmount, boxSize, torusRadius),
          twistedBoxTorus(p + e.yyx, twistAmount, boxSize, torusRadius) - twistedBoxTorus(p - e.yyx, twistAmount, boxSize, torusRadius)
      ));
  }

  vec3 render(vec3 ro, vec3 rd) {
      float t = rayMarch(ro, rd);
      vec3 skyCol = hsv2rgb(vec3(hoff + skyHue, skySaturation, skyValue));
      vec3 col = skyCol;

      float groundT = rayPlane(ro, rd, vec4(0.0, 1.0, 0.0, groundPosition));
      float ceilingT = rayPlane(ro, rd, vec4(0.0, -1.0, 0.0, ceilingPosition));

      if (t < MAX_RAY_LENGTH) {
          vec3 p = ro + rd * t;
          vec3 n = normal(p);
          float diff = max(dot(n, sunDir), 0.0);
          col = mix(vec3(0.2, 0.3, 0.8), vec3(1.0, 0.8, 0.5), diff);
      }

      if (groundT > 0.0) {
          vec3 p = ro + rd * groundT;
          col += reflectionStrength * hsv2rgb(vec3(0.6, 0.3, 0.7)) * max(dot(p, sunDir), 0.0);
      }

      if (ceilingT > 0.0) {
          col += reflectionStrength * hsv2rgb(vec3(0.2, 0.8, 0.9));
      }

      return col;
  }

  void main() {
      vec2 uv = gl_FragCoord.xy / RESOLUTION.xy;
      uv = uv * 2.0 - 1.0;
      uv.x *= RESOLUTION.x / RESOLUTION.y;

      vec3 ro = vec3(uv, 5.0);
      vec3 rd = vec3(0.0, 0.0, -1.0);

      vec3 color = render(ro, rd);
      gl_FragColor = vec4(color, 1.0);
  }
  `
);

extend({ BufferAShader });

const BufferA: React.FC = () => {
    const materialRef = useRef<any>();
    const meshRef = useRef<THREE.Mesh>(null);

    // Add Leva controls
    const {
        twistAmount,
        boxSize,
        torusRadius,
        torusPosition,
        torusRotation,
        sunDir,
        groundPosition,
        ceilingPosition,
        reflectionStrength,
        skyHue,
        skySaturation,
        skyValue,
        hoff,
    } = useControls({
        twistAmount: { value: 0.1, min: -5.0, max: 5.0, step: 0.1 },
        boxSize: { value: { x: 0.2, y: 0.2 }, min: 0.1, max: 2.0, step: 0.1 },
        torusRadius: { value: 1.25, min: 1.0, max: 5.0, step: 0.1 },
        torusPosition: {
            value: { x: 1.0, y: 1.0, z: 0.0 },
            min: -5.0,
            max: 5.0,
            step: 0.1,
        },
        torusRotation: {
            value: { x: 1.6, y: 0.0, z: 0.0 },
            min: -Math.PI,
            max: Math.PI,
            step: 0.1,
        },
        sunDir: {
            value: { x: 0.0, y: 0.0, z: 1.0 },
            min: -1.0,
            max: 1.0,
            step: 0.1,
        },
        groundPosition: { value: -5.0, min: -10.0, max: 0.0, step: 0.1 },
        ceilingPosition: { value: 6.0, min: 0.0, max: 10.0, step: 0.1 },
        reflectionStrength: { value: 1.0, min: 0.0, max: 2.0, step: 0.1 },
        skyHue: { value: 0.57, min: 0.0, max: 1.0, step: 0.01 },
        skySaturation: { value: 0.7, min: 0.0, max: 1.0, step: 0.01 },
        skyValue: { value: 0.25, min: 0.0, max: 1.0, step: 0.01 },
        hoff: { value: 0.0, min: 0.0, max: 1.0, step: 0.01 },
    });

    useFrame(({ clock, size }) => {
        if (materialRef.current) {
            materialRef.current.iTime = clock.getElapsedTime();
            materialRef.current.iResolution.set(size.width, size.height, 1);
            materialRef.current.twistAmount = twistAmount;
            materialRef.current.boxSize.set(boxSize.x, boxSize.y);
            materialRef.current.torusRadius = torusRadius;
            materialRef.current.torusPosition.set(
                torusPosition.x,
                torusPosition.y,
                torusPosition.z
            );
            materialRef.current.torusRotation.set(
                torusRotation.x,
                torusRotation.y,
                torusRotation.z
            );
            materialRef.current.sunDir.set(sunDir.x, sunDir.y, sunDir.z);
            materialRef.current.groundPosition = groundPosition;
            materialRef.current.ceilingPosition = ceilingPosition;
            materialRef.current.reflectionStrength = reflectionStrength;
            materialRef.current.skyHue = skyHue;
            materialRef.current.skySaturation = skySaturation;
            materialRef.current.skyValue = skyValue;
            materialRef.current.hoff = hoff;
        }
    });

    return (
        <mesh ref={meshRef}>
            <planeGeometry args={[10, 10]} />
            <bufferAShader ref={materialRef} />
        </mesh>
    );
};

export default BufferA;
