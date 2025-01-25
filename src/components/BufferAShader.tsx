import { useRef, useEffect } from "react";
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
        spherePosition: new THREE.Vector3(10.0, 1.0, 0.0), // Sphere's position
        sphereRadius: 0.5, // Sphere's size
    },
    `
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
    `
  uniform float iTime;
  uniform vec3 iResolution;
  uniform vec3 spherePosition;
  uniform float sphereRadius;

  #define TIME iTime
  #define RESOLUTION iResolution

  const float TOLERANCE = 1.0E-4;
  const float MAX_RAY_LENGTH = 20.0;

  // Colors for the background and sphere
  const vec3 backgroundColor = vec3(0.85); // Light gray
  const vec3 sphereColor = vec3(0.25);    // Dark gray

  float sphere(vec3 p, float radius) {
    return length(p - spherePosition) - radius; // Offset sphere by spherePosition
  }

  float rayMarch(vec3 ro, vec3 rd) {
    float t = 0.0;
    for (float i = 0.0; i < 40.0; i++) {
      float d = sphere(ro + rd * t, sphereRadius); // Use sphereRadius
      if (d < TOLERANCE) return t;
      t += d;
      if (t > MAX_RAY_LENGTH) break;
    }
    return t;
  }

  void main() {
    // Orthographic UV calculation
    vec2 uv = gl_FragCoord.xy / RESOLUTION.xy;  // Normalize to [0,1]
    uv = uv * 2.0 - 1.0;                       // Transform to [-1,1]
    uv.x *= RESOLUTION.x / RESOLUTION.y;       // Adjust for aspect ratio

    vec3 ro = vec3(uv, 5.0);                   // Ray origin (orthographic camera)
    vec3 rd = vec3(0.0, 0.0, -1.0);            // Ray direction (parallel rays)

    float t = rayMarch(ro, rd);                // Perform ray marching
    vec3 color = backgroundColor;              // Default to background color
    if (t < MAX_RAY_LENGTH) {
      color = sphereColor;                     // Sphere color for hit points
    }

    gl_FragColor = vec4(color, 1.0);           // Output final color
  }
  `
);

extend({ BufferAShader });

const BufferA: React.FC = () => {
    const materialRef = useRef<any>();
    const meshRef = useRef<THREE.Mesh>(null);
    const mouseRef = useRef({ x: 0, y: 0 });

    // Leva controls
    const { sphereRadius, spherePosition } = useControls({
        sphereRadius: {
            value: 0.5,
            min: 0.1,
            max: 2.0,
            step: 0.1,
            label: "Sphere Radius",
        },
        spherePosition: {
            value: { x: 1.0, y: 1.0, z: 0.0 },
            step: 0.1,
            label: "Sphere Position",
        },
    });

    // Track mouse movements
    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            const { innerWidth, innerHeight } = window;
            mouseRef.current.x = (event.clientX / innerWidth) * 2 - 1;
            mouseRef.current.y = -(event.clientY / innerHeight) * 2 + 1;
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    useFrame(({ clock, size }) => {
        if (materialRef.current) {
            materialRef.current.iTime = clock.getElapsedTime(); // Update time
            materialRef.current.iResolution.set(size.width, size.height, 1); // Update resolution
            materialRef.current.sphereRadius = sphereRadius; // Update sphere radius

            // Dynamically update sphere position based on mouse movements
            const aspect = size.width / size.height;
            const adjustedSpherePosition = {
                x: spherePosition.x * aspect, // Scale by aspect ratio
                y: spherePosition.y, // Keep Y unchanged
                z: spherePosition.z, // Keep Z unchanged
            };

            materialRef.current.sphereRadius = sphereRadius; // Update sphere radius
            materialRef.current.spherePosition.set(
                adjustedSpherePosition.x,
                adjustedSpherePosition.y,
                adjustedSpherePosition.z
            );
        }

        // Dynamically adjust the plane size
        if (meshRef.current) {
            const aspect = size.width / size.height;
            meshRef.current.scale.set(aspect * 2, 2, 1); // Adjust plane size dynamically
        }
    });

    return (
        <mesh ref={meshRef} onPointerOver={(e) => e.stopPropagation()}>
            {" "}
            {/* Prevent interaction */}
            <planeGeometry args={[5, 5]} />
            <bufferAShader ref={materialRef} />
        </mesh>
    );
};

export default BufferA;
