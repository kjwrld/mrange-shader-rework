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
        twistAmount: 0.0, // Twist angle
        boxSize: new THREE.Vector2(0.5, 0.5), // Box dimensions
        torusRadius: 2.5, // Radius of the torus
        torusPosition: new THREE.Vector3(0.0, 0.0, 0.0), // Position of the torus
        torusRotation: new THREE.Vector3(0.0, 0.0, 0.0), // Rotation of the torus
        startColor: new THREE.Color(0xff0000), // Start color for gradient (red)
        endColor: new THREE.Color(0x0000ff), // End color for gradient (blue)
    },
    `
  void main() {
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
  uniform vec3 startColor;
  uniform vec3 endColor;

  const float TOLERANCE = 1.0E-4;
  const float MAX_RAY_LENGTH = 20.0;

  vec3 calculateColor(vec3 pos, float t) {
    float gradientFactor = (sin(t + pos.x * 2.0 + pos.y * 2.0) + 1.0) / 2.0;
    return mix(startColor, endColor, gradientFactor);
  }

  float box(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
  }

  mat3 rotationMatrix(vec3 angles) {
    float cx = cos(angles.x);
    float cy = cos(angles.y);
    float cz = cos(angles.z);
    float sx = sin(angles.x);
    float sy = sin(angles.y);
    float sz = sin(angles.z);

    return mat3(
      cy * cz, cz * sx * sy - cx * sz, cx * cz * sy + sx * sz,
      cy * sz, cx * cz + sx * sy * sz, -cz * sx + cx * sy * sz,
      -sy, cy * sx, cx * cy
    );
  }

  float twistedBoxTorus(vec3 p, float twist, vec2 boxDims, float radius) {
    p -= torusPosition;
    p = rotationMatrix(torusRotation) * p;

    vec2 q = vec2(length(p.xz) - radius, p.y);
    float angle = atan(p.x, p.z) + twist * iTime;
    mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
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

  void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    uv = uv * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;

    vec3 ro = vec3(uv, 5.0);
    vec3 rd = vec3(0.0, 0.0, -1.0);

    float t = rayMarch(ro, rd);
    vec3 color = vec3(0.85);
    if (t < MAX_RAY_LENGTH) {
      vec3 hitPos = ro + rd * t;
      color = calculateColor(hitPos, iTime);
    }

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
        startColor,
        endColor,
    } = useControls({
        twistAmount: {
            value: 0.1,
            min: -5.0,
            max: 5.0,
            step: 0.1,
            label: "Twist Amount",
        },
        boxSize: {
            value: { x: 0.2, y: 0.2 },
            min: 0.1,
            max: 2.0,
            step: 0.1,
            label: "Box Dimensions",
        },
        torusRadius: {
            value: 1.25,
            min: 1.0,
            max: 5.0,
            step: 0.1,
            label: "Torus Radius",
        },
        torusPosition: {
            value: { x: 1.0, y: 1.0, z: 0.0 },
            min: -5.0,
            max: 5.0,
            step: 0.1,
            label: "Torus Position",
        },
        torusRotation: {
            value: { x: 1.6, y: 0.0, z: 0.0 },
            min: -Math.PI,
            max: Math.PI,
            step: 0.1,
            label: "Torus Rotation",
        },
        startColor: {
            value: "#ff0000",
            label: "Start Color",
        },
        endColor: {
            value: "#0000ff",
            label: "End Color",
        },
    });

    // Update shader uniforms dynamically
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
            materialRef.current.startColor.set(new THREE.Color(startColor));
            materialRef.current.endColor.set(new THREE.Color(endColor));
        }

        // Dynamically adjust plane size
        if (meshRef.current) {
            const aspect = size.width / size.height;
            meshRef.current.scale.set(aspect * 2, 2, 1);
        }
    });

    return (
        <mesh ref={meshRef}>
            <planeGeometry args={[5, 5]} />
            <bufferAShader ref={materialRef} />
        </mesh>
    );
};

export default BufferA;
