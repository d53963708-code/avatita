import React, { useState } from 'react';
import {
  Play,
  Check,
  Sparkles,
  Sliders,
  RotateCcw,
  Zap,
  Activity,
  Layers,
  ChevronRight,
  Filter,
} from 'lucide-react';
import {
  AnimationClassifier,
  AnimationSlotMapping,
  RecognizedAnimation,
} from '../../services/animationClassifier';

interface AnimationStudioTabProps {
  currentModelName?: string;
  loadedAnimations?: string[];
  recognizedAnimations?: RecognizedAnimation[];
  animationSlotMapping?: AnimationSlotMapping;
  playbackSpeed: number;
  crossFadeDuration: number;
  activeAnimation: string;
  isSpeaking: boolean;
  onTriggerAnimation?: (anim: string) => void;
  onUpdateSlotMapping?: (mapping: AnimationSlotMapping) => void;
  onChangePlaybackSpeed: (speed: number) => void;
  onChangeCrossFadeDuration: (duration: number) => void;
}

export const AnimationStudioTab: React.FC<AnimationStudioTabProps> = ({
  currentModelName,
  loadedAnimations = [],
  recognizedAnimations = [],
  animationSlotMapping,
  playbackSpeed,
  crossFadeDuration,
  activeAnimation,
  isSpeaking,
  onTriggerAnimation,
  onUpdateSlotMapping,
  onChangePlaybackSpeed,
  onChangeCrossFadeDuration,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [activeSubSection, setActiveSubSection] = useState<'recognition' | 'slots' | 'playback'>('recognition');
  const [autoMappedNotice, setAutoMappedNotice] = useState(false);

  // If no recognizedAnimations passed but loadedAnimations exists, generate on the fly
  const effectiveClips: RecognizedAnimation[] =
    recognizedAnimations.length > 0
      ? recognizedAnimations
      : loadedAnimations.map((name) => ({
          id: name,
          originalName: name,
          cleanName: AnimationClassifier.cleanClipName(name),
          category: 'other',
          categoryLabel: 'Acción General',
          confidence: 70,
          duration: 2.0,
          tracksCount: 12,
          hasMorphTargets: false,
          affectedBones: [],
        }));

  const filteredClips =
    filterCategory === 'all'
      ? effectiveClips
      : effectiveClips.filter((c) => c.category === filterCategory);

  const handleAutoMap = () => {
    if (!onUpdateSlotMapping) return;
    const mapping = AnimationClassifier.autoMapSlots(effectiveClips);
    onUpdateSlotMapping(mapping);
    setAutoMappedNotice(true);
    setTimeout(() => setAutoMappedNotice(false), 2500);
  };

  const handleSlotChange = (slot: keyof AnimationSlotMapping, clipName: string) => {
    if (!onUpdateSlotMapping || !animationSlotMapping) return;
    onUpdateSlotMapping({
      ...animationSlotMapping,
      [slot]: clipName,
    });
  };

  return (
    <div className="space-y-4 animate-in fade-in text-xs select-none">
      {/* Top Banner */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-violet-950/40 to-cyan-950/40 border border-violet-500/30">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-violet-300 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Estudio & Reconocimiento de Animación</span>
          </span>
          <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/30">
            {effectiveClips.length} clips detectados
          </span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          Clasifica automáticamente cada animación de tu modelo 3D (Mixamo, VRM, GLTF) por intención semántica y vincúlala a los estados de la IA.
        </p>
      </div>

      {/* Sub-section Switcher */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
        <button
          type="button"
          onClick={() => setActiveSubSection('recognition')}
          className={`flex-1 py-1.5 rounded-lg font-medium transition text-center ${
            activeSubSection === 'recognition'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Clips & Reconocimiento
        </button>
        <button
          type="button"
          onClick={() => setActiveSubSection('slots')}
          className={`flex-1 py-1.5 rounded-lg font-medium transition text-center ${
            activeSubSection === 'slots'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Mapeo de Estados IA
        </button>
        <button
          type="button"
          onClick={() => setActiveSubSection('playback')}
          className={`flex-1 py-1.5 rounded-lg font-medium transition text-center ${
            activeSubSection === 'playback'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Velocidad & Blend
        </button>
      </div>

      {/* ================= SUB-SECTION 1: CLIPS & RECOGNITION ================= */}
      {activeSubSection === 'recognition' && (
        <div className="space-y-3">
          {/* Category filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 text-[11px]">
            {[
              { id: 'all', label: 'Todas' },
              { id: 'idle', label: 'Reposo' },
              { id: 'talk', label: 'Habla' },
              { id: 'emotion', label: 'Emociones' },
              { id: 'dance', label: 'Baile' },
              { id: 'locomotion', label: 'Locomoción' },
              { id: 'facial', label: 'Facial / Morphs' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterCategory(f.id)}
                className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition ${
                  filterCategory === f.id
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* List of Clips */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {filteredClips.length === 0 ? (
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-center text-slate-400">
                No hay animaciones en esta categoría. Carga un archivo .glb con animaciones en la pestaña Modelo 3D.
              </div>
            ) : (
              filteredClips.map((clip) => {
                const isActive = activeAnimation === clip.originalName;
                const badgeColor =
                  clip.category === 'talk'
                    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/30'
                    : clip.category === 'idle'
                    ? 'bg-purple-950/80 text-purple-300 border-purple-500/30'
                    : clip.category === 'emotion'
                    ? 'bg-pink-950/80 text-pink-300 border-pink-500/30'
                    : clip.category === 'dance'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500/30'
                    : clip.category === 'locomotion'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700';

                return (
                  <div
                    key={clip.id}
                    className={`p-3 rounded-xl border transition ${
                      isActive
                        ? 'border-violet-500 bg-violet-950/30 shadow-md shadow-violet-900/20'
                        : 'border-slate-800/80 bg-slate-900/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{clip.cleanName}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${badgeColor}`}
                          >
                            {clip.categoryLabel}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 truncate max-w-[280px]">
                          {clip.originalName}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400">
                          <span>⏱ {clip.duration}s</span>
                          <span>🦴 {clip.tracksCount} pistas</span>
                          {clip.hasMorphTargets && (
                            <span className="text-cyan-400">✨ Incluye Morphs Faciales</span>
                          )}
                          <span className="text-violet-400 font-mono">Confianza: {clip.confidence}%</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onTriggerAnimation?.(clip.originalName)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-semibold transition active:scale-95 shrink-0 ${
                          isActive
                            ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{isActive ? 'Activa' : 'Probar'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ================= SUB-SECTION 2: SLOTS MAPPING ================= */}
      {activeSubSection === 'slots' && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300">Asignación de Estados Conversacionales:</span>
            <button
              type="button"
              onClick={handleAutoMap}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-semibold shadow-md transition active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-Mapear con IA</span>
            </button>
          </div>

          {autoMappedNotice && (
            <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-center font-medium">
              ✓ ¡Animaciones mapeadas automáticamente según su categoría semántica!
            </div>
          )}

          {/* Slots Configuration Grid */}
          <div className="space-y-2.5">
            {[
              {
                slot: 'idle' as keyof AnimationSlotMapping,
                label: 'Modo Reposo / Espera (Idle)',
                desc: 'Se reproduce en silencio mientras la IA escucha o espera al usuario',
                color: 'text-purple-400',
              },
              {
                slot: 'speaking' as keyof AnimationSlotMapping,
                label: 'Modo Habla / Gesticulación (Speaking)',
                desc: 'Se activa automáticamente cuando la IA genera respuesta de voz',
                color: 'text-cyan-400',
              },
              {
                slot: 'laugh' as keyof AnimationSlotMapping,
                label: 'Reacción de Risa / Alegría (Laugh)',
                desc: 'Se dispara con comentarios divertidos o bromas alegres',
                color: 'text-amber-400',
              },
              {
                slot: 'flirt' as keyof AnimationSlotMapping,
                label: 'Reacción Seductora / Coqueteo (Flirt)',
                desc: 'Se activa con cumplidos y frases íntimas',
                color: 'text-pink-400',
              },
              {
                slot: 'dance' as keyof AnimationSlotMapping,
                label: 'Baile / Expresión Especial (Dance)',
                desc: 'Para momentos de celebración o solicitud de baile',
                color: 'text-emerald-400',
              },
            ].map((s) => {
              const currentVal = animationSlotMapping ? animationSlotMapping[s.slot] : '';
              return (
                <div
                  key={s.slot}
                  className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold text-xs ${s.color}`}>{s.label}</span>
                    {currentVal && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        Asignado: {AnimationClassifier.cleanClipName(currentVal)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">{s.desc}</p>
                  <select
                    value={currentVal || ''}
                    onChange={(e) => handleSlotChange(s.slot, e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500 font-mono"
                  >
                    <option value="">-- Sin asignar (Usar por defecto) --</option>
                    {effectiveClips.map((c) => (
                      <option key={c.id} value={c.originalName}>
                        {c.cleanName} [{c.categoryLabel}] ({c.duration}s)
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= SUB-SECTION 3: PLAYBACK & BLENDING ================= */}
      {activeSubSection === 'playback' && (
        <div className="space-y-4 p-3.5 rounded-xl border border-slate-800 bg-slate-900/60">
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span className="font-semibold">Velocidad de Animación (TimeScale)</span>
              <span className="text-cyan-400 font-mono">{playbackSpeed.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.25"
              max="2.5"
              step="0.05"
              value={playbackSpeed}
              onChange={(e) => onChangePlaybackSpeed(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>0.25x (Cámara lenta)</span>
              <span>1.0x (Normal)</span>
              <span>2.5x (Rápido)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span className="font-semibold">Suavizado de Transición (Crossfade)</span>
              <span className="text-violet-400 font-mono">{crossFadeDuration.toFixed(2)}s</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1.5"
              step="0.05"
              value={crossFadeDuration}
              onChange={(e) => onChangeCrossFadeDuration(parseFloat(e.target.value))}
              className="w-full accent-violet-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>0.05s (Instantáneo)</span>
              <span>0.35s (Recomendado)</span>
              <span>1.50s (Lenta fusión)</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-200">Cinemática Orgánica:</span>
            <p>
              El motor de animación utiliza crossfading de curvas cúbicas Hermite y amortiguación exponencial (THREE.MathUtils.damp) para que las transiciones entre reposo, habla y coqueteo jamás tengan cortes secos.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
