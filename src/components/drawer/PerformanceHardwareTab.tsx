import React, { useEffect, useState } from 'react';
import {
  Zap,
  Gauge,
  Mic,
  Volume2,
  Camera,
  Check,
  Shield,
  Radio,
  RefreshCw,
} from 'lucide-react';
import { HardwareConfig, PerformanceProfileConfig } from '../../types/character';

interface PerformanceHardwareTabProps {
  performanceProfile: PerformanceProfileConfig;
  hardwareConfig: HardwareConfig;
  onPerformanceProfileChange: (updated: PerformanceProfileConfig) => void;
  onHardwareConfigChange: (updated: HardwareConfig) => void;
}

export const PerformanceHardwareTab: React.FC<PerformanceHardwareTabProps> = ({
  performanceProfile,
  hardwareConfig,
  onPerformanceProfileChange,
  onHardwareConfigChange,
}) => {
  const [audioDevices, setAudioDevices] = useState<{ id: string; label: string }[]>([]);
  const [testTonePlaying, setTestTonePlaying] = useState(false);

  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const inputs = devices
            .filter((d) => d.kind === 'audioinput')
            .map((d, i) => ({
              id: d.deviceId || `device_${i}`,
              label: d.label || `Micrófono ${i + 1}`,
            }));
          setAudioDevices(inputs);
        })
        .catch(() => {});
    }
  }, []);

  const playTestChime = () => {
    try {
      setTestTonePlaying(true);
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
      setTimeout(() => setTestTonePlaying(false), 450);
    } catch (e) {
      setTestTonePlaying(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in text-xs select-none">
      {/* Performance Profile Card */}
      <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-emerald-400" />
            <span>Perfil de Rendimiento Gráfico (FPS & WebGL)</span>
          </span>
          <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
            {performanceProfile.targetFps} FPS Objetivo
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            {
              id: 'ultra' as const,
              label: 'Ultra 60 FPS',
              desc: 'Calidad máxima con sombras suaves y antialiasing 2x',
              fps: 60,
              pixelRatio: 2.0,
            },
            {
              id: 'balanced' as const,
              label: 'Balanceado',
              desc: 'Rendimiento fluido optimizado para laptops y móviles',
              fps: 60,
              pixelRatio: 1.5,
            },
            {
              id: 'eco' as const,
              label: 'Modo Eco',
              desc: 'Bajo consumo de batería para dispositivos modestos',
              fps: 30,
              pixelRatio: 1.0,
            },
          ].map((p) => {
            const isSelected = performanceProfile.preset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() =>
                  onPerformanceProfileChange({
                    ...performanceProfile,
                    preset: p.id,
                    targetFps: p.fps,
                    pixelRatio: p.pixelRatio,
                  })
                }
                className={`p-2.5 rounded-xl border text-left transition ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500/15 text-white shadow-md'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>{p.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">{p.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hardware & Grok Ani Voice / Barge-In Settings */}
      <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3.5">
        <span className="font-semibold text-slate-200 flex items-center gap-1.5">
          <Mic className="w-4 h-4 text-cyan-400" />
          <span>Configuración de Entrada / Salida & Interrupción</span>
        </span>

        {/* Barge-In Toggle (Grok Ani feature) */}
        <div className="p-3 rounded-xl border border-cyan-500/30 bg-cyan-950/20 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-cyan-300">Interrupción Inmediata por Voz (Barge-In)</span>
            <button
              type="button"
              onClick={() =>
                onHardwareConfigChange({
                  ...hardwareConfig,
                  autoBargeIn: !hardwareConfig.autoBargeIn,
                })
              }
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                hardwareConfig.autoBargeIn
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {hardwareConfig.autoBargeIn ? 'ACTIVADO' : 'DESACTIVADO'}
            </button>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Si comienzas a hablar mientras el avatar está respondiendo, el frontend silencia inmediatamente el audio, limpia los buffers de reproducción y pasa al modo escucha en &lt; 50ms sin retraso.
          </p>
        </div>

        {/* Microphone Device Selector */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1">Micrófono Activo</label>
          <select
            value={hardwareConfig.micDeviceId}
            onChange={(e) =>
              onHardwareConfigChange({
                ...hardwareConfig,
                micDeviceId: e.target.value,
              })
            }
            className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="default">Micrófono por defecto del sistema</option>
            {audioDevices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Audio Output Test */}
        <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950/60">
          <div>
            <span className="font-semibold text-slate-200">Prueba de Salida de Audio</span>
            <p className="text-[11px] text-slate-400">Verifica la latencia del sintetizador de audio</p>
          </div>
          <button
            type="button"
            onClick={playTestChime}
            disabled={testTonePlaying}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition active:scale-95"
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{testTonePlaying ? 'Sonando...' : 'Test'}</span>
          </button>
        </div>

        {/* VAD Sensitivity Slider */}
        <div>
          <div className="flex justify-between text-xs text-slate-300 mb-1">
            <span>Sensibilidad de Detección de Voz (VAD)</span>
            <span className="text-cyan-400 font-mono">
              {Math.round(hardwareConfig.vadSensitivity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="0.9"
            step="0.05"
            value={hardwareConfig.vadSensitivity}
            onChange={(e) =>
              onHardwareConfigChange({
                ...hardwareConfig,
                vadSensitivity: parseFloat(e.target.value),
              })
            }
            className="w-full accent-cyan-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
            <span>Menos sensible (ambientes ruidosos)</span>
            <span>Más sensible (habla suave)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
