export type AnimationType =
  | 'idle'
  | 'flirt'
  | 'tease'
  | 'whisper'
  | 'laugh'
  | 'sensual_sway'
  | 'kiss_wink'
  | 'dance'
  | 'proud'
  | 'angry'
  | (string & {});

export type EmotionType =
  | 'seductive'
  | 'smiling'
  | 'smirk'
  | 'blush'
  | 'intense'
  | 'playful'
  | 'serious';

export type HairstyleType =
  | 'long_waves'
  | 'cyber_bob'
  | 'high_ponytail'
  | 'wild_short'
  | 'gothic_updo'
  | 'braided_crown';

export type OutfitStyle =
  | 'scarlet_gown'
  | 'cyber_leather'
  | 'gothic_corset'
  | 'noir_lingerie'
  | 'casual_silk'
  | 'combat_bodysuit';

export type AccessoryType =
  | 'choker_gem'
  | 'horns'
  | 'cyber_visor'
  | 'earrings'
  | 'runes'
  | 'none';

export type ScenePreset =
  | 'penthouse_luxury'
  | 'cyber_neon'
  | 'crimson_dungeon'
  | 'moonlit_balcony';

export interface CustomizationSettings {
  hair: {
    style: HairstyleType;
    color: string;
    secondaryColor: string;
    roughness: number;
    metalness: number;
  };
  face: {
    eyeColor: string;
    blushIntensity: number; // 0 to 1
    skinTone: string;
    lipstickColor: string;
    expression: EmotionType;
  };
  clothing: {
    outfit: OutfitStyle;
    primaryColor: string;
    secondaryColor: string;
    metalness: number;
    roughness: number;
    layers: {
      jacket: boolean;
      boots: boolean;
      jewelry: boolean;
      gloves: boolean;
      aura: boolean;
    };
  };
  accessory: {
    type: AccessoryType;
    color: string;
    glowing: boolean;
  };
  environment: {
    preset: ScenePreset;
    lightWarmth: number; // 0 (cold blue) to 1 (warm amber)
    fogDensity: number;
    bloom: boolean;
  };
}

export interface MemoryItem {
  id: string;
  timestamp: number;
  category: 'preference' | 'topic' | 'interaction' | 'secret';
  content: string;
  importance: number; // 1 to 5
}

export interface CharacterProfile {
  id: string;
  name: string;
  title: string;
  avatarThumb: string;
  personality: string;
  scenario: string;
  voiceName: 'Kore' | 'Puck' | 'Fenrir' | 'Zephyr' | 'Charon';
  gender: 'female' | 'male' | 'androgynous';
  customModelUrl?: string;
  customModelName?: string;
  defaultCustomization: CustomizationSettings;
  greeting: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'model';
  text: string;
  timestamp: number;
  animation?: AnimationType;
  emotion?: EmotionType;
  audioUrl?: string;
  imageUrl?: string;
}

export interface AIProviderConfig {
  provider: 'gemini' | 'custom_endpoint';
  endpointUrl: string;
  apiKey?: string;
  modelName: string;
  temperature: number;
  systemPromptOverride?: string;
}

export interface ModelTransformConfig {
  scale: number;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  rotationY: number;
  wireframe: boolean;
  colorTint: string;
  roughnessMod: number;
  metalnessMod: number;
  rimIntensity: number;
}

export interface MorphTargetItem {
  id: string;
  name: string;
  meshName: string;
  index: number;
  weight: number;
  category: 'mouth' | 'eyes' | 'brows' | 'other';
}

export interface PerformanceProfileConfig {
  preset: 'ultra' | 'balanced' | 'eco';
  targetFps: number;
  pixelRatio: number;
  shadowMapSize: number;
  postProcessing: boolean;
  particlesEnabled: boolean;
}

export interface HardwareConfig {
  micDeviceId: string;
  audioOutputDeviceId: string;
  cameraEnabled: boolean;
  autoBargeIn: boolean; // Cut avatar speech instantly when user talks
  vadSensitivity: number; // 0 to 1
}

