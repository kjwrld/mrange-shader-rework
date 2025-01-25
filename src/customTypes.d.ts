import { BufferGeometry, Material, Mesh } from "three";
import { BufferAShader, FXAAShader } from "./components/ShaderMaterials"; // Path to your shader materials

declare global {
    namespace JSX {
        interface IntrinsicElements {
            bufferAShader: ReactThreeFiber.Object3DNode<
                BufferAShader,
                typeof BufferAShader
            >;
            bufferAShaderMaterial: ReactThreeFiber.Object3DNode<any, any>;
            fxaaShader: ReactThreeFiber.Object3DNode<
                FXAAShader,
                typeof FXAAShader
            >;
        }
    }
}
