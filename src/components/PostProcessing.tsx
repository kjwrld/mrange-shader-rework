import { EffectComposer, ToneMapping, FXAA } from "@react-three/postprocessing";

const PostProcessing: React.FC = () => {
    return (
        <EffectComposer>
            <ToneMapping
                adaptive={false}
                resolution={256}
                middleGrey={0.5}
                maxLuminance={16.0}
                averageLuminance={0.3}
                adaptationRate={1.0}
            />
            <FXAA />
        </EffectComposer>
    );
};

export default PostProcessing;
