import { BufferGeometry, Material, Mesh } from "three";
import { BufferAShaderMaterial } from "./components/BufferAShader";

declare global {
    namespace JSX {
        interface IntrinsicElements {
            bufferAShaderMaterial: ReactThreeFiber.Object3DNode<
                BufferAShaderMaterial,
                typeof BufferAShaderMaterial
            >;
        }
    }
}
