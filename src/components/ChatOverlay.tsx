import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Heart,
  Sparkles,
  Camera,
  Play,
  RotateCcw,
  Sliders,
  Brain,
  Box,
  Eye,
  EyeOff,
  BookOpen,
  Cpu,
  PanelLeftOpen,
  MessageSquare,
  Activity,
  Gauge,
  Radio,
} from 'lucide-react';
import { AnimationType, CharacterProfile, ChatMessage, EmotionType } from '../types/character';
import { MemoryManager } from '../services/memoryManager';
import { DrawerTabType } from './ConfigurationDrawer';

interface ChatOverlayProps {
  character: CharacterProfile;
  characters: CharacterProfile[];
  messages: ChatMessage[];
  intimacyLevel: number;
  activeAnimation: AnimationType;
  activeEmotion: EmotionType;
  isSpeaking: boolean;
  isThinking?: boolean;
  cameraPreset: 'face' | 'bust' | 'full' | 'orbit';
  loadedAnimations?: string[];
  onSendMessage: (text: string, imageBase64?: string) => void;
  onAnimationTrigger: (anim: AnimationType) => void;
  onCameraChange: (preset: 'face' | 'bust' | 'full' | 'orbit') => void;
  onOpenCustomizer: () => void;
  onOpenMemory: () => void;
  onOpenModelImporter: () => void;
  onOpenDrawer?: (tab: DrawerTabType) => void;
  onSelectCharacter: (char: CharacterProfile) => void;
  ttsEnabled: boolean;
  onToggleTTS: () => void;
  onBargeIn?: () => void;
  customBackground?: string | null;
  onSetBackground?: (bgUrl: string | null) => void;
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({
  character,
  characters,
  messages,
  intimacyLevel,
  activeAnimation,
  activeEmotion,
  isSpeaking,
  isThinking = false,
  cameraPreset,
  loadedAnimations = [],
  onSendMessage,
  onAnimationTrigger,
  onCameraChange,
  onOpenCustomizer,
  onOpenMemory,
  onOpenModelImporter,
  onOpenDrawer,
  onSelectCharacter,
  ttsEnabled,
  onToggleTTS,
  onBargeIn,
  customBackground,
  onSetBackground,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  // Auto-hiding bottom dock: only opens when user taps or focuses on the bottom section
  const [isBottomActive, setIsBottomActive] = useState<boolean>(false);
  const [isChatExpanded, setIsChatExpanded] = useState<boolean>(false);
  const [isCharacterMenuOpen, setIsCharacterMenuOpen] = useState(false);
  const [isBackgroundMenuOpen, setIsBackgroundMenuOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const textInputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const speechRecognitionRef = useRef<any>(null);

  const intimacyTitle = MemoryManager.getIntimacyTitle(intimacyLevel);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isChatExpanded]);

  // Escape key to minimize bottom dock and liberate 3D view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsBottomActive(false);
        setIsChatExpanded(false);
        setIsCharacterMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Web Speech API Voice Recognition setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'es-ES';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsBottomActive(true);
        setTimeout(() => {
          onSendMessage(transcript);
          setInputText('');
        }, 400);
      };

      speechRecognitionRef.current = recognition;
    }
  }, [onSendMessage]);

  const toggleListening = () => {
    if (!speechRecognitionRef.current) {
      return;
    }

    if (isListening) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsBottomActive(true);
      try {
        speechRecognitionRef.current.start();
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedImage) return;

    onSendMessage(inputText, selectedImage || undefined);
    setInputText('');
    setSelectedImage(null);
    setIsChatExpanded(true);

    // On mobile devices, tuck bottom dock away so the avatar's reaction animation is fully visible
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsBottomActive(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const animationsList: { id: AnimationType; label: string }[] = [
    { id: 'idle', label: 'Reposo' },
    { id: 'flirt', label: 'Coqueteo' },
    { id: 'tease', label: 'Provocación' },
    { id: 'whisper', label: 'Susurro' },
    { id: 'sensual_sway', label: 'Vaivén' },
    { id: 'kiss_wink', label: 'Beso' },
    { id: 'dance', label: 'Danza' },
    { id: 'laugh', label: 'Risa' },
    { id: 'proud', label: 'Diosa' },
  ];

  if (isZenMode) {
    return (
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 z-20 font-['Inter',sans-serif]">
        <div className="flex justify-between items-start pointer-events-auto w-full">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 text-xs font-['Space_Mono',monospace] text-[#F8F7F4]/80">
            <span>● MODO CINE ACTIVO</span>
          </div>

          <button
            onClick={() => setIsZenMode(false)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 text-[#F8F7F4] text-xs font-['Space_Mono',monospace] hover:border-[#E63946] transition"
            title="Restaurar interfaz y controles"
          >
            <Eye className="w-3.5 h-3.5 text-[#E63946]" />
            <span>[RESTAURAR CONTROLES]</span>
          </button>
        </div>

        {/* Small bottom prompt */}
        <div className="w-full flex justify-center pointer-events-auto pb-4">
          <button
            onClick={() => setIsZenMode(false)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-[#F8F7F4]/70 text-xs font-['Space_Mono',monospace] hover:text-white transition"
          >
            <span>● TOCA AQUÍ PARA ABRIR CHAT</span>
          </button>
        </div>
      </div>
    );
  }

  const roomPresets = [
    { id: 'black', label: 'Negro Puro (#000000)', url: null },
    {
      id: 'luxury_room',
      label: 'Habitación Íntima',
      url: 'https://images.unsplash.com/photo-1540518614846-7ede433c4b13?auto=format&fit=crop&w=1920&q=80',
    },
    {
      id: 'penthouse',
      label: 'Suite Penthouse',
      url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=80',
    },
    {
      id: 'neon_studio',
      label: 'Estudio Nocturno',
      url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1920&q=80',
    },
  ];

  const handleBgFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onSetBackground) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onSetBackground(ev.target?.result as string);
      setIsBackgroundMenuOpen(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 z-20 font-['Inter',sans-serif]">
      {/* Discreet Perimeter Header - Giant name removed so avatar is 100% visible */}
      <header className="flex justify-between items-start w-full pointer-events-auto gap-3">
        {/* Left Side: Minimal Discreet Menu & Avatar Switcher */}
        <div className="flex items-center gap-2">
          {/* Menú Sidebar Toggle */}
          <button
            onClick={() => onOpenDrawer?.('customizer')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/90 border border-white/15 hover:border-[#E63946] text-[#F8F7F4] text-xs font-['Space_Mono',monospace] transition active:scale-95 shadow-md backdrop-blur-md cursor-pointer"
            title="Abrir Menú de Ajustes"
          >
            <PanelLeftOpen className="w-3.5 h-3.5 text-[#E63946]" />
            <span className="font-bold tracking-wider">[MENÚ]</span>
          </button>

          {/* Selector de Avatar */}
          <div className="relative">
            <button
              onClick={() => setIsCharacterMenuOpen(!isCharacterMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/10 hover:border-white/20 transition text-left backdrop-blur-md cursor-pointer"
            >
              <span className="text-sm">{character.avatarThumb}</span>
              <span className="text-xs font-semibold text-[#F8F7F4]">{character.name}</span>
              <ChevronDown className="w-3 h-3 text-[#F8F7F4]/50" />
            </button>

            {/* Character Dropdown */}
            {isCharacterMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-60 rounded-xl bg-[#111113]/98 border border-white/15 shadow-2xl p-2 z-50 animate-in fade-in space-y-1 backdrop-blur-xl">
                <div className="px-2 py-1 text-[10px] font-['Space_Mono',monospace] text-[#F8F7F4]/50 uppercase tracking-wider">
                  [Elegir Avatar]
                </div>
                {characters.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectCharacter(c);
                      setIsCharacterMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-left transition text-xs ${
                      c.id === character.id
                        ? 'bg-[#E63946]/20 text-[#F8F7F4] border border-[#E63946]/50'
                        : 'hover:bg-white/5 text-[#F8F7F4]/80'
                    }`}
                  >
                    <span className="text-base">{c.avatarThumb}</span>
                    <div>
                      <div className="font-semibold text-xs text-[#F8F7F4]">{c.name}</div>
                      <div className="text-[10px] text-[#F8F7F4]/50 line-clamp-1">{c.title}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side: Status and technical action row in 100% Spanish */}
        <div className="text-right flex flex-col items-end gap-1">
          {/* Dynamic Status text in Spanish */}
          {isSpeaking ? (
            <button
              type="button"
              onClick={onBargeIn}
              className="text-[#E63946] font-['Space_Mono',monospace] font-bold text-xs sm:text-sm tracking-wider flex items-center justify-end gap-1.5 hover:opacity-80 transition cursor-pointer"
              title="Tocar para interrumpir (Barge-In)"
            >
              <span>● HABLANDO</span>
              <span className="text-[10px] opacity-75 underline">[CORTAR]</span>
            </button>
          ) : isListening ? (
            <div className="text-[#E63946] font-['Space_Mono',monospace] font-bold text-xs sm:text-sm tracking-wider flex items-center justify-end gap-1.5 animate-pulse">
              <span>● ESCUCHANDO...</span>
            </div>
          ) : isThinking ? (
            <div className="text-violet-400 font-['Space_Mono',monospace] font-bold text-xs sm:text-sm tracking-wider flex items-center justify-end gap-1.5">
              <span>● PROCESANDO...</span>
            </div>
          ) : (
            <div className="text-[#E63946] font-['Space_Mono',monospace] font-bold text-xs sm:text-sm tracking-wider flex items-center justify-end gap-1.5">
              <span>● EN VIVO</span>
            </div>
          )}

          {/* Quick Technical Actions in Spanish */}
          <div className="flex items-center gap-1 mt-1 text-[11px] font-['Space_Mono',monospace]">
            {/* Background Selector Modal Toggle */}
            <div className="relative">
              <button
                onClick={() => setIsBackgroundMenuOpen(!isBackgroundMenuOpen)}
                className="px-2 py-1 rounded bg-black/60 border border-white/10 hover:border-white/20 text-[#F8F7F4]/80 hover:text-white transition cursor-pointer"
                title="Cambiar fondo (Negro puro o foto de habitación)"
              >
                [FONDO]
              </button>

              {isBackgroundMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 rounded-xl bg-[#111113]/98 border border-white/15 shadow-2xl p-2.5 z-50 text-left space-y-2 backdrop-blur-xl">
                  <div className="text-[10px] font-['Space_Mono',monospace] text-[#F8F7F4]/60 uppercase tracking-wider">
                    [Ajustes de Fondo]
                  </div>

                  {/* Preset list */}
                  <div className="space-y-1">
                    {roomPresets.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          onSetBackground?.(r.url);
                          setIsBackgroundMenuOpen(false);
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs transition ${
                          customBackground === r.url
                            ? 'bg-[#E63946]/20 border border-[#E63946]/60 text-white font-semibold'
                            : 'hover:bg-white/5 text-[#F8F7F4]/80'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>

                  {/* Upload custom photo */}
                  <div className="pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => bgFileInputRef.current?.click()}
                      className="w-full py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-[#F8F7F4] text-xs font-semibold text-center transition cursor-pointer"
                    >
                      + Subir Foto / Imagen Propia
                    </button>
                    <input
                      ref={bgFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleBgFileSelect}
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => onOpenDrawer?.('animation_studio')}
              className="px-2 py-1 rounded bg-black/60 border border-white/10 hover:border-white/20 text-[#F8F7F4]/80 hover:text-white transition"
              title="Estudio de Animación"
            >
              [ANIM]
            </button>
            <button
              onClick={() => onOpenDrawer?.('model3d')}
              className="px-2 py-1 rounded bg-black/60 border border-white/10 hover:border-white/20 text-[#F8F7F4]/80 hover:text-white transition"
              title="Personalizar Modelo 3D"
            >
              [3D]
            </button>
            <button
              onClick={onToggleTTS}
              className={`px-2 py-1 rounded border transition ${
                ttsEnabled
                  ? 'bg-[#E63946]/15 border-[#E63946]/50 text-[#E63946]'
                  : 'bg-black/60 border-white/10 text-[#F8F7F4]/40'
              }`}
              title={ttsEnabled ? 'Voz activada' : 'Voz silenciada'}
            >
              {ttsEnabled ? '[VOZ: SÍ]' : '[VOZ: NO]'}
            </button>
            <button
              onClick={() => setIsZenMode(true)}
              className="px-2 py-1 rounded bg-black/60 border border-white/10 hover:border-white/20 text-[#F8F7F4]/80 hover:text-white transition"
              title="Modo Cine a pantalla limpia"
            >
              [CINE]
            </button>
          </div>
        </div>
      </header>

      {/* Meta Bar (Bottom-Left) in Spanish */}
      <div className="meta-bar absolute bottom-6 left-6 pointer-events-auto flex items-end gap-6 z-20">
        <div
          className="meta-item flex flex-col cursor-pointer group"
          onClick={() => onOpenDrawer?.('memory')}
          title="Ver Memorias"
        >
          <span className="font-['Space_Mono',monospace] text-[0.65rem] uppercase tracking-[0.15em] text-[#F8F7F4]/50 group-hover:text-[#E63946] transition">
            Memoria
          </span>
          <span className="value font-['Space_Mono',monospace] text-sm sm:text-base font-bold text-[#F8F7F4]">
            {messages.length > 0 ? `${Math.min(99, 45 + messages.length * 3)}%` : '98%'}
          </span>
        </div>

        <div
          className="meta-item flex flex-col cursor-pointer group"
          onClick={() => onOpenDrawer?.('memory')}
          title="Afinidad e Intimidad"
        >
          <span className="font-['Space_Mono',monospace] text-[0.65rem] uppercase tracking-[0.15em] text-[#F8F7F4]/50 group-hover:text-[#E63946] transition">
            Afinidad
          </span>
          <span className="value font-['Space_Mono',monospace] text-sm sm:text-base font-bold text-[#E63946]">
            {intimacyLevel}%
          </span>
        </div>
      </div>

      {/* Auto-Hiding Bottom Trigger: Completely INVISIBLE until touched or swiped */}
      {!isBottomActive ? (
        <div
          className="w-full max-w-lg mx-auto h-16 pointer-events-auto flex items-end justify-center pb-2 cursor-pointer transition-all duration-300 group"
          onClick={() => {
            setIsBottomActive(true);
            setTimeout(() => {
              textInputRef.current?.focus();
            }, 80);
          }}
          onTouchStart={() => {
            setIsBottomActive(true);
            setTimeout(() => {
              textInputRef.current?.focus();
            }, 80);
          }}
          title="Desliza o toca aquí para abrir el chat"
        >
          {/* Subtle gesture pill line, transparent and unobtrusive */}
          <div className="w-20 h-1 rounded-full bg-white/10 group-hover:bg-[#E63946] transition-colors" />
        </div>
      ) : (
        /* Full Expanded Bottom Control Dock */
        <div className="w-full max-w-3xl mx-auto pointer-events-auto space-y-2 animate-in slide-in-from-bottom duration-200">
          {/* Collapsible Chat Log Drawer */}
          {isChatExpanded && (
            <div className="w-full rounded-2xl bg-[#111113]/95 border border-[rgba(255,255,255,0.12)] shadow-2xl overflow-hidden backdrop-blur-xl">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[rgba(255,255,255,0.08)] bg-white/[0.02] text-xs text-[#F8F7F4]/60 font-['Space_Mono',monospace]">
                <span className="flex items-center gap-2 text-[#F8F7F4]/90 text-[11px] uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E63946]" />
                  [SESSION LOG // {character.name}]
                </span>
                <button
                  onClick={() => setIsChatExpanded(false)}
                  className="hover:text-white flex items-center gap-1 text-[11px] tracking-wider uppercase transition"
                  title="Ocultar diálogo para vista completa"
                >
                  <span>[MINIMIZE]</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <div
                ref={chatScrollRef}
                className="max-h-48 sm:max-h-56 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/20"
              >
                {messages.length === 0 ? (
                  <div className="text-center py-4 text-xs text-[#F8F7F4]/50">
                    <p className="italic">«{character.greeting}»</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs sm:text-sm leading-relaxed shadow-md ${
                          msg.sender === 'user'
                            ? 'bg-[#E63946] text-white rounded-br-xs font-normal'
                            : 'bg-[#1a1a1e] border border-[rgba(255,255,255,0.08)] text-[#F8F7F4] rounded-bl-xs'
                        }`}
                      >
                        {msg.imageUrl && (
                          <img
                            src={msg.imageUrl}
                            alt="adjunto"
                            className="w-40 h-28 object-cover rounded-lg mb-2 border border-white/20"
                          />
                        )}
                        <p>{msg.text}</p>
                      </div>
                      <span className="text-[10px] text-[#F8F7F4]/40 mt-0.5 px-1 font-['Space_Mono',monospace]">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Dock Bar with Input, Controls, Camera & Motions */}
          <div className="rounded-2xl bg-[#111113]/95 border border-[rgba(255,255,255,0.12)] shadow-2xl p-2.5 sm:p-3 backdrop-blur-xl space-y-2">
            {/* Quick Toolbar: Animations & Camera presets */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none pb-1 text-xs">
              {/* Camera Presets */}
              <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-[rgba(255,255,255,0.08)] shrink-0 font-['Space_Mono',monospace] text-[11px]">
                <Camera className="w-3.5 h-3.5 text-[#F8F7F4]/50 ml-1.5" />
                {[
                  { id: 'full' as const, label: 'FULL' },
                  { id: 'bust' as const, label: 'BUST' },
                  { id: 'face' as const, label: 'FACE' },
                  { id: 'orbit' as const, label: '360°' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onCameraChange(c.id)}
                    className={`px-2 py-0.5 rounded font-semibold transition uppercase ${
                      cameraPreset === c.id
                        ? 'bg-[#E63946] text-white shadow-sm'
                        : 'text-[#F8F7F4]/50 hover:text-white'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Quick Motion triggers */}
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none shrink-0 text-[11px] font-['Space_Mono',monospace]">
                {loadedAnimations && loadedAnimations.length > 0 ? (
                  <>
                    <span className="text-[10px] uppercase text-[#E63946] px-1 whitespace-nowrap">
                      [3D CLIPS]:
                    </span>
                    {loadedAnimations.map((clipName) => (
                      <button
                        key={clipName}
                        type="button"
                        onClick={() => onAnimationTrigger(clipName)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded transition whitespace-nowrap text-[11px] ${
                          activeAnimation === clipName
                            ? 'bg-[#E63946] text-white font-semibold'
                            : 'bg-white/[0.04] text-[#F8F7F4]/70 border border-white/10 hover:border-white/30'
                        }`}
                        title={`Reproducir animación ${clipName}`}
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>{clipName}</span>
                      </button>
                    ))}
                  </>
                ) : (
                  animationsList.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => onAnimationTrigger(a.id)}
                      className={`px-2 py-1 rounded transition whitespace-nowrap uppercase ${
                        activeAnimation === a.id
                          ? 'bg-[#E63946] text-white font-semibold'
                          : 'bg-white/[0.04] text-[#F8F7F4]/60 hover:text-white'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))
                )}
              </div>

              {/* Expand / Collapse Chat Log Toggle */}
              <button
                type="button"
                onClick={() => setIsChatExpanded(!isChatExpanded)}
                className="px-2 py-1 rounded bg-white/[0.04] border border-white/10 hover:bg-white/10 text-[#F8F7F4]/80 text-xs shrink-0 transition font-['Space_Mono',monospace]"
                title={isChatExpanded ? 'Minimizar diálogo' : 'Mostrar diálogo'}
              >
                {isChatExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>

              {/* Minimize dock completely to leave main 3D view clean */}
              <button
                type="button"
                onClick={() => setIsBottomActive(false)}
                className="flex items-center gap-1 px-2 py-1 rounded bg-white/[0.04] border border-white/10 hover:bg-white/10 text-[#F8F7F4]/80 text-xs shrink-0 transition font-['Space_Mono',monospace]"
                title="Ocultar sección inferior (liberar pantalla 3D)"
              >
                <ChevronDown className="w-3.5 h-3.5 text-[#E63946]" />
                <span className="hidden sm:inline">[HIDE]</span>
              </button>
            </div>

            {/* Image preview chip if attached */}
            {selectedImage && (
              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-black/60 border border-[#E63946]/40">
                <img src={selectedImage} alt="preview" className="w-10 h-10 object-cover rounded-lg" />
                <div className="flex-1 text-[11px] text-[#F8F7F4]/80 truncate font-['Space_Mono',monospace]">
                  Foto adjunta para {character.name}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="p-1 text-[#F8F7F4]/50 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Chat / Voice Input Bar */}
            <form onSubmit={handleSend} className="flex items-center gap-2">
              {/* Image upload button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/30 text-[#F8F7F4]/80 hover:text-white transition"
                title="Subir foto para que la analice"
              >
                <ImageIcon className="w-4 h-4 text-[#F8F7F4]" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />

              {/* Voice microphone button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded-xl transition ${
                  isListening
                    ? 'bg-[#E63946] text-white animate-pulse shadow-lg shadow-[#E63946]/40'
                    : 'bg-white/[0.04] border border-white/10 hover:border-white/30 text-[#F8F7F4]/80 hover:text-white'
                }`}
                title={isListening ? 'Escuchando tu voz...' : 'Hablar por micrófono'}
              >
                {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              {/* Text Input with autofocus on click */}
              <input
                ref={textInputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onFocus={() => setIsBottomActive(true)}
                placeholder={isListening ? 'Habla ahora, te estoy escuchando...' : `Susúrrale o háblale a ${character.name}...`}
                className="flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-[rgba(255,255,255,0.1)] text-[#F8F7F4] text-xs sm:text-sm placeholder:text-[#F8F7F4]/30 focus:outline-none focus:border-[#E63946]/80 transition font-['Inter',sans-serif]"
              />

              {/* Send CTA */}
              <button
                type="submit"
                disabled={!inputText.trim() && !selectedImage}
                className="p-2.5 rounded-xl bg-[#E63946] hover:bg-[#d62839] disabled:opacity-30 disabled:cursor-not-allowed text-white shadow-lg shadow-[#E63946]/25 transition active:scale-95"
                title="Enviar mensaje"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
