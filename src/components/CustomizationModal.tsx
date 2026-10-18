import React, { useState } from 'react';
import {
  Sparkles,
  Scissors,
  Smile,
  Shirt,
  Crown,
  Sun,
  X,
  Palette,
  Eye,
  Check,
} from 'lucide-react';
import {
  AccessoryType,
  CustomizationSettings,
  HairstyleType,
  OutfitStyle,
  ScenePreset,
} from '../types/character';

interface CustomizationModalProps {
  customization: CustomizationSettings;
  onChange: (updated: CustomizationSettings) => void;
  onClose: () => void;
}

export const CustomizationModal: React.FC<CustomizationModalProps> = ({
  customization,
  onChange,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'hair' | 'face' | 'clothing' | 'accessory' | 'environment'>('clothing');

  const updateSetting = <K extends keyof CustomizationSettings>(
    section: K,
    values: Partial<CustomizationSettings[K]>
  ) => {
    onChange({
      ...customization,
      [section]: {
        ...customization[section],
        ...values,
      },
    });
  };

  const hairstyles: { id: HairstyleType; label: string; desc: string }[] = [
    { id: 'long_waves', label: 'Melena Ondulada', desc: 'Mechones sedosos y ondulados con volumen' },
    { id: 'cyber_bob', label: 'Bob Cyberpunk', desc: 'Corte asimétrico con mechas luminosas' },
    { id: 'high_ponytail', label: 'Coleta Alta', desc: 'Cola de caballo atrevida y estilizada' },
    { id: 'wild_short', label: 'Corto Rebelde', desc: 'Puntas texturizadas y actitud desafiante' },
    { id: 'gothic_updo', label: 'Moño Gótico', desc: 'Recogido aristocrático con mechones sueltos' },
    { id: 'braided_crown', label: 'Corona Trenzada', desc: 'Doble trenza imperial sofisticada' },
  ];

  const outfits: { id: OutfitStyle; label: string; desc: string }[] = [
    { id: 'scarlet_gown', label: 'Vestido de Gala Escarlata', desc: 'Seda drapeada con pronunciada abertura de pierna' },
    { id: 'cyber_leather', label: 'Cuero & Circuitos Neón', desc: 'Chaqueta entallada con ribetes luminosos activos' },
    { id: 'gothic_corset', label: 'Corsé Gótico de Encaje', desc: 'Corsé reforzado con falda escalonada de terciopelo' },
    { id: 'noir_lingerie', label: 'Lencería Noir & Ligueros', desc: 'Diseño sensual con encaje translúcido y tirantes' },
    { id: 'casual_silk', label: 'Vestido Lencero de Satén', desc: 'Caída fluida minimalista y hombros descubiertos' },
    { id: 'combat_bodysuit', label: 'Mono Táctico Ajustado', desc: 'Material reflectante de alta tecnología' },
  ];

  const accessories: { id: AccessoryType; label: string; icon: string }[] = [
    { id: 'choker_gem', label: 'Gargantilla con Gema', icon: '💎' },
    { id: 'horns', label: 'Cuernos de Súcubo', icon: '😈' },
    { id: 'cyber_visor', label: 'Visor Holográfico', icon: '🕶️' },
    { id: 'earrings', label: 'Pendientes de Cristal', icon: '✨' },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-[#0f172a] border border-slate-700/60 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-500 to-violet-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                Personalización del Personaje
              </h2>
              <p className="text-xs text-slate-400">Modifica vestuario, cabello, rostro y ambiente en tiempo real</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('clothing')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'clothing'
                ? 'border-pink-500 text-pink-400 bg-pink-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shirt className="w-4 h-4" />
            Vestuario & Ropa
          </button>
          <button
            onClick={() => setActiveTab('hair')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'hair'
                ? 'border-violet-500 text-violet-400 bg-violet-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scissors className="w-4 h-4" />
            Peinado & Mechas
          </button>
          <button
            onClick={() => setActiveTab('face')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'face'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smile className="w-4 h-4" />
            Rostro & Mirada
          </button>
          <button
            onClick={() => setActiveTab('accessory')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'accessory'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crown className="w-4 h-4" />
            Accesorios
          </button>
          <button
            onClick={() => setActiveTab('environment')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'environment'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sun className="w-4 h-4" />
            Ambiente & Escena
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* TAB: CLOTHING */}
          {activeTab === 'clothing' && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Estilo de Vestuario
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {outfits.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => updateSetting('clothing', { outfit: o.id })}
                      className={`flex flex-col text-left p-3 rounded-xl border transition ${
                        customization.clothing.outfit === o.id
                          ? 'border-pink-500 bg-pink-500/10 text-white'
                          : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-semibold text-sm flex items-center justify-between">
                        {o.label}
                        {customization.clothing.outfit === o.id && <Check className="w-4 h-4 text-pink-400" />}
                      </span>
                      <span className="text-xs text-slate-400 mt-1">{o.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Outfit Colors */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Color Principal de la Prenda
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {colorPresets.map((c) => (
                    <button
                      key={c}
                      onClick={() => updateSetting('clothing', { primaryColor: c })}
                      style={{ backgroundColor: c }}
                      className={`w-7 h-7 rounded-full border-2 transition ${
                        customization.clothing.primaryColor === c ? 'border-white scale-110 shadow-lg' : 'border-slate-700'
                      }`}
                    />
                  ))}
                  <input
                    type="color"
                    value={customization.clothing.primaryColor}
                    onChange={(e) => updateSetting('clothing', { primaryColor: e.target.value })}
                    className="w-7 h-7 rounded-full border-0 p-0 cursor-pointer bg-transparent"
                    title="Color personalizado"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Color Secundario / Ribete
                </label>
                <div className="flex flex-wrap gap-2">
                  {colorPresets.map((c) => (
                    <button
                      key={c}
                      onClick={() => updateSetting('clothing', { secondaryColor: c })}
                      style={{ backgroundColor: c }}
                      className={`w-7 h-7 rounded-full border-2 transition ${
                        customization.clothing.secondaryColor === c ? 'border-white scale-110 shadow-lg' : 'border-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Layer Toggles */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Capas & Elementos Desmontables
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { key: 'jacket' as const, label: 'Capa / Chaqueta' },
                    { key: 'boots' as const, label: 'Botas de Tacón' },
                    { key: 'jewelry' as const, label: 'Joyería Escote' },
                    { key: 'gloves' as const, label: 'Guantes de Seda' },
                    { key: 'aura' as const, label: 'Aura Resplandeciente' },
                  ].map((layer) => {
                    const isChecked = customization.clothing.layers[layer.key];
                    return (
                      <button
                        key={layer.key}
                        onClick={() =>
                          updateSetting('clothing', {
                            layers: {
                              ...customization.clothing.layers,
                              [layer.key]: !isChecked,
                            },
                          })
                        }
                        className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition ${
                          isChecked
                            ? 'border-pink-500/60 bg-pink-500/15 text-pink-300'
                            : 'border-slate-800 bg-slate-900/40 text-slate-400'
                        }`}
                      >
                        {layer.label}
                        <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${isChecked ? 'bg-pink-500 text-white' : 'bg-slate-800'}`}>
                          {isChecked && '✓'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB: HAIR */}
          {activeTab === 'hair' && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Estilo de Peinado
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {hairstyles.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => updateSetting('hair', { style: h.id })}
                      className={`flex flex-col text-left p-3 rounded-xl border transition ${
                        customization.hair.style === h.id
                          ? 'border-violet-500 bg-violet-500/10 text-white'
                          : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-semibold text-sm flex items-center justify-between">
                        {h.label}
                        {customization.hair.style === h.id && <Check className="w-4 h-4 text-violet-400" />}
                      </span>
                      <span className="text-xs text-slate-400 mt-1">{h.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Tono del Cabello
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {colorPresets.map((c) => (
                    <button
                      key={c}
                      onClick={() => updateSetting('hair', { color: c })}
                      style={{ backgroundColor: c }}
                      className={`w-7 h-7 rounded-full border-2 transition ${
                        customization.hair.color === c ? 'border-white scale-110 shadow-lg' : 'border-slate-700'
                      }`}
                    />
                  ))}
                  <input
                    type="color"
                    value={customization.hair.color}
                    onChange={(e) => updateSetting('hair', { color: e.target.value })}
                    className="w-7 h-7 rounded-full border-0 p-0 cursor-pointer bg-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Color de Mechas / Reflejos
                </label>
                <div className="flex flex-wrap gap-2">
                  {colorPresets.map((c) => (
                    <button
                      key={c}
                      onClick={() => updateSetting('hair', { secondaryColor: c })}
                      style={{ backgroundColor: c }}
                      className={`w-7 h-7 rounded-full border-2 transition ${
                        customization.hair.secondaryColor === c ? 'border-white scale-110 shadow-lg' : 'border-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: FACE */}
          {activeTab === 'face' && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  Color de Ojos / Iris
                </label>
                <div className="flex flex-wrap gap-2">
                  {eyePresets.map((c) => (
                    <button
                      key={c}
                      onClick={() => updateSetting('face', { eyeColor: c })}
                      style={{ backgroundColor: c }}
                      className={`w-7 h-7 rounded-full border-2 transition ${
                        customization.face.eyeColor === c ? 'border-white scale-110 shadow-lg' : 'border-slate-700'
                      }`}
                    />
                  ))}
                  <input
                    type="color"
                    value={customization.face.eyeColor}
                    onChange={(e) => updateSetting('face', { eyeColor: e.target.value })}
                    className="w-7 h-7 rounded-full border-0 p-0 cursor-pointer bg-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Tono de Piel
                </label>
                <div className="flex flex-wrap gap-2">
                  {skinPresets.map((c) => (
                    <button
                      key={c}
                      onClick={() => updateSetting('face', { skinTone: c })}
                      style={{ backgroundColor: c }}
                      className={`w-8 h-8 rounded-full border-2 transition ${
                        customization.face.skinTone === c ? 'border-white scale-110 shadow-lg' : 'border-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Labial / Tono de Labios
                </label>
                <div className="flex flex-wrap gap-2">
                  {lipsPresets.map((c) => (
                    <button
                      key={c}
                      onClick={() => updateSetting('face', { lipstickColor: c })}
                      style={{ backgroundColor: c }}
                      className={`w-7 h-7 rounded-full border-2 transition ${
                        customization.face.lipstickColor === c ? 'border-white scale-110 shadow-lg' : 'border-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  <span>Rubor & Calidez de Mejillas</span>
                  <span className="text-pink-400">{Math.round(customization.face.blushIntensity * 100)}%</span>
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

          {/* TAB: ACCESSORY */}
          {activeTab === 'accessory' && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Accesorio Distintivo
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {accessories.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => updateSetting('accessory', { type: a.id })}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                        customization.accessory.type === a.id
                          ? 'border-amber-500 bg-amber-500/10 text-white'
                          : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xl">{a.icon}</span>
                      <span className="font-semibold text-sm">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Color del Accesorio
                </label>
                <div className="flex flex-wrap gap-2">
                  {colorPresets.map((c) => (
                    <button
                      key={c}
                      onClick={() => updateSetting('accessory', { color: c })}
                      style={{ backgroundColor: c }}
                      className={`w-7 h-7 rounded-full border-2 transition ${
                        customization.accessory.color === c ? 'border-white scale-110 shadow-lg' : 'border-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/40">
                <span className="text-sm font-medium text-slate-200">Resplandor Emisivo / Luz Activa</span>
                <button
                  onClick={() => updateSetting('accessory', { glowing: !customization.accessory.glowing })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    customization.accessory.glowing ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {customization.accessory.glowing ? 'ACTIVADO' : 'APAGADO'}
                </button>
              </div>
            </div>
          )}

          {/* TAB: ENVIRONMENT */}
          {activeTab === 'environment' && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Atmósfera & Escenario
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: 'penthouse_luxury' as ScenePreset, label: 'Penthouse de Lujo', desc: 'Luces cálidas sobre la metrópolis nocturna' },
                    { id: 'cyber_neon' as ScenePreset, label: 'Neo Club Cyberpunk', desc: 'Resplandores violeta, cian y lluvia exterior' },
                    { id: 'crimson_dungeon' as ScenePreset, label: 'Cámara Carmesí', desc: 'Velas, sombras misteriosas y fuego púrpura' },
                    { id: 'moonlit_balcony' as ScenePreset, label: 'Balcón Iluminado por la Luna', desc: 'Noche estrellada, bruma tenue plateada' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => updateSetting('environment', { preset: preset.id })}
                      className={`flex flex-col text-left p-3 rounded-xl border transition ${
                        customization.environment.preset === preset.id
                          ? 'border-emerald-500 bg-emerald-500/10 text-white'
                          : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-semibold text-sm flex items-center justify-between">
                        {preset.label}
                        {customization.environment.preset === preset.id && <Check className="w-4 h-4 text-emerald-400" />}
                      </span>
                      <span className="text-xs text-slate-400 mt-1">{preset.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  <span>Temperatura de Luz</span>
                  <span className="text-emerald-400">{Math.round(customization.environment.lightWarmth * 100)}%</span>
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

        {/* Footer */}
        <div className="flex justify-end items-center px-5 py-3 border-t border-slate-800 bg-slate-900/80">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 text-white font-semibold text-sm shadow-lg shadow-violet-500/20 transition"
          >
            Listo / Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};
