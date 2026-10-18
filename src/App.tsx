import React, { useEffect, useRef, useState } from 'react';
import { CHARACTERS } from './data/characters';
import {
  AIProviderConfig,
  AnimationType,
  CharacterProfile,
  ChatMessage,
  CustomizationSettings,
  EmotionType,
  HardwareConfig,
  MemoryItem,
  ModelTransformConfig,
  MorphTargetItem,
  PerformanceProfileConfig,
} from './types/character';
import {
  AnimationClassifier,
  AnimationSlotMapping,
  RecognizedAnimation,
} from './services/animationClassifier';
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

  // 3D Scene states
  const [activeAnimation, setActiveAnimation] = useState<AnimationType>('idle');
  const [activeEmotion, setActiveEmotion] = useState<EmotionType>('seductive');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [cameraPreset, setCameraPreset] = useState<'face' | 'bust' | 'full' | 'orbit'>(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 'full' : 'bust';
  });

  // Custom 3D Model & Animation Recognition
  const [customModelFile, setCustomModelFile] = useState<File | null>(null);
  const [customModelInfo, setCustomModelInfo] = useState<{ name: string; animations: string[] } | null>(null);
  const [recognizedAnimations, setRecognizedAnimations] = useState<RecognizedAnimation[]>([]);
  const [detectedMorphs, setDetectedMorphs] = useState<MorphTargetItem[]>([]);

  // Animation Slot Mapping & Playback Config
  const [animationSlotMapping, setAnimationSlotMapping] = useState<AnimationSlotMapping>(() => {
    try {
      const saved = localStorage.getItem('andyvr_slot_mapping');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      idle: '',
      speaking: '',
      laugh: '',
      flirt: '',
      dance: '',
    };
  });

  const [playbackSpeed, setPlaybackSpeed] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('andyvr_anim_speed');
      if (saved) return parseFloat(saved);
    } catch (e) {}
    return 1.0;
  });

  const [crossFadeDuration, setCrossFadeDuration] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('andyvr_crossfade_dur');
      if (saved) return parseFloat(saved);
    } catch (e) {}
    return 0.35;
  });

  // 3D Model Customization (Scale, Offsets, Materials)
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

  // Performance Profile
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

  // Hardware Config & Barge-In
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

  // Background Image or Pure Black (#000000)
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

  // Audio / Voice TTS state
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(true);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Collapsible Configuration Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<DrawerTabType>('animation_studio');

  // AI Provider configuration (Cloud Gemini vs Local LM Studio / Ollama / Custom API Endpoint)
  const [aiProviderConfig, setAiProviderConfig] = useState<AIProviderConfig>(() => {
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

  // Network offline detector
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

  // Responsive mobile framing listener
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && cameraPreset === 'bust') {
        setCameraPreset('full');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [cameraPreset]);

  // When changing character
  const handleSelectCharacter = (newChar: CharacterProfile) => {
    let charToUse = newChar;
    try {
      const savedLore = localStorage.getItem(`andyvr_char_${newChar.id}`);
      if (savedLore) {
        charToUse = { ...newChar, ...JSON.parse(savedLore) };
      }
    } catch (e) {}

    setCharacter(charToUse);

    // Load character's saved customization
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
    setActiveAnimation('idle');
    setCustomModelFile(null);
    setCustomModelInfo(null);
    setRecognizedAnimations([]);
    setDetectedMorphs([]);
  };

  // Save customization changes
  const handleCustomizationChange = (updated: CustomizationSettings) => {
    setCustomization(updated);
    try {
      localStorage.setItem(`cometa_custom_${character.id}`, JSON.stringify(updated));
    } catch (e) {}
  };

  // Save character profile / story / role edits
  const handleUpdateCharacterProfile = (updatedLore: Partial<CharacterProfile>) => {
    setCharacter((prev) => {
      const updated = { ...prev, ...updatedLore };
      try {
        localStorage.setItem(`andyvr_char_${updated.id}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Save AI Provider configuration changes
  const handleAIProviderConfigChange = (updated: AIProviderConfig) => {
    setAiProviderConfig(updated);
    try {
      localStorage.setItem('andyvr_ai_provider_config', JSON.stringify(updated));
    } catch (e) {}
  };

  // Animation Slot Mapping updater
  const handleUpdateSlotMapping = (mapping: AnimationSlotMapping) => {
    setAnimationSlotMapping(mapping);
    try {
      localStorage.setItem('andyvr_slot_mapping', JSON.stringify(mapping));
    } catch (e) {}
  };

  // Playback Speed updater
  const handleChangePlaybackSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    try {
      localStorage.setItem('andyvr_anim_speed', speed.toString());
    } catch (e) {}
  };

  // Crossfade Duration updater
  const handleChangeCrossFadeDuration = (duration: number) => {
    setCrossFadeDuration(duration);
    try {
      localStorage.setItem('andyvr_crossfade_dur', duration.toString());
    } catch (e) {}
  };

  // Model Transform updater
  const handleModelTransformChange = (updated: ModelTransformConfig) => {
    setModelTransform(updated);
    try {
      localStorage.setItem('andyvr_model_transform', JSON.stringify(updated));
    } catch (e) {}
  };

  // Morph Target slider handler
  const handleMorphTargetChange = (id: string, weight: number) => {
    setDetectedMorphs((prev) =>
      prev.map((m) => (m.id === id ? { ...m, weight } : m))
    );
  };

  // Reset Morphs handler
  const handleResetMorphs = () => {
    setDetectedMorphs((prev) => prev.map((m) => ({ ...m, weight: 0 })));
  };

  // Performance Profile updater
  const handlePerformanceProfileChange = (updated: PerformanceProfileConfig) => {
    setPerformanceProfile(updated);
    try {
      localStorage.setItem('andyvr_perf_profile', JSON.stringify(updated));
    } catch (e) {}
  };

  // Hardware Config updater
  const handleHardwareConfigChange = (updated: HardwareConfig) => {
    setHardwareConfig(updated);
    try {
      localStorage.setItem('andyvr_hw_config', JSON.stringify(updated));
    } catch (e) {}
  };

  // Open drawer helper
  const handleOpenDrawer = (tab: DrawerTabType) => {
    setDrawerTab(tab);
    setIsDrawerOpen(true);
  };

  // Instant Barge-In Speech Cancellation (Grok Ani feature)
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
    setActiveAnimation('idle');
  };

  // Play spoken reply and synchronize jaw lip sync flutter
  const playSpokenReply = async (text: string) => {
    if (!ttsEnabled) return;

    // Cut previous audio if any
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    setIsSpeaking(true);

    // Try server Gemini TTS first
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
      // Use Web Speech API
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

  // Send message handler with active AI Provider
  const handleSendMessage = async (text: string, imageBase64?: string) => {
    // If avatar was talking, interrupt immediately (Barge-In)
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

    // Set interactive listening reaction animation
    setActiveAnimation('whisper');
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

      // Update 3D avatar animation & emotion state
      setActiveAnimation(result.animation);
      setActiveEmotion(result.emotion);

      // Add to intimacy level
      const updatedIntimacy = MemoryManager.addIntimacy(character.id, result.intimacyDelta || 2);
      setIntimacyLevel(updatedIntimacy);

      // Save new learned memory if extracted
      if (result.newMemory) {
        MemoryManager.addMemory(character.id, result.newMemory, 'preference', 4);
        setMemories(MemoryManager.getMemories(character.id));
      }

      // Append character response message
      const charMsg: ChatMessage = {
        id: `msg_${Date.now()}_c`,
        sender: 'model',
        text: result.reply,
        timestamp: Date.now(),
        animation: result.animation,
        emotion: result.emotion,
      };

      const finalHistory = [...newHistory, charMsg];
      setMessages(finalHistory);
      MemoryManager.saveChatHistory(character.id, finalHistory);

      // Trigger spoken voice reply
      playSpokenReply(result.reply);

      // Return to sensual sway or idle after 6 seconds
      setTimeout(() => {
        setActiveAnimation((prev) => (prev === result.animation ? 'idle' : prev));
      }, 6500);
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
      {/* 3D Scene Viewport (100% full-bleed per Three.js guidelines) */}
      <Character3DScene
        customization={customization}
        gender={character.gender}
        activeAnimation={activeAnimation}
        activeEmotion={activeEmotion}
        isSpeaking={isSpeaking}
        cameraPreset={cameraPreset}
        customModelFile={customModelFile}
        modelTransform={modelTransform}
        morphTargetsList={detectedMorphs}
        animationSlotMapping={animationSlotMapping}
        playbackSpeed={playbackSpeed}
        crossFadeDuration={crossFadeDuration}
        performanceProfile={performanceProfile}
        onModelLoaded={(info) => {
          setCustomModelInfo({ name: info.name, animations: info.animations });
          if (info.recognizedAnimations) {
            setRecognizedAnimations(info.recognizedAnimations);
            const autoSlots = AnimationClassifier.autoMapSlots(info.recognizedAnimations);
            handleUpdateSlotMapping(autoSlots);
          }
          if (info.morphs) {
            setDetectedMorphs(info.morphs);
          }
        }}
        onMorphsDetected={(morphs) => setDetectedMorphs(morphs)}
        onAnimationChanged={(anim) => setActiveAnimation(anim)}
      />

      {/* PWA Install Button floating in corner */}
      <div className="absolute top-4 right-4 z-30 pointer-events-auto">
        <PWAInstallButton />
      </div>

      {/* Offline Notification Indicator */}
      {!isOnline && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/90 text-slate-950 font-semibold text-xs shadow-lg">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Modo Offline — Motor de rol local y memorias en caché activos.</span>
        </div>
      )}

      {/* HUD & Chat Overlay with Grok Ani Conversational Dynamic State */}
      <ChatOverlay
        character={character}
        characters={CHARACTERS}
        messages={messages}
        intimacyLevel={intimacyLevel}
        activeAnimation={activeAnimation}
        activeEmotion={activeEmotion}
        isSpeaking={isSpeaking}
        isThinking={isThinking}
        cameraPreset={cameraPreset}
        loadedAnimations={customModelInfo?.animations}
        onSendMessage={handleSendMessage}
        onAnimationTrigger={(anim) => setActiveAnimation(anim)}
        onCameraChange={(preset) => setCameraPreset(preset)}
        onOpenCustomizer={() => handleOpenDrawer('customizer')}
        onOpenMemory={() => handleOpenDrawer('memory')}
        onOpenModelImporter={() => handleOpenDrawer('model3d')}
        onOpenDrawer={handleOpenDrawer}
        onSelectCharacter={handleSelectCharacter}
        ttsEnabled={ttsEnabled}
        onToggleTTS={() => setTtsEnabled(!ttsEnabled)}
        onBargeIn={stopSpeechAndBargeIn}
        customBackground={customBackground}
        onSetBackground={handleSetBackground}
      />

      {/* Sidebar Left Desplegable with Full Studio, Model Customizer & Slots */}
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
        loadedAnimations={customModelInfo?.animations}
        recognizedAnimations={recognizedAnimations}
        animationSlotMapping={animationSlotMapping}
        playbackSpeed={playbackSpeed}
        crossFadeDuration={crossFadeDuration}
        activeAnimation={activeAnimation}
        isSpeaking={isSpeaking}
        modelTransform={modelTransform}
        morphTargetsList={detectedMorphs}
        performanceProfile={performanceProfile}
        hardwareConfig={hardwareConfig}
        onTriggerAnimation={(anim) => setActiveAnimation(anim)}
        onUpdateSlotMapping={handleUpdateSlotMapping}
        onChangePlaybackSpeed={handleChangePlaybackSpeed}
        onChangeCrossFadeDuration={handleChangeCrossFadeDuration}
        onModelTransformChange={handleModelTransformChange}
        onMorphTargetChange={handleMorphTargetChange}
        onResetMorphs={handleResetMorphs}
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
          setRecognizedAnimations([]);
          setDetectedMorphs([]);
        }}
      />
    </main>
  );
}
