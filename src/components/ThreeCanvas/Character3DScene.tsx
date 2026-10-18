import React, { useEffect, useState } from 'react';
import {
  AnimationSlotMapping,
  RecognizedAnimation,
} from '../../services/animationClassifier';
import {
  AnimationType,
  CustomizationSettings,
  EmotionType,
  HardwareConfig,
  ModelTransformConfig,
  MorphTargetItem,
  PerformanceProfileConfig,
} from '../../types/character';

interface Character3DSceneProps {
  customization: CustomizationSettings;
  gender?: 'female' | 'male' | 'androgynous';
  activeAnimation: AnimationType;
  activeEmotion: EmotionType;
  isSpeaking: boolean;
  cameraPreset: 'face' | 'bust' | 'full' | 'orbit';
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

// Versión simplificada: eliminamos toda la lógica y animación de Three.js.
// Este componente ahora muestra una imagen estática (si se provee un File de imagen)
// o un placeholder visual ligero. Mantiene la misma API para que App.tsx no
// necesite cambios profundos inmediatamente.

export const Character3DScene: React.FC<Character3DSceneProps> = ({
  customization,
  customModelFile,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    // Si el usuario cargó un archivo que es una imagen, lo mostramos como avatar estático.
    if (customModelFile && customModelFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(customModelFile);
      setImageUrl(url);
      return () => {
        URL.revokeObjectURL(url);
        setImageUrl(null);
      };
    }

    setImageUrl(null);
  }, [customModelFile]);

  const bg = customization?.backgroundImage || null;
  const bgColor = customization?.backgroundColor || '#000000';

  return (
    <div className="relative w-full h-full select-none touch-none">
      {imageUrl ? (
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
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: bgColor,
            backgroundImage: bg ? `url(${bg})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: 14,
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        >
          {/* Placeholder ligero para cuando no hay imagen */}
          <div style={{ textAlign: 'center', opacity: 0.9 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Avatar estático</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>
              La animación 3D se ha desactivado. Usa una imagen estática o personaliza el fondo.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
