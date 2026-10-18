import React, { useEffect, useMemo, useState } from 'react';
import {
  AnimationSlotMapping,
  RecognizedAnimation,
} from '../../services/animationClassifier';
import {
  AnimationType,
  CustomizationSettings,
  EmotionType,
  ModelTransformConfig,
  MorphTargetItem,
  PerformanceProfileConfig,
} from '../../types/character';

interface Character3DSceneProps {
  customization: CustomizationSettings;
  gender?: 'female' | 'male' | 'androgynous';
  activeAnimation?: AnimationType;
  activeEmotion?: EmotionType;
  isSpeaking?: boolean;
  cameraPreset?: 'face' | 'bust' | 'full' | 'orbit';
  customModelFile?: File | null;
  modelTransform?: ModelTransformConfig;
  morphTargetsList?: MorphTargetItem[];
  animationSlotMapping?: AnimationSlotMapping;
  playbackSpeed?: number;
  crossFadeDuration?: number;
  performanceProfile?: PerformanceProfileConfig;
  onModelLoaded?: (info: {
    name: string;
    animations: string[];
    recognizedAnimations?: RecognizedAnimation[];
    morphs?: MorphTargetItem[];
  }) => void;
  onAnimationChanged?: (anim: AnimationType) => void;
  onMorphsDetected?: (morphs: MorphTargetItem[]) => void;
}

function getFileKind(file?: File | null) {
  if (!file) return 'none';
  const name = file.name.toLowerCase();
  if (/(png|jpe?g|gif|webp|bmp|svg)$/.test(name)) return 'image';
  if (/(glb|gltf|vrm|fbx|obj)$/.test(name)) return 'model';
  return 'unknown';
}

export const Character3DScene: React.FC<Character3DSceneProps> = ({
  customization,
  customModelFile,
  onModelLoaded,
  onMorphsDetected,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [modelName, setModelName] = useState<string | null>(null);
  const [modelKind, setModelKind] = useState<'none' | 'image' | 'model' | 'unknown'>('none');

  useEffect(() => {
    const kind = getFileKind(customModelFile);
    setModelKind(kind);

    if (kind === 'image' && customModelFile) {
      const url = URL.createObjectURL(customModelFile);
      setImageUrl(url);
      setModelName(customModelFile.name);
      onModelLoaded?.({
        name: customModelFile.name,
        animations: [],
        morphs: [],
      });
      return () => URL.revokeObjectURL(url);
    }

    if (kind === 'model' && customModelFile) {
      const modelNameValue = customModelFile.name;
      setModelName(modelNameValue);
      setImageUrl(null);
      const animationNames = ['idle', 'pose', 'loop'];
      const morphs: MorphTargetItem[] = [];
      onMorphsDetected?.(morphs);
      onModelLoaded?.({
        name: modelNameValue,
        animations: animationNames,
        morphs,
      });
      return;
    }

    setImageUrl(null);
    setModelName(null);
    onModelLoaded?.({
      name: 'Sin modelo cargado',
      animations: [],
      morphs: [],
    });
    // no-op for none/unknown
  }, [customModelFile, onModelLoaded, onMorphsDetected]);

  const backgroundImage = customization?.backgroundImage || null;
  const backgroundColor = customization?.backgroundColor || '#000000';

  const displayBody = useMemo(() => {
    if (imageUrl) {
      return (
        <img
          src={imageUrl}
          alt="Avatar estático"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            pointerEvents: 'none',
          }}
        />
      );
    }

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor,
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 14,
          fontWeight: 700,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        <div style={{ textAlign: 'center', opacity: 0.95 }}>
          <div style={{ marginBottom: 8, fontSize: 13 }}>{modelKind === 'model' ? 'Modelo cargado' : 'Avatar estático'}</div>
          <div style={{ fontSize: 11, opacity: 0.8 }}>
            {modelName || 'Sin modelo cargado'}
          </div>
        </div>
      </div>
    );
  }, [backgroundColor, backgroundImage, imageUrl, modelKind, modelName]);

  return (
    <div className="relative w-full h-full select-none touch-none overflow-hidden">
      {displayBody}
    </div>
  );
};
