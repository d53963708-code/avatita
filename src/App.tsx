import React, { useEffect, useRef, useState } from 'react';
import { CHARACTERS } from './data/characters';
import {
  CharacterProfile,
  ChatMessage,
  CustomizationSettings,
  EmotionType,
  HardwareConfig,
  MemoryItem,
  ModelTransformConfig,
  PerformanceProfileConfig,
} from './types/character';
import { MemoryManager } from './services/memoryManager';
import { ApiClient } from './services/apiClient';
import { Character3DScene } from './components/ThreeCanvas/Character3DScene';
import { ChatOverlay } from './components/ChatOverlay';
import { ConfigurationDrawer, DrawerTabType } from './components/ConfigurationDrawer';
import { PWAInstallButton } from './components/PWAInstallButton';
import { WifiOff } from 'lucide-react';

export default function App() {
  const [character, setCharacter] = useState<CharacterProfile>(() => {
    const base = CHARACTERS[0];
    try {
      const saved = localStorage.getItem(`andyvr_char_${base.id}`);
      if (saved) return { ...base, ...JSON.parse(saved) };
    } catch (e) {}
    return base;
  });

  const [customization, setCustomization] = useState<CustomizationSettings>(() => {
    try {
      const saved = localStorage.getItem(`cometa_custom_${CHARACTERS[0].id}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return CHARACTERS[0].defaultCustomization;
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return MemoryManager.getChatHistory(CHARACTERS[0].id);
  });

  const [memories, setMemories] = useState<MemoryItem[]>(() => {
    return MemoryManager.getMemories(CHARACTERS[0].id);
  });

  const [intimacyLevel, setIntimacyLevel] = useState<number>(() => {
    return MemoryManager.getIntimacy(CHARACTERS[0].id);
  });

  // La escena es estática: se cargan modelos/imagen pero no se reproduce animación 3D.
  const [activeEmotion, setActiveEmotion] = useState<EmotionType>('seductive');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [cameraPreset, setCameraPreset] = useState<'face' | 'bust' | 'full' | 'orbit'>(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 'full' : 'bust';
  });

  const [customModelFile, setCustomModelFile] = useState<File | null>(null);
  const [customModelInfo, setCustomModelInfo] = useState<{ name: string; animations: string[] } | null>(null);
  const [detectedMorphs, setDetectedMorphs] = useState<any[]>([]);

  const [modelTransform, setModelTransform] = useState<ModelTransformConfig>(() => {
    try {
      const saved = localStorage.getItem('andyvr_model_transform');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      scale: 1.0,
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotationY: 0,
      wireframe: false,
      colorTint: '#ffffff',
      roughnessMod: 0,
      metalnessMod: 0,
      rimIntensity: 1.0,
    };
  });

  const [performanceProfile, setPerformanceProfile] = useState<PerformanceProfileConfig>(() => {
    try {
      const saved = localStorage.getItem('andyvr_perf_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      preset: 'ultra',
      targetFps: 60,
      pixelRatio: 2.0,
      shadowMapSize: 1024,
      postProcessing: true,
      particlesEnabled: false,
    };
  });

  const [hardwareConfig, setHardwareConfig] = useState<HardwareConfig>(() => {
    try {
      const saved = localStorage.getItem('andyvr_hw_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      micDeviceId: 'default',
      audioOutputDeviceId: 'default',
      cameraEnabled: false,
      autoBargeIn: true,
      vadSensitivity: 0.5,
    };
  });

  const [customBackground, setCustomBackground] = useState<string | null>(() => {
    try {
      return localStorage.getItem('andyvr_custom_bg');
    } catch (e) {
      return null;
    }
  });

  const handleSetBackground = (bgUrl: string | null) => {
    setCustomBackground(bgUrl);
    try {
      if (bgUrl) {
        localStorage.setItem('andyvr_custom_bg', bgUrl);
      } else {
        localStorage.removeItem('andyvr_custom_bg');
      }
    } catch (e) {}
  };

  const [ttsEnabled, setTtsEnabled] = useState<boolean>(true);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<DrawerTabType>('model3d');

  const [aiProviderConfig, setAiProviderConfig] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('andyvr_ai_provider_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      provider: 'gemini',
      endpointUrl: 'http://localhost:1234/v1',
      modelName: 'default',
      temperature: 0.9,
    };
  });

  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && cameraPreset === 'bust') {
        setCameraPreset('full');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [cameraPreset]);

  const handleSelectCharacter = (newChar: CharacterProfile) => {
    let charToUse = newChar;
    try {
      const savedLore = localStorage.getItem(`andyvr_char_${newChar.id}`);
      if (savedLore) {
        charToUse = { ...newChar, ...JSON.parse(savedLore) };
      }
    } catch (e) {}

    setCharacter(charToUse);

    try {
      const saved = localStorage.getItem(`cometa_custom_${newChar.id}`);
      if (saved) {
        setCustomization(JSON.parse(saved));
      } else {
        setCustomization(newChar.defaultCustomization);
      }
    } catch (e) {
      setCustomization(newChar.defaultCustomization);
    }

    setMessages(MemoryManager.getChatHistory(newChar.id));
    setMemories(MemoryManager.getMemories(newChar.id));
    setIntimacyLevel(MemoryManager.getIntimacy(newChar.id));
    setIsSpeaking(false);
    setCustomModelFile(null);
    setCustomModelInfo(null);
    setDetectedMorphs([]);
  };

  const handleCustomizationChange = (updated: CustomizationSettings) => {
    setCustomization(updated);
    try {
      localStorage.setItem(`cometa_custom_${character.id}`, JSON.stringify(updated));
    } catch (e) {}
  };

  const handleUpdateCharacterProfile = (updatedLore: Partial<CharacterProfile>) => {
    setCharacter((prev) => {
      const updated = { ...prev, ...updatedLore };
      try {
        localStorage.setItem(`andyvr_char_${updated.id}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleAIProviderConfigChange = (updated: any) => {
    setAiProviderConfig(updated);
    try {
      localStorage.setItem('andyvr_ai_provider_config', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleModelTransformChange = (updated: ModelTransformConfig) => {
    setModelTransform(updated);
    try {
      localStorage.setItem('andyvr_model_transform', JSON.stringify(updated));
    } catch (e) {}
  };

  const handlePerformanceProfileChange = (updated: PerformanceProfileConfig) => {
    setPerformanceProfile(updated);
    try {
      localStorage.setItem('andyvr_perf_profile', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleHardwareConfigChange = (updated: HardwareConfig) => {
    setHardwareConfig(updated);
    try {
      localStorage.setItem('andyvr_hw_config', JSON.stringify(updated));
    } catch (e) {}
  };

  const stopSpeechAndBargeIn = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const playSpokenReply = async (text: string) => {
    if (!ttsEnabled) return;

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    setIsSpeaking(true);

    const audioUrl = await ApiClient.generateTTS(text, character.voiceName);
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => {
        setIsSpeaking(false);
        currentAudioRef.current = null;
      };
      audio.onerror = () => {
        currentAudioRef.current = null;
        ApiClient.playWebSpeech(
          text,
          character.gender,
          () => setIsSpeaking(true),
          () => {
            setIsSpeaking(false);
            currentAudioRef.current = null;
          }
        );
      };
      audio.play().catch(() => {
        ApiClient.playWebSpeech(
          text,
          character.gender,
          () => setIsSpeaking(true),
          () => {
            setIsSpeaking(false);
            currentAudioRef.current = null;
          }
        );
      });
    } else {
      ApiClient.playWebSpeech(
        text,
        character.gender,
        () => setIsSpeaking(true),
        () => {
          setIsSpeaking(false);
          currentAudioRef.current = null;
        }
      );
    }
  };

  const handleSendMessage = async (text: string, imageBase64?: string) => {
    if (isSpeaking && hardwareConfig.autoBargeIn) {
      stopSpeechAndBargeIn();
    }

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      sender: 'user',
      text,
      timestamp: Date.now(),
      imageUrl: imageBase64,
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    MemoryManager.saveChatHistory(character.id, newHistory);

    setIsThinking(true);

    try {
      let result;
      if (imageBase64) {
        result = await ApiClient.analyzeImage(imageBase64, 'image/jpeg', text, character);
      } else {
        result = await ApiClient.sendChatMessage(
          text,
          newHistory,
          character,
          memories,
          intimacyLevel,
          aiProviderConfig
        );
      }

      setIsThinking(false);
      setActiveEmotion(result.emotion);

      const updatedIntimacy = MemoryManager.addIntimacy(character.id, result.intimacyDelta || 2);
      setIntimacyLevel(updatedIntimacy);

      if (result.newMemory) {
        MemoryManager.addMemory(character.id, result.newMemory, 'preference', 4);
        setMemories(MemoryManager.getMemories(character.id));
      }

      const charMsg: ChatMessage = {
        id: `msg_${Date.now()}_c`,
        sender: 'model',
        text: result.reply,
        timestamp: Date.now(),
        animation: undefined as any,
        emotion: result.emotion,
      };

      const finalHistory = [...newHistory, charMsg];
      setMessages(finalHistory);
      MemoryManager.saveChatHistory(character.id, finalHistory);

      playSpokenReply(result.reply);
    } catch (err) {
      console.error('Error handling chat exchange:', err);
      setIsThinking(false);
      setIsSpeaking(false);
    }
  };

  return (
    <main
      className="relative w-full h-[100dvh] overflow-hidden select-none touch-none text-[#F8F7F4] font-['Inter',sans-serif]"
      style={{
        backgroundColor: '#000000',
        backgroundImage: customBackground ? `url(${customBackground})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Character3DScene
        customization={customization}
        gender={character.gender}
        isSpeaking={isSpeaking}
        cameraPreset={cameraPreset}
        customModelFile={customModelFile}
        modelTransform={modelTransform}
        morphTargetsList={detectedMorphs}
        performanceProfile={performanceProfile}
        onModelLoaded={(info) => {
          setCustomModelInfo({ name: info.name, animations: info.animations });
          if (info.morphs) {
            setDetectedMorphs(info.morphs);
          }
        }}
        onMorphsDetected={(morphs) => setDetectedMorphs(morphs)}
      />

      <div className="absolute top-4 right-4 z-30 pointer-events-auto">
        <PWAInstallButton />
      </div>

      {!isOnline && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/90 text-slate-950 font-semibold text-xs shadow-lg">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Modo Offline — Motor de rol local y memorias en caché activos.</span>
        </div>
      )}

      <ChatOverlay
        character={character}
        characters={CHARACTERS}
        messages={messages}
        intimacyLevel={intimacyLevel}
        activeEmotion={activeEmotion}
        isSpeaking={isSpeaking}
        isThinking={isThinking}
        cameraPreset={cameraPreset}
        onSendMessage={handleSendMessage}
        onCameraChange={(preset) => setCameraPreset(preset)}
        onOpenCustomizer={() => { setDrawerTab('customizer'); setIsDrawerOpen(true); }}
        onOpenMemory={() => { setDrawerTab('memory'); setIsDrawerOpen(true); }}
        onOpenModelImporter={() => { setDrawerTab('model3d'); setIsDrawerOpen(true); }}
        onOpenDrawer={(tab) => { setDrawerTab(tab); setIsDrawerOpen(true); }}
        onSelectCharacter={handleSelectCharacter}
        ttsEnabled={ttsEnabled}
        onToggleTTS={() => setTtsEnabled(!ttsEnabled)}
        onBargeIn={stopSpeechAndBargeIn}
        customBackground={customBackground}
        onSetBackground={handleSetBackground}
      />

      <ConfigurationDrawer
        isOpen={isDrawerOpen}
        initialTab={drawerTab}
        character={character}
        characters={CHARACTERS}
        customization={customization}
        memories={memories}
        intimacyLevel={intimacyLevel}
        cameraPreset={cameraPreset}
        aiProviderConfig={aiProviderConfig}
        currentModelName={customModelInfo?.name}
        modelTransform={modelTransform}
        morphTargetsList={detectedMorphs}
        performanceProfile={performanceProfile}
        hardwareConfig={hardwareConfig}
        onModelTransformChange={handleModelTransformChange}
        onResetMorphs={() => setDetectedMorphs([])}
        onPerformanceProfileChange={handlePerformanceProfileChange}
        onHardwareConfigChange={handleHardwareConfigChange}
        onClose={() => setIsDrawerOpen(false)}
        onCustomizationChange={handleCustomizationChange}
        onMemoriesUpdated={(updated) => setMemories(updated)}
        onIntimacyUpdated={(lvl) => setIntimacyLevel(lvl)}
        onSelectCharacter={handleSelectCharacter}
        onUpdateCharacterProfile={handleUpdateCharacterProfile}
        onAIProviderConfigChange={handleAIProviderConfigChange}
        onCameraChange={(preset) => setCameraPreset(preset)}
        onSelectModelFile={(file) => {
          setCustomModelFile(file);
          setIsDrawerOpen(false);
        }}
        onResetToProcedural={() => {
          setCustomModelFile(null);
          setCustomModelInfo(null);
          setDetectedMorphs([]);
        }}
      />
    </main>
  );
}
