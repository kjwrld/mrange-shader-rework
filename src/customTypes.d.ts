import { BufferGeometry, Material, Mesh } from "three";
import { BufferAShader, FXAAShader } from "./components/ShaderMaterials"; // Path to your shader materials

declare global {
    namespace JSX {
        interface IntrinsicElements {
            bufferAShader: ReactThreeFiber.Object3DNode<
                BufferAShader,
                typeof BufferAShader
            >;
            fxaaShader: ReactThreeFiber.Object3DNode<
                FXAAShader,
                typeof FXAAShader
            >;
        }
    }
}
