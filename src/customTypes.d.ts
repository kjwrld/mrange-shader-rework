import { BufferGeometry, Material, Mesh } from "three";
import { BufferAShaderMaterial } from "./components/BufferAShader";
import { FXAAShaderMaterial } from "./components/FXAAShader";

declare global {
    namespace JSX {
        interface IntrinsicElements {
            bufferAShaderMaterial: ReactThreeFiber.Object3DNode<
                BufferAShaderMaterial,
                typeof BufferAShaderMaterial
            >;
            fXAAShaderMaterial: ReactThreeFiber.Object3DNode<
                FXAAShaderMaterial,
                typeof FXAAShaderMaterial
            >;
        }
    }
}
