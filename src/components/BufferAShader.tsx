import { extend, useFrame } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useRef, useEffect } from "react";
import gsap from "gsap";

const BufferAShaderMaterial = shaderMaterial(
    {
        iTime: 0,
        iResolution: new THREE.Vector3(
            window.innerWidth,
            window.innerHeight,
            1
        ),
        ro: new THREE.Vector3(1.3, 0.1, 8.0),
        twistAmount: 5,
        userRotation: 0.0, // New uniform for user-controlled rotation
    },
    `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
    `
    #define TIME        iTime
    #define RESOLUTION  iResolution
    #define ROT(a)      mat2(cos(a), sin(a), -sin(a), cos(a))

    uniform vec3 iResolution; // Viewport resolution (width, height, depth)
    uniform float iTime;      // Time in seconds
    uniform vec3 ro;
    uniform float twistAmount;
    uniform float userRotation;

    const float PI = acos(-1.);
    const float TAU = 2.0 * PI;
    const float PI_2 = 0.5 * PI;
    const float TOLERANCE = 1.0E-4;
    const float MAX_RAY_LENGTH = 30.;
    const float NORM_OFF = 0.005;
    const float MAX_RAY_MARCHES = 64.0;

    const vec4 hsv2rgb_K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);

    vec3 hsv2rgb(vec3 c) {
      vec3 p = abs(fract(c.xxx + hsv2rgb_K.xyz) * 6.0 - hsv2rgb_K.www);
      return c.z * mix(hsv2rgb_K.xxx, clamp(p - hsv2rgb_K.xxx, 0.0, 1.0), c.y);
    }

    #define HSV2RGB(c) (c.z * mix(hsv2rgb_K.xxx, clamp(abs(fract(c.xxx + hsv2rgb_K.xyz) * 6.0 - hsv2rgb_K.www) - hsv2rgb_K.xxx, 0.0, 1.0), c.y))

    const float hoff = 0.;
    const vec3 skyCol = HSV2RGB(vec3(hoff + 0.57, 0.70, 0.25));

    float g_anim;
    
    float rayPlane(vec3 ro, vec3 rd, vec4 p) {
      return -(dot(ro, p.xyz) + p.w) / dot(rd, p.xyz);
    }

    vec3 aces_approx(vec3 v) {
      v = max(v, 0.0);
      v *= 0.6;
      float a = 2.51;
      float b = 0.03;
      float c = 2.43;
      float d = 0.59;
      float e = 0.14;
      return clamp((v * (a * v + b)) / (v * (c * v + d) + e), 0.0, 1.0);
    }

    float box(vec2 p, vec2 b) {
      vec2 d = abs(p) - b;
      return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
    }

    float twistedBoxTorus(vec3 p, vec3 d) {
      vec2 q = vec2(length(p.xz) - d.x, p.y);
      float a = atan(p.x, p.z);
      mat2 r = ROT(a + g_anim + userRotation);
      return box(r * q, vec2(d.y)) - d.z;
    }

    float df(vec3 p) {
        vec3 p0 = p.yzx;
        float d = twistedBoxTorus(p0, vec3(2.5, 0.6, 0.075));
        return d;
    }

    float rayMarch(vec3 ro, vec3 rd) {
      float t = 0.0;
      for (int i = 0; i < int(MAX_RAY_MARCHES); ++i) {
        if (t > float(MAX_RAY_LENGTH)) break;
        float d = df(ro + rd * t);
        if (d < TOLERANCE) return t;
        t += d;
      }
      return MAX_RAY_LENGTH;
    }

    vec3 normal(vec3 pos) {
      vec2 eps = vec2(NORM_OFF, 0.0);
      return normalize(vec3(
        df(pos + eps.xyy) - df(pos - eps.xyy),
        df(pos + eps.yxy) - df(pos - eps.yxy),
        df(pos + eps.yyx) - df(pos - eps.yyx)
      ));
    }

    vec3 render0(vec3 ro, vec3 rd) {
      vec3 col = vec3(0.0);

      //  col += 1E-2 * (skyCol * skyCol) / (1.0001 + dot(rd, sunDir));

      float tp0 = rayPlane(ro, rd, vec4(vec3(0.0, -1.0, 0.0), -5.0));
      float tp1 = rayPlane(ro, rd, vec4(vec3(0.0, -1.0, 0.0), 6.0));

      if (tp0 > 0.0) {
        col += 30.85 * (skyCol) * exp(-0.5 * (length((ro + tp0 * rd).xz)));
      }

      if (tp1 > 0.0) {
        vec3 pos = ro + tp1 * rd;
        vec2 pp = pos.xz;
        float db = box(pp, vec2(5.0, 9.0)) - 10.0;

        col += vec3(4.0) * skyCol * rd.y * rd.y * smoothstep(0.25, 0.0, db);
        col += vec3(0.8) * skyCol * exp(-0.5 * max(db, 0.0));
        col += 0.25 * sqrt(skyCol) * max(-db, 0.0);
      }

      return col;
    }
      
    vec3 render1(vec3 ro, vec3 rd) {
      vec3 col = vec3(0.0);

      float te = rayMarch(ro, rd);
      if (te < MAX_RAY_LENGTH) {
        vec3 ep = ro + rd * te;
        vec3 en = normal(ep);
        vec3 er = reflect(rd, en);

        float fre = 1.0 + dot(rd, en);
        fre *= fre;
        col += skyCol * 0.125;
        col += mix(0.5, 2.0, fre) * render0(ep, er);
      } else {
        col += render0(ro, rd);
      }

      return col;
    }

    void main() {
      vec2 q = gl_FragCoord.xy / iResolution.xy; // Normalized coordinates
      vec2 p = -2.0 + 2.0 * q;                   // Remap to range [-1, 1]
      vec2 pp = p;                               // Preserve for further use
      p.x *= iResolution.x / iResolution.y;      // Adjust for aspect ratio
      g_anim = 0.125 * iTime * twistAmount;

      float fov = tan(TAU / 6.0); // Field of View
      vec3 la = vec3(0.0, 0.0, 0.0); // Look-at point
      vec3 up = vec3(0.0, 1.0, 0.0); // Up vector
      vec3 ww = normalize(la - ro);  // Forward vector
      vec3 uu = normalize(cross(up, ww)); // Right vector
      vec3 vv = cross(ww, uu); // Up vector (orthogonal)

      vec3 rd = normalize(-p.x * uu + p.y * vv + fov * ww); // Ray direction

      vec3 col = render1(ro, rd); // Render color
      // col -= 0.05 * length(pp);   // Darkening effect
      col = aces_approx(col);     // Tone mapping
      col = sqrt(col);            // Gamma correction

      gl_FragColor = vec4(col, 1.0); // Output final color
    }
  `
);

extend({ BufferAShaderMaterial });

export default function BufferA() {
    const materialRef = useRef<any>();
    const lerpedCameraPosition = useRef(new THREE.Vector3(0.1, 0.1, 8.0));
    const mousePosition = useRef({ x: 0, y: -0.5 }); // Default camera position

    // Gesture state
    const isDragging = useRef(false);
    const previousMousePosition = useRef({ x: 0, y: 0 });

    const velocityX = useRef(0.0);
    const velocityY = useRef(0.0);
    const damping = 0.95;

    // Handle mouse down
    const handlePointerDown = (event: any) => {
        isDragging.current = true;
        previousMousePosition.current = { x: event.clientX, y: event.clientY };
    };

    // Handle mouse up
    const handlePointerUp = () => {
        isDragging.current = false;
    };

    // Handle mouse move
    const handlePointerMove = (event: any) => {
        if (!isDragging.current) return;

        const deltaY = event.clientY - previousMousePosition.current.y;
        const rotationScale = Math.PI;

        // Update userRotation based on deltaX
        // Positive deltaY -> rotate one way, negative -> rotate the other
        const rotationSpeed = 0.05; // Adjust as needed
        const rotationDelta = deltaY * rotationSpeed * rotationScale;

        // Animate the userRotation with GSAP for smooth transition
        gsap.to(materialRef.current, {
            userRotation: materialRef.current.userRotation + rotationDelta,
            duration: 0.6,
            ease: "power1.out",
        });

        previousMousePosition.current = { x: event.clientX, y: event.clientY };
    };

    const onMouseMove = (event: MouseEvent) => {
        const { clientX, clientY } = event;
        mousePosition.current.x = (clientX / window.innerWidth) * 2 - 1; // Normalize to range [-1, 1]
        mousePosition.current.y = -(clientY / window.innerHeight) * 2 + 1; // Normalize to range [-1, 1]
    };

    useFrame(({ clock, size }) => {
        if (materialRef.current) {
            materialRef.current.iTime = clock.getElapsedTime();
            materialRef.current.iResolution.set(size.width, size.height, 1);
            // Lerp the camera position
            const targetPosition = new THREE.Vector3(
                mousePosition.current.x * -4, // Map mouse x to range
                mousePosition.current.y * 4, // Map mouse y to range
                10.0
            );
            lerpedCameraPosition.current.lerp(targetPosition, 0.1); // Smooth transition
            materialRef.current.ro.copy(lerpedCameraPosition.current);

            // Apply angular velocities to shader uniforms
            materialRef.current.userRotationY += velocityY.current;
            materialRef.current.userRotationX += velocityX.current;

            // Apply damping to velocities for inertia effect
            velocityY.current *= damping;
            velocityX.current *= damping;

            // Optional: Reset velocities if they are very low to prevent infinite small rotations
            if (Math.abs(velocityY.current) < 0.0001) velocityY.current = 0.0;
            if (Math.abs(velocityX.current) < 0.0001) velocityX.current = 0.0;
        }
    });

    useEffect(() => {
        window.addEventListener("pointerdown", handlePointerDown);
        window.addEventListener("pointerup", handlePointerUp);
        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("mousemove", onMouseMove);
        return () => {
            window.removeEventListener("pointerdown", handlePointerDown);
            window.removeEventListener("pointerup", handlePointerUp);
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("mousemove", onMouseMove);
        };
    }, []);

    return (
        <mesh>
            <planeGeometry args={[window.innerWidth, window.innerHeight]} />
            <bufferAShaderMaterial ref={materialRef} />
        </mesh>
    );
}
