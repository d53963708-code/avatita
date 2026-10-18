import React, { useState } from 'react';
import {
  X,
  Sliders,
  Brain,
  Box,
  Users,
  Camera,
  Shirt,
  Scissors,
  Smile,
  Crown,
  Sun,
  Palette,
  Check,
  Eye,
  Heart,
  Plus,
  Trash2,
  Download,
  Upload,
  Sparkles,
  Star,
  Play,
  FileCode,
  CheckCircle,
  Cpu,
  BookOpen,
  Wifi,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Activity,
  Gauge,
  Move3d,
} from 'lucide-react';
import {
  AccessoryType,
  AIProviderConfig,
  CharacterProfile,
  CustomizationSettings,
  HardwareConfig,
  HairstyleType,
  MemoryItem,
  ModelTransformConfig,
  MorphTargetItem,
  OutfitStyle,
  PerformanceProfileConfig,
  ScenePreset,
} from '../types/character';
import {
  AnimationSlotMapping,
  RecognizedAnimation,
} from '../services/animationClassifier';
import { MemoryManager } from '../services/memoryManager';
import { ApiClient } from '../services/apiClient';
import { AnimationStudioTab } from './drawer/AnimationStudioTab';
import { ModelCustomizerTab } from './drawer/ModelCustomizerTab';
import { PerformanceHardwareTab } from './drawer/PerformanceHardwareTab';

export type DrawerTabType =
  | 'customizer'
  | 'animation_studio'
  | 'model3d'
  | 'perf_hardware'
  | 'story_editor'
  | 'ai_provider'
  | 'memory'
  | 'characters'
  | 'camera';

interface ConfigurationDrawerProps {
  isOpen: boolean;
  initialTab?: DrawerTabType;
  character: CharacterProfile;
  characters: CharacterProfile[];
  customization: CustomizationSettings;
  memories: MemoryItem[];
  intimacyLevel: number;
  cameraPreset: 'face' | 'bust' | 'full' | 'orbit';
  aiProviderConfig: AIProviderConfig;
  currentModelName?: string;
  loadedAnimations?: string[];
  recognizedAnimations?: RecognizedAnimation[];
  animationSlotMapping?: AnimationSlotMapping;
  playbackSpeed?: number;
  crossFadeDuration?: number;
  activeAnimation?: string;
  isSpeaking?: boolean;
  modelTransform?: ModelTransformConfig;
  morphTargetsList?: MorphTargetItem[];
  performanceProfile?: PerformanceProfileConfig;
  hardwareConfig?: HardwareConfig;
  onTriggerAnimation?: (anim: string) => void;
  onUpdateSlotMapping?: (mapping: AnimationSlotMapping) => void;
  onChangePlaybackSpeed?: (speed: number) => void;
  onChangeCrossFadeDuration?: (duration: number) => void;
  onModelTransformChange?: (transform: ModelTransformConfig) => void;
  onMorphTargetChange?: (id: string, weight: number) => void;
  onResetMorphs?: () => void;
  onPerformanceProfileChange?: (profile: PerformanceProfileConfig) => void;
  onHardwareConfigChange?: (config: HardwareConfig) => void;
  onClose: () => void;
  onCustomizationChange: (updated: CustomizationSettings) => void;
  onMemoriesUpdated: (updated: MemoryItem[]) => void;
  onIntimacyUpdated: (level: number) => void;
  onSelectCharacter: (char: CharacterProfile) => void;
  onUpdateCharacterProfile: (updated: Partial<CharacterProfile>) => void;
  onAIProviderConfigChange: (updated: AIProviderConfig) => void;
  onCameraChange: (preset: 'face' | 'bust' | 'full' | 'orbit') => void;
  onSelectModelFile: (file: File) => void;
  onResetToProcedural: () => void;
}

export const ConfigurationDrawer: React.FC<ConfigurationDrawerProps> = ({
  isOpen,
  initialTab = 'customizer',
  character,
  characters,
  customization,
  memories,
  intimacyLevel,
  cameraPreset,
  aiProviderConfig,
  currentModelName,
  loadedAnimations = [],
  recognizedAnimations = [],
  animationSlotMapping,
  playbackSpeed = 1,
  crossFadeDuration = 0.35,
  activeAnimation = 'idle',
  isSpeaking = false,
  modelTransform = {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    offsetZ: 0,
    rotationY: 0,
    wireframe: false,
    colorTint: '#ffffff',
    roughnessMod: 0,
    metalnessMod: 0,
    rimIntensity: 1,
  },
  morphTargetsList = [],
  performanceProfile = {
    preset: 'ultra',
    targetFps: 60,
    pixelRatio: 2,
    shadowMapSize: 1024,
    postProcessing: true,
    particlesEnabled: true,
  },
  hardwareConfig = {
    micDeviceId: 'default',
    audioOutputDeviceId: 'default',
    cameraEnabled: false,
    autoBargeIn: true,
    vadSensitivity: 0.5,
  },
  onTriggerAnimation,
  onUpdateSlotMapping,
  onChangePlaybackSpeed = () => {},
  onChangeCrossFadeDuration = () => {},
  onModelTransformChange = () => {},
  onMorphTargetChange,
  onResetMorphs,
  onPerformanceProfileChange = () => {},
  onHardwareConfigChange = () => {},
  onClose,
  onCustomizationChange,
  onMemoriesUpdated,
  onIntimacyUpdated,
  onSelectCharacter,
  onUpdateCharacterProfile,
  onAIProviderConfigChange,
  onCameraChange,
  onSelectModelFile,
  onResetToProcedural,
}) => {
  const [activeMainTab, setActiveMainTab] = useState<DrawerTabType>(initialTab);
  const [customizerSubTab, setCustomizerSubTab] = useState<'clothing' | 'hair' | 'face' | 'accessory' | 'environment'>('clothing');
  const [fileError, setFileError] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialTab) {
      setActiveMainTab(initialTab);
    }
  }, [initialTab]);

  // AI Endpoint Testing state
  const [isTestingEndpoint, setIsTestingEndpoint] = useState(false);
  const [endpointTestResult, setEndpointTestResult] = useState<{
    success: boolean;
    latency?: number;
    message?: string;
    models?: string[];
    error?: string;
  } | null>(null);

  // Character Lore edit states
  const [charName, setCharName] = useState(character.name);
  const [charTitle, setCharTitle] = useState(character.title);
  const [charPersonality, setCharPersonality] = useState(character.personality);
  const [charScenario, setCharScenario] = useState(character.scenario);
  const [charGreeting, setCharGreeting] = useState(character.greeting);
  const [loreSavedNotice, setLoreSavedNotice] = useState(false);

  // Sync lore fields when character prop changes
  React.useEffect(() => {
    setCharName(character.name);
    setCharTitle(character.title);
    setCharPersonality(character.personality);
    setCharScenario(character.scenario);
    setCharGreeting(character.greeting);
  }, [character]);

  // Memory states
  const [memoryFilter, setMemoryFilter] = useState<'all' | MemoryItem['category']>('all');
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [newMemoryText, setNewMemoryText] = useState('');
  const [newMemoryCategory, setNewMemoryCategory] = useState<MemoryItem['category']>('preference');
  const [newMemoryImportance, setNewMemoryImportance] = useState(4);

  // 3D File Drag state
  const [dragActive, setDragActive] = useState(false);

  if (!isOpen) return null;

  const updateSetting = <K extends keyof CustomizationSettings>(
    section: K,
    values: Partial<CustomizationSettings[K]>
  ) => {
    onCustomizationChange({
      ...customization,
      [section]: {
        ...customization[section],
        ...values,
      },
    });
  };

  const handleSaveLore = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCharacterProfile({
      name: charName,
      title: charTitle,
      personality: charPersonality,
      scenario: charScenario,
      greeting: charGreeting,
    });
    setLoreSavedNotice(true);
    setTimeout(() => setLoreSavedNotice(false), 2500);
  };

  const handleTestEndpoint = async () => {
    setIsTestingEndpoint(true);
    setEndpointTestResult(null);
    const res = await ApiClient.testEndpoint(
      aiProviderConfig.endpointUrl,
      aiProviderConfig.apiKey
    );
    setEndpointTestResult(res);
    setIsTestingEndpoint(false);
  };

  const intimacyInfo = MemoryManager.getIntimacyTitle(intimacyLevel);

  const filteredMemories = memoryFilter === 'all'
    ? memories
    : memories.filter((m) => m.category === memoryFilter);

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryText.trim()) return;

    const added = MemoryManager.addMemory(character.id, newMemoryText, newMemoryCategory, newMemoryImportance);
    const updated = [added, ...memories.filter((m) => m.id !== added.id)];
    onMemoriesUpdated(updated);
    setNewMemoryText('');
    setIsAddingMemory(false);
  };

  const handleFileDrop = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const name = file.name.toLowerCase();
    if (name.endsWith('.glb') || name.endsWith('.gltf') || name.endsWith('.vrm') || name.endsWith('.obj')) {
      setFileError(null);
      onSelectModelFile(file);
    } else {
      setFileError('Formato no soportado. Selecciona un archivo .glb, .gltf, .vrm o .obj');
    }
  };

  const hairstyles: { id: HairstyleType; label: string; desc: string }[] = [
    { id: 'long_waves', label: 'Melena Ondulada', desc: 'Seda con volumen seductor' },
    { id: 'cyber_bob', label: 'Bob Cyberpunk', desc: 'Corte asimétrico con mechas neón' },
    { id: 'high_ponytail', label: 'Coleta Alta', desc: 'Cola estilizada y audaz' },
    { id: 'wild_short', label: 'Corto Rebelde', desc: 'Puntas texturizadas rebeldes' },
    { id: 'gothic_updo', label: 'Moño Gótico', desc: 'Recogido aristocrático con mechones' },
    { id: 'braided_crown', label: 'Corona Trenzada', desc: 'Doble trenza imperial' },
  ];

  const outfits: { id: OutfitStyle; label: string; desc: string }[] = [
    { id: 'scarlet_gown', label: 'Gala Escarlata', desc: 'Vestido largo con abertura lateral' },
    { id: 'cyber_leather', label: 'Cuero & Neón', desc: 'Chaqueta entallada con líneas activas' },
    { id: 'gothic_corset', label: 'Corsé Gótico', desc: 'Corsé de encaje y falda escalonada' },
    { id: 'noir_lingerie', label: 'Lencería Noir', desc: 'Diseño sensual con encaje translúcido' },
    { id: 'casual_silk', label: 'Satén Casual', desc: 'Caída fluida minimalista' },
    { id: 'combat_bodysuit', label: 'Mono Táctico', desc: 'Material ceñido reflectante de combate' },
  ];

  const accessories: { id: AccessoryType; label: string; icon: string }[] = [
    { id: 'choker_gem', label: 'Gargantilla Gema', icon: '💎' },
    { id: 'horns', label: 'Cuernos Súcubo', icon: '😈' },
    { id: 'cyber_visor', label: 'Visor Neón', icon: '🕶️' },
    { id: 'earrings', label: 'Pendientes Cristal', icon: '✨' },
    { id: 'none', label: 'Sin Accesorio', icon: '🚫' },
  ];

  const colorPresets = [
    '#800010', '#b91c1c', '#ea580c', '#eab308',
    '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6',
    '#d946ef', '#f43f5e', '#111827', '#ffffff',
  ];

  const skinPresets = ['#fff1ec', '#fceee9', '#faebd7', '#f2d0b4', '#c98a58', '#6a432d'];
  const eyePresets = ['#ff1744', '#00f0ff', '#bf55ec', '#d4af37', '#10b981', '#ffffff'];
  const lipsPresets = ['#900c3f', '#c70039', '#ff0055', '#a80028', '#8a5043', '#5c068c'];

  return (
    <>
      {/* Backdrop overlay: permite cerrar el sidebar haciendo clic en cualquier parte de la escena 3D */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity cursor-pointer animate-in fade-in"
        title="Tocar escena para cerrar sidebar"
      />

      <div className="fixed inset-y-0 left-0 z-50 w-full sm:w-[460px] max-w-full flex flex-col bg-[#111113]/98 text-[#F8F7F4] font-['Inter',sans-serif] border-r border-[rgba(255,255,255,0.12)] shadow-2xl backdrop-blur-2xl animate-in slide-in-from-left duration-250 select-none">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[rgba(255,255,255,0.08)] bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E63946] shadow-sm shadow-[#E63946]/50" />
            <h2 className="text-sm font-extrabold text-white tracking-wide flex items-center gap-2">
              <span>ANDY VR</span>
              <span className="text-[10px] font-['Space_Mono',monospace] px-2 py-0.5 rounded bg-[#E63946]/15 text-[#E63946] border border-[#E63946]/30">
                [01 // SYSTEM]
              </span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#F8F7F4]/80 text-xs font-['Space_Mono',monospace] transition"
            title="Cerrar barra lateral y liberar vista 3D"
          >
            <span>[CLOSE]</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

      {/* Main Tab Switcher (Horizontal scrollable pill dock) */}
      <div className="flex items-center gap-1 border-b border-slate-800/80 bg-slate-950/70 p-1.5 text-xs font-medium overflow-x-auto scrollbar-none shrink-0">
        <button
          onClick={() => setActiveMainTab('animation_studio')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
            activeMainTab === 'animation_studio'
              ? 'bg-violet-600/25 text-violet-300 font-semibold border border-violet-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Animación & IA</span>
        </button>

        <button
          onClick={() => setActiveMainTab('model3d')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
            activeMainTab === 'model3d'
              ? 'bg-blue-600/25 text-blue-300 font-semibold border border-blue-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>Modelo 3D</span>
        </button>

        <button
          onClick={() => setActiveMainTab('customizer')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
            activeMainTab === 'customizer'
              ? 'bg-pink-600/25 text-pink-300 font-semibold border border-pink-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Mod Ropa</span>
        </button>

        <button
          onClick={() => setActiveMainTab('perf_hardware')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
            activeMainTab === 'perf_hardware'
              ? 'bg-emerald-600/25 text-emerald-300 font-semibold border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>Rendimiento</span>
        </button>

        <button
          onClick={() => setActiveMainTab('story_editor')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
            activeMainTab === 'story_editor'
              ? 'bg-rose-600/25 text-rose-300 font-semibold border border-rose-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Rol & Historia</span>
        </button>

        <button
          onClick={() => setActiveMainTab('ai_provider')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
            activeMainTab === 'ai_provider'
              ? 'bg-cyan-600/25 text-cyan-300 font-semibold border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Motor IA</span>
        </button>

        <button
          onClick={() => setActiveMainTab('memory')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
            activeMainTab === 'memory'
              ? 'bg-purple-600/25 text-purple-300 font-semibold border border-purple-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>Memoria</span>
        </button>

        <button
          onClick={() => setActiveMainTab('camera')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
            activeMainTab === 'camera'
              ? 'bg-amber-600/25 text-amber-300 font-semibold border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Cámara VR</span>
        </button>

        <button
          onClick={() => setActiveMainTab('characters')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
            activeMainTab === 'characters'
              ? 'bg-emerald-600/25 text-emerald-300 font-semibold border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Personajes</span>
        </button>
      </div>

      {/* Drawer Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
        {/* ================= TAB 1: CUSTOMIZER ================= */}
        {activeMainTab === 'customizer' && (
          <div className="space-y-4">
            {/* Sub-tab navigation */}
            <div className="flex gap-1 overflow-x-auto scrollbar-none pb-1 text-xs">
              {[
                { id: 'clothing' as const, label: 'Vestuario', icon: Shirt },
                { id: 'hair' as const, label: 'Cabello', icon: Scissors },
                { id: 'face' as const, label: 'Rostro', icon: Smile },
                { id: 'accessory' as const, label: 'Accesorio', icon: Crown },
                { id: 'environment' as const, label: 'Escena', icon: Sun },
              ].map((sub) => {
                const Icon = sub.icon;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setCustomizerSubTab(sub.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                      customizerSubTab === sub.id
                        ? 'bg-pink-600 text-white font-medium shadow-sm'
                        : 'bg-slate-900/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{sub.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Sub-tab: CLOTHING */}
            {customizerSubTab === 'clothing' && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
                    Estilo de Vestimenta
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {outfits.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => updateSetting('clothing', { outfit: o.id })}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition ${
                          customization.clothing.outfit === o.id
                            ? 'border-pink-500 bg-pink-500/15 text-white'
                            : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-xs sm:text-sm">{o.label}</div>
                          <div className="text-[11px] text-slate-400">{o.desc}</div>
                        </div>
                        {customization.clothing.outfit === o.id && (
                          <Check className="w-4 h-4 text-pink-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary & Secondary Color */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
                    Color de la Prenda
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {colorPresets.map((c) => (
                      <button
                        key={c}
                        onClick={() => updateSetting('clothing', { primaryColor: c })}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full border-2 transition ${
                          customization.clothing.primaryColor === c ? 'border-white scale-110 shadow-md' : 'border-slate-700'
                        }`}
                      />
                    ))}
                    <input
                      type="color"
                      value={customization.clothing.primaryColor}
                      onChange={(e) => updateSetting('clothing', { primaryColor: e.target.value })}
                      className="w-6 h-6 rounded-full border-0 p-0 cursor-pointer bg-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
                    Ribete / Detalles Secundarios
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {colorPresets.map((c) => (
                      <button
                        key={c}
                        onClick={() => updateSetting('clothing', { secondaryColor: c })}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full border-2 transition ${
                          customization.clothing.secondaryColor === c ? 'border-white scale-110 shadow-md' : 'border-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Layers */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
                    Capas Desmontables
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'jacket' as const, label: 'Capa / Chaqueta' },
                      { key: 'boots' as const, label: 'Botas de Tacón' },
                      { key: 'jewelry' as const, label: 'Joyería Escote' },
                      { key: 'gloves' as const, label: 'Guantes de Seda' },
                      { key: 'aura' as const, label: 'Aura Resplandeciente' },
                    ].map((l) => {
                      const isChecked = customization.clothing.layers[l.key];
                      return (
                        <button
                          key={l.key}
                          onClick={() =>
                            updateSetting('clothing', {
                              layers: {
                                ...customization.clothing.layers,
                                [l.key]: !isChecked,
                              },
                            })
                          }
                          className={`flex items-center justify-between p-2 rounded-lg border text-xs transition ${
                            isChecked
                              ? 'border-pink-500/60 bg-pink-500/15 text-pink-300'
                              : 'border-slate-800 bg-slate-900/40 text-slate-400'
                          }`}
                        >
                          <span>{l.label}</span>
                          <span>{isChecked ? '✓' : ''}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab: HAIR */}
            {customizerSubTab === 'hair' && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
                    Estilo de Cabello
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {hairstyles.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => updateSetting('hair', { style: h.id })}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition ${
                          customization.hair.style === h.id
                            ? 'border-violet-500 bg-violet-500/15 text-white'
                            : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-xs sm:text-sm">{h.label}</div>
                          <div className="text-[11px] text-slate-400">{h.desc}</div>
                        </div>
                        {customization.hair.style === h.id && (
                          <Check className="w-4 h-4 text-violet-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
                    Color Principal
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {colorPresets.map((c) => (
                      <button
                        key={c}
                        onClick={() => updateSetting('hair', { color: c })}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full border-2 transition ${
                          customization.hair.color === c ? 'border-white scale-110 shadow-md' : 'border-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
                    Mechas / Reflejos
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {colorPresets.map((c) => (
                      <button
                        key={c}
                        onClick={() => updateSetting('hair', { secondaryColor: c })}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full border-2 transition ${
                          customization.hair.secondaryColor === c ? 'border-white scale-110 shadow-md' : 'border-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab: FACE */}
            {customizerSubTab === 'face' && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
                    Color de Ojos / Iris
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {eyePresets.map((c) => (
                      <button
                        key={c}
                        onClick={() => updateSetting('face', { eyeColor: c })}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full border-2 transition ${
                          customization.face.eyeColor === c ? 'border-white scale-110 shadow-md' : 'border-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
                    Tono de Piel
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {skinPresets.map((c) => (
                      <button
                        key={c}
                        onClick={() => updateSetting('face', { skinTone: c })}
                        style={{ backgroundColor: c }}
                        className={`w-7 h-7 rounded-full border-2 transition ${
                          customization.face.skinTone === c ? 'border-white scale-110 shadow-md' : 'border-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
                    Labial
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {lipsPresets.map((c) => (
                      <button
                        key={c}
                        onClick={() => updateSetting('face', { lipstickColor: c })}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full border-2 transition ${
                          customization.face.lipstickColor === c ? 'border-white scale-110 shadow-md' : 'border-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Intensidad de Rubor</span>
                    <span className="text-pink-400 font-mono">
                      {Math.round(customization.face.blushIntensity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={customization.face.blushIntensity}
                    onChange={(e) => updateSetting('face', { blushIntensity: parseFloat(e.target.value) })}
                    className="w-full accent-pink-500 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Sub-tab: ACCESSORY */}
            {customizerSubTab === 'accessory' && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
                    Accesorio Distintivo
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {accessories.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => updateSetting('accessory', { type: a.id })}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition ${
                          customization.accessory.type === a.id
                            ? 'border-amber-500 bg-amber-500/15 text-white'
                            : 'border-slate-800 bg-slate-900/60 text-slate-300'
                        }`}
                      >
                        <span className="text-lg">{a.icon}</span>
                        <span className="font-semibold text-xs sm:text-sm">{a.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/40">
                  <span className="text-xs font-medium text-slate-200">Resplandor Emisivo</span>
                  <button
                    onClick={() => updateSetting('accessory', { glowing: !customization.accessory.glowing })}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      customization.accessory.glowing ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {customization.accessory.glowing ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            )}

            {/* Sub-tab: ENVIRONMENT */}
            {customizerSubTab === 'environment' && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
                    Escenario Virtual
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: 'cyber_neon' as ScenePreset, label: 'Suite Neón Cyberpunk', desc: 'Resplandor futurista y lluvia exterior' },
                      { id: 'penthouse_luxury' as ScenePreset, label: 'Penthouse de Lujo', desc: 'Luces cálidas sobre la metrópolis' },
                      { id: 'crimson_dungeon' as ScenePreset, label: 'Cámara Carmesí', desc: 'Velas y fuego púrpura misterioso' },
                      { id: 'moonlit_balcony' as ScenePreset, label: 'Balcón Iluminado por la Luna', desc: 'Noche estrellada y bruma plateada' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => updateSetting('environment', { preset: p.id })}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition ${
                          customization.environment.preset === p.id
                            ? 'border-emerald-500 bg-emerald-500/15 text-white'
                            : 'border-slate-800 bg-slate-900/60 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-xs">{p.label}</div>
                          <div className="text-[11px] text-slate-400">{p.desc}</div>
                        </div>
                        {customization.environment.preset === p.id && <Check className="w-4 h-4 text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Calidez de Iluminación</span>
                    <span className="text-emerald-400 font-mono">
                      {Math.round(customization.environment.lightWarmth * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={customization.environment.lightWarmth}
                    onChange={(e) => updateSetting('environment', { lightWarmth: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: STORY & LORE EDITOR ================= */}
        {activeMainTab === 'story_editor' && (
          <form onSubmit={handleSaveLore} className="space-y-4 animate-in fade-in text-xs">
            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30">
              <span className="font-semibold text-rose-300 flex items-center gap-1.5 mb-1">
                <BookOpen className="w-4 h-4" />
                Editor de Rol, Personalidad y Contexto
              </span>
              <p className="text-[11px] text-slate-300">
                Personaliza la identidad, el tono íntimo, el universo o cualquier historia de fantasía sin censura.
              </p>
            </div>

            {loreSavedNotice && (
              <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs text-center font-medium">
                ✓ ¡Historia y personalidad guardadas con éxito!
              </div>
            )}

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Nombre del Personaje</label>
              <input
                type="text"
                value={charName}
                onChange={(e) => setCharName(e.target.value)}
                placeholder="Ej. Andy VR, Valeria, Selene..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Título o Rol</label>
              <input
                type="text"
                value={charTitle}
                onChange={(e) => setCharTitle(e.target.value)}
                placeholder="Ej. Tu Compañera Íntima de Realidad Virtual, Emperatriz Nocturna..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Personalidad & Tono de Conversación</label>
              <textarea
                value={charPersonality}
                onChange={(e) => setCharPersonality(e.target.value)}
                rows={3}
                placeholder="Describe cómo se comporta, su actitud seductora, si es atrevida, dulce, dominante o sumisa..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Contexto de la Historia / Escenario</label>
              <textarea
                value={charScenario}
                onChange={(e) => setCharScenario(e.target.value)}
                rows={3}
                placeholder="Describe dónde se encuentran y qué está ocurriendo en este universo..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Saludo Inicial</label>
              <textarea
                value={charGreeting}
                onChange={(e) => setCharGreeting(e.target.value)}
                rows={2}
                placeholder="Las primeras palabras con las que te recibe..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-semibold shadow-lg shadow-pink-500/20 transition active:scale-95"
            >
              Guardar y Aplicar Cambios de Rol
            </button>
          </form>
        )}

        {/* ================= TAB 3: AI PROVIDER & ENDPOINTS ================= */}
        {activeMainTab === 'ai_provider' && (
          <div className="space-y-4 animate-in fade-in text-xs">
            <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30">
              <span className="font-semibold text-cyan-300 flex items-center gap-1.5 mb-1">
                <Cpu className="w-4 h-4" />
                Configuración del Modelo de IA y Endpoints
              </span>
              <p className="text-[11px] text-slate-300">
                Usa modelos en la nube (Gemini) o conecta tus propios modelos locales como <strong>LM Studio</strong>, <strong>Ollama</strong>, <strong>LLaMA</strong> o cualquier API OpenAI-compatible.
              </p>
            </div>

            {/* Provider Switcher */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1.5 uppercase text-[11px]">
                Proveedor de IA Activo
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onAIProviderConfigChange({ ...aiProviderConfig, provider: 'gemini' })}
                  className={`p-3 rounded-xl border text-left transition ${
                    aiProviderConfig.provider === 'gemini'
                      ? 'border-pink-500 bg-pink-500/15 text-white'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>Nube (Gemini)</span>
                    {aiProviderConfig.provider === 'gemini' && <Check className="w-3.5 h-3.5 text-pink-400" />}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Automático, rápido y sin configurar puertos</div>
                </button>

                <button
                  onClick={() => onAIProviderConfigChange({ ...aiProviderConfig, provider: 'custom_endpoint' })}
                  className={`p-3 rounded-xl border text-left transition ${
                    aiProviderConfig.provider === 'custom_endpoint'
                      ? 'border-cyan-500 bg-cyan-500/15 text-white'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>Local / LM Studio / Ollama</span>
                    {aiProviderConfig.provider === 'custom_endpoint' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Endpoint personalizado o modelos LLaMA</div>
                </button>
              </div>
            </div>

            {/* Custom Endpoint Settings */}
            {aiProviderConfig.provider === 'custom_endpoint' && (
              <div className="space-y-3.5 p-3.5 rounded-xl border border-slate-800 bg-slate-900/50">
                {/* Quick Presets */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Preajustes Rápidos:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <button
                      onClick={() =>
                        onAIProviderConfigChange({
                          ...aiProviderConfig,
                          endpointUrl: 'http://localhost:1234/v1',
                          modelName: 'local-model',
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-[11px]"
                    >
                      LM Studio (:1234)
                    </button>
                    <button
                      onClick={() =>
                        onAIProviderConfigChange({
                          ...aiProviderConfig,
                          endpointUrl: 'http://localhost:11434/v1',
                          modelName: 'llama3',
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 font-mono text-[11px]"
                    >
                      Ollama (:11434)
                    </button>
                    <button
                      onClick={() =>
                        onAIProviderConfigChange({
                          ...aiProviderConfig,
                          endpointUrl: 'http://localhost:8000/v1',
                          modelName: 'vllm-model',
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 font-mono text-[11px]"
                    >
                      vLLM (:8000)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">URL del Endpoint API</label>
                  <input
                    type="text"
                    value={aiProviderConfig.endpointUrl}
                    onChange={(e) =>
                      onAIProviderConfigChange({
                        ...aiProviderConfig,
                        endpointUrl: e.target.value,
                      })
                    }
                    placeholder="http://localhost:1234/v1"
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-500">
                    Compatible con cualquier servidor OpenAI format (/v1/chat/completions)
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nombre del Modelo</label>
                  <input
                    type="text"
                    value={aiProviderConfig.modelName}
                    onChange={(e) =>
                      onAIProviderConfigChange({
                        ...aiProviderConfig,
                        modelName: e.target.value,
                      })
                    }
                    placeholder="Ej. meta-llama-3-8b-instruct, local-model..."
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    API Key / Token Bearer (Opcional)
                  </label>
                  <input
                    type="password"
                    value={aiProviderConfig.apiKey || ''}
                    onChange={(e) =>
                      onAIProviderConfigChange({
                        ...aiProviderConfig,
                        apiKey: e.target.value,
                      })
                    }
                    placeholder="Solo si tu endpoint requiere autenticación..."
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Temperatura / Creatividad</span>
                    <span className="text-cyan-400 font-mono">{aiProviderConfig.temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="1.5"
                    step="0.05"
                    value={aiProviderConfig.temperature}
                    onChange={(e) =>
                      onAIProviderConfigChange({
                        ...aiProviderConfig,
                        temperature: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                {/* Connection Test Button */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleTestEndpoint}
                    disabled={isTestingEndpoint}
                    className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/50 text-cyan-200 font-semibold transition"
                  >
                    {isTestingEndpoint ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Probando conexión...</span>
                      </>
                    ) : (
                      <>
                        <Wifi className="w-3.5 h-3.5" />
                        <span>Probar Conexión con Endpoint</span>
                      </>
                    )}
                  </button>

                  {endpointTestResult && (
                    <div
                      className={`p-2.5 rounded-lg border text-xs mt-2 ${
                        endpointTestResult.success
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                          : 'bg-red-950/40 border-red-500/40 text-red-300'
                      }`}
                    >
                      <div className="font-semibold flex items-center gap-1.5">
                        {endpointTestResult.success ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
                        {endpointTestResult.success ? 'Conexión Exitosa' : 'Fallo de Conexión'}
                      </div>
                      <p className="mt-0.5 text-[11px] leading-relaxed">
                        {endpointTestResult.message || endpointTestResult.error}
                      </p>
                      {endpointTestResult.models && endpointTestResult.models.length > 0 && (
                        <div className="mt-1 pt-1 border-t border-emerald-500/20 text-[10px]">
                          Modelos detectados: {endpointTestResult.models.slice(0, 4).join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: MEMORY ================= */}
        {activeMainTab === 'memory' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Intimacy Bar */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-950/40 to-pink-950/40 border border-slate-800">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-pink-300 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
                  {intimacyInfo.title}
                </span>
                <span className="font-mono text-pink-400">{intimacyLevel}%</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-tight mb-2">{intimacyInfo.desc}</p>
              <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  style={{ width: `${intimacyLevel}%` }}
                />
              </div>
            </div>

            {/* Actions: Add, Export, Import */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <button
                onClick={() => setIsAddingMemory(!isAddingMemory)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-medium transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Recuerdo</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const data = MemoryManager.exportData(character.id);
                    const blob = new Blob([data], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `andy_vr_memoria_${character.id}.json`;
                    a.click();
                  }}
                  className="p-1.5 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800"
                  title="Exportar JSON"
                >
                  <Download className="w-3.5 h-3.5 text-purple-400" />
                </button>
                <label className="p-1.5 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const r = new FileReader();
                      r.onload = (ev) => {
                        const success = MemoryManager.importData(character.id, ev.target?.result as string);
                        if (success) {
                          onMemoriesUpdated(MemoryManager.getMemories(character.id));
                          onIntimacyUpdated(MemoryManager.getIntimacy(character.id));
                        }
                      };
                      r.readAsText(file);
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Add Form */}
            {isAddingMemory && (
              <form onSubmit={handleAddMemory} className="p-3 rounded-xl border border-slate-800 bg-slate-900/90 space-y-2 text-xs">
                <textarea
                  value={newMemoryText}
                  onChange={(e) => setNewMemoryText(e.target.value)}
                  placeholder={`Escribe un gusto, tema o recuerdo íntimo con ${character.name}...`}
                  rows={2}
                  className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
                />
                <div className="flex items-center justify-between">
                  <select
                    value={newMemoryCategory}
                    onChange={(e) => setNewMemoryCategory(e.target.value as any)}
                    className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-200 text-[11px]"
                  >
                    <option value="preference">Preferencia</option>
                    <option value="topic">Tema</option>
                    <option value="interaction">Interacción</option>
                    <option value="secret">Secreto</option>
                  </select>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-semibold"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            )}

            {/* List */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filteredMemories.map((m) => (
                <div
                  key={m.id}
                  className="flex items-start justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 text-xs gap-2"
                >
                  <div className="space-y-0.5 flex-1">
                    <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">
                      [{m.category}]
                    </span>
                    <p className="text-slate-200">{m.content}</p>
                  </div>
                  <button
                    onClick={() => {
                      const updated = MemoryManager.removeMemory(character.id, m.id);
                      onMemoriesUpdated(updated);
                    }}
                    className="text-slate-500 hover:text-red-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 5: CAMERA VR ================= */}
        {activeMainTab === 'camera' && (
          <div className="space-y-4 animate-in fade-in text-xs">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
                Enfoque y Vistas de Cámara
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  {
                    id: 'full' as const,
                    label: 'Cuerpo Completo (Recomendado Móvil)',
                    desc: 'Encuadra la silueta completa de pies a cabeza con proporciones ideales.',
                  },
                  {
                    id: 'bust' as const,
                    label: 'Plano Medio / Busto',
                    desc: 'Enfoque cinematográfico en torso, vestimenta y hombros.',
                  },
                  {
                    id: 'face' as const,
                    label: 'Primer Plano / Rostro',
                    desc: 'Acercamiento íntimo para observar expresiones, guiños y labios.',
                  },
                  {
                    id: 'orbit' as const,
                    label: 'Órbita Libre 360°',
                    desc: 'Rotación panorámica para explorar el escenario en cualquier ángulo.',
                  },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onCameraChange(c.id)}
                    className={`flex items-start justify-between p-3 rounded-xl border text-left transition ${
                      cameraPreset === c.id
                        ? 'border-pink-500 bg-pink-500/15 text-white'
                        : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs sm:text-sm">{c.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{c.desc}</div>
                    </div>
                    {cameraPreset === c.id && <Check className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 space-y-1.5 text-slate-400">
              <span className="font-semibold text-slate-300">Controles Táctiles VR en Teléfono:</span>
              <ul className="list-disc list-inside space-y-0.5 pl-1 text-[11px]">
                <li><strong>Un dedo:</strong> Desliza para rotar el modelo en 360°.</li>
                <li><strong>Dos dedos (Pellizco):</strong> Acerca o aleja la cámara suavemente.</li>
                <li><strong>Botón Ocultar:</strong> Cierra este panel para disfrutar la vista libre.</li>
              </ul>
            </div>
          </div>
        )}

        {/* ================= TAB: ANIMATION STUDIO & RECOGNITION ================= */}
        {activeMainTab === 'animation_studio' && (
          <AnimationStudioTab
            currentModelName={currentModelName}
            loadedAnimations={loadedAnimations}
            recognizedAnimations={recognizedAnimations}
            animationSlotMapping={animationSlotMapping}
            playbackSpeed={playbackSpeed}
            crossFadeDuration={crossFadeDuration}
            activeAnimation={activeAnimation}
            isSpeaking={isSpeaking}
            onTriggerAnimation={onTriggerAnimation}
            onUpdateSlotMapping={onUpdateSlotMapping}
            onChangePlaybackSpeed={onChangePlaybackSpeed}
            onChangeCrossFadeDuration={onChangeCrossFadeDuration}
          />
        )}

        {/* ================= TAB: MODEL 3D CUSTOMIZER & MORPHS ================= */}
        {activeMainTab === 'model3d' && (
          <ModelCustomizerTab
            currentModelName={currentModelName}
            modelTransform={modelTransform}
            morphTargetsList={morphTargetsList}
            onModelTransformChange={onModelTransformChange}
            onMorphTargetChange={onMorphTargetChange}
            onResetMorphs={onResetMorphs}
            onSelectModelFile={onSelectModelFile}
            onResetToProcedural={onResetToProcedural}
          />
        )}

        {/* ================= TAB: PERFORMANCE & HARDWARE ================= */}
        {activeMainTab === 'perf_hardware' && (
          <PerformanceHardwareTab
            performanceProfile={performanceProfile}
            hardwareConfig={hardwareConfig}
            onPerformanceProfileChange={onPerformanceProfileChange}
            onHardwareConfigChange={onHardwareConfigChange}
          />
        )}

        {/* ================= TAB 7: CHARACTERS ================= */}
        {activeMainTab === 'characters' && (
          <div className="space-y-3 animate-in fade-in">
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
              Seleccionar Rol / Personaje
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {characters.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelectCharacter(c)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                    c.id === character.id
                      ? 'border-emerald-500 bg-emerald-500/15 text-white'
                      : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="text-2xl">{c.avatarThumb}</span>
                  <div className="flex-1">
                    <div className="font-bold text-sm flex items-center justify-between">
                      <span>{c.name}</span>
                      {c.id === character.id && <Check className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <div className="text-xs text-pink-400 font-medium">{c.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{c.scenario}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Drawer Footer */}
      <div className="px-4 py-3 border-t border-[rgba(255,255,255,0.08)] bg-white/[0.02] flex items-center justify-between text-xs shrink-0 font-['Space_Mono',monospace]">
        <span className="text-[#F8F7F4]/50">[01 // ANDY VR]</span>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-[#E63946] hover:bg-[#d62839] text-white font-bold tracking-wider shadow-lg shadow-[#E63946]/20 transition active:scale-95 text-xs"
        >
          [APLICAR Y CERRAR]
        </button>
      </div>
      </div>
    </>
  );
};
