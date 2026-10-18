import React, { useState } from 'react';
import {
  Box,
  Sliders,
  Move3d,
  Layers,
  Palette,
  Maximize2,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Eye,
  Smile,
  Crown,
  Upload,
} from 'lucide-react';
import { ModelTransformConfig, MorphTargetItem } from '../../types/character';

interface ModelCustomizerTabProps {
  currentModelName?: string;
  modelTransform: ModelTransformConfig;
  morphTargetsList?: MorphTargetItem[];
  onModelTransformChange: (updated: ModelTransformConfig) => void;
  onMorphTargetChange?: (id: string, weight: number) => void;
  onResetMorphs?: () => void;
  onSelectModelFile: (file: File) => void;
  onResetToProcedural: () => void;
}

export const ModelCustomizerTab: React.FC<ModelCustomizerTabProps> = ({
  currentModelName,
  modelTransform,
  morphTargetsList = [],
  onModelTransformChange,
  onMorphTargetChange,
  onResetMorphs,
  onSelectModelFile,
  onResetToProcedural,
}) => {
  const [subSection, setSubSection] = useState<'transform' | 'morphs' | 'materials' | 'importer'>('transform');
  const [morphCategoryFilter, setMorphCategoryFilter] = useState<'all' | 'mouth' | 'eyes' | 'brows' | 'other'>('all');
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

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

  const handleResetTransforms = () => {
    onModelTransformChange({
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
    });
  };

  const filteredMorphs =
    morphCategoryFilter === 'all'
      ? morphTargetsList
      : morphTargetsList.filter((m) => m.category === morphCategoryFilter);

  const colorPresets = [
    '#ffffff', '#fceee9', '#faebd7', '#f87171',
    '#fb923c', '#facc15', '#4ade80', '#22d3ee',
    '#818cf8', '#c084fc', '#f472b6', '#334155',
  ];

  return (
    <div className="space-y-4 animate-in fade-in text-xs select-none">
      {/* Header Info */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border border-blue-500/30">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-blue-300 flex items-center gap-1.5">
            <Move3d className="w-4 h-4 text-cyan-400" />
            <span>Personalización Avanzada del Modelo 3D</span>
          </span>
          <span className="text-[11px] font-mono text-blue-300 bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-500/30">
            {currentModelName ? 'Modelo Custom' : 'Avatar Base'}
          </span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          Modifica proporciones, elevación sobre el suelo, texturas y controla sliders de blendshapes faciales en tiempo real.
        </p>
      </div>

      {/* Sub-tab Switcher */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
        <button
          type="button"
          onClick={() => setSubSection('transform')}
          className={`flex-1 py-1.5 rounded-lg font-medium transition text-center ${
            subSection === 'transform'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Transformación
        </button>
        <button
          type="button"
          onClick={() => setSubSection('morphs')}
          className={`flex-1 py-1.5 rounded-lg font-medium transition text-center ${
            subSection === 'morphs'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Blendshapes ({morphTargetsList.length})
        </button>
        <button
          type="button"
          onClick={() => setSubSection('materials')}
          className={`flex-1 py-1.5 rounded-lg font-medium transition text-center ${
            subSection === 'materials'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Acabados
        </button>
        <button
          type="button"
          onClick={() => setSubSection('importer')}
          className={`flex-1 py-1.5 rounded-lg font-medium transition text-center ${
            subSection === 'importer'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Importar
        </button>
      </div>

      {/* ================= SUB-SECTION 1: TRANSFORM ================= */}
      {subSection === 'transform' && (
        <div className="space-y-4 p-3.5 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-200">Escala & Alineación:</span>
            <button
              type="button"
              onClick={handleResetTransforms}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restablecer</span>
            </button>
          </div>

          {/* Scale */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Escala General del Modelo</span>
              <span className="text-cyan-400 font-mono">{modelTransform.scale.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="2.5"
              step="0.05"
              value={modelTransform.scale}
              onChange={(e) =>
                onModelTransformChange({
                  ...modelTransform,
                  scale: parseFloat(e.target.value),
                })
              }
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Floor Offset Y */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Elevación Vertical / Ajuste de Suelo (Offset Y)</span>
              <span className="text-blue-400 font-mono">{modelTransform.offsetY.toFixed(2)}m</span>
            </div>
            <input
              type="range"
              min="-1.0"
              max="1.0"
              step="0.02"
              value={modelTransform.offsetY}
              onChange={(e) =>
                onModelTransformChange({
                  ...modelTransform,
                  offsetY: parseFloat(e.target.value),
                })
              }
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Offset X & Z */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Centrado X</span>
                <span className="text-slate-400 font-mono">{modelTransform.offsetX.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-1.0"
                max="1.0"
                step="0.02"
                value={modelTransform.offsetX}
                onChange={(e) =>
                  onModelTransformChange({
                    ...modelTransform,
                    offsetX: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-slate-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Profundidad Z</span>
                <span className="text-slate-400 font-mono">{modelTransform.offsetZ.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-1.0"
                max="1.0"
                step="0.02"
                value={modelTransform.offsetZ}
                onChange={(e) =>
                  onModelTransformChange({
                    ...modelTransform,
                    offsetZ: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-slate-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Rotation Y */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Orientación Frontal (Rotación Y)</span>
              <span className="text-indigo-400 font-mono">
                {Math.round((modelTransform.rotationY * 180) / Math.PI)}°
              </span>
            </div>
            <input
              type="range"
              min={-Math.PI}
              max={Math.PI}
              step="0.05"
              value={modelTransform.rotationY}
              onChange={(e) =>
                onModelTransformChange({
                  ...modelTransform,
                  rotationY: parseFloat(e.target.value),
                })
              }
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* ================= SUB-SECTION 2: BLENDSHAPES / MORPH TARGETS ================= */}
      {subSection === 'morphs' && (
        <div className="space-y-3">
          {morphTargetsList.length === 0 ? (
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-center text-slate-400 space-y-2">
              <Smile className="w-6 h-6 mx-auto text-slate-500" />
              <p>El modelo actual no contiene pistas de morph targets (Blendshapes/ARKit).</p>
              <p className="text-[11px] text-slate-500">
                Al importar un modelo VRM o Ready Player Me con expresiones faciales, aquí aparecerán todos los sliders de boca, ojos y cejas.
              </p>
            </div>
          ) : (
            <>
              {/* Category selector */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[11px]">
                  {[
                    { id: 'all', label: 'Todos' },
                    { id: 'mouth', label: 'Boca / Habla' },
                    { id: 'eyes', label: 'Ojos' },
                    { id: 'brows', label: 'Cejas' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setMorphCategoryFilter(c.id as any)}
                      className={`px-2 py-0.5 rounded-lg transition ${
                        morphCategoryFilter === c.id
                          ? 'bg-blue-600 text-white font-medium'
                          : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                {onResetMorphs && (
                  <button
                    type="button"
                    onClick={onResetMorphs}
                    className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Sliders list */}
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                {filteredMorphs.map((morph) => (
                  <div
                    key={morph.id}
                    className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1"
                  >
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-200">{morph.name}</span>
                      <span className="text-cyan-400 font-mono">
                        {Math.round(morph.weight * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.02"
                      value={morph.weight}
                      onChange={(e) =>
                        onMorphTargetChange?.(morph.id, parseFloat(e.target.value))
                      }
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ================= SUB-SECTION 3: MATERIALS & SHADERS ================= */}
      {subSection === 'materials' && (
        <div className="space-y-4 p-3.5 rounded-xl border border-slate-800 bg-slate-900/60">
          {/* Wireframe toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950/60">
            <div>
              <span className="font-semibold text-slate-200">Modo Malla (Wireframe)</span>
              <p className="text-[11px] text-slate-400">Inspecciona la topología de polígonos del modelo</p>
            </div>
            <button
              type="button"
              onClick={() =>
                onModelTransformChange({
                  ...modelTransform,
                  wireframe: !modelTransform.wireframe,
                })
              }
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                modelTransform.wireframe
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {modelTransform.wireframe ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Roughness Modifier */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Acabado de Superficie / Rugosidad</span>
              <span className="text-cyan-400 font-mono">
                {modelTransform.roughnessMod > 0 ? `+${modelTransform.roughnessMod}` : modelTransform.roughnessMod}
              </span>
            </div>
            <input
              type="range"
              min="-0.4"
              max="0.4"
              step="0.05"
              value={modelTransform.roughnessMod}
              onChange={(e) =>
                onModelTransformChange({
                  ...modelTransform,
                  roughnessMod: parseFloat(e.target.value),
                })
              }
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>Brillante / Húmedo</span>
              <span>Por Defecto</span>
              <span>Mate / Sedoso</span>
            </div>
          </div>

          {/* Metalness Modifier */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Reflejo Metálico</span>
              <span className="text-purple-400 font-mono">
                {modelTransform.metalnessMod > 0 ? `+${modelTransform.metalnessMod}` : modelTransform.metalnessMod}
              </span>
            </div>
            <input
              type="range"
              min="-0.3"
              max="0.6"
              step="0.05"
              value={modelTransform.metalnessMod}
              onChange={(e) =>
                onModelTransformChange({
                  ...modelTransform,
                  metalnessMod: parseFloat(e.target.value),
                })
              }
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>

          {/* Tint Color */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Tinte / Filtro de Color del Avatar
            </label>
            <div className="flex flex-wrap gap-2">
              {colorPresets.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() =>
                    onModelTransformChange({
                      ...modelTransform,
                      colorTint: c,
                    })
                  }
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full border-2 transition ${
                    modelTransform.colorTint === c ? 'border-white scale-110 shadow-md' : 'border-slate-700'
                  }`}
                />
              ))}
              <input
                type="color"
                value={modelTransform.colorTint}
                onChange={(e) =>
                  onModelTransformChange({
                    ...modelTransform,
                    colorTint: e.target.value,
                  })
                }
                className="w-6 h-6 rounded-full border-0 p-0 cursor-pointer bg-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-SECTION 4: IMPORTER ================= */}
      {subSection === 'importer' && (
        <div className="space-y-4">
          {currentModelName ? (
            <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold">
                <CheckCircle className="w-4 h-4" />
                <span>Modelo Actual: {currentModelName}</span>
              </div>
              <button
                type="button"
                onClick={onResetToProcedural}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
              >
                Volver al Avatar Base Andy VR
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-slate-300 text-[11px]">
              Actualmente usando el avatar procedural optimizado para Andy VR con ropa, pelo y morphs dinámicos.
            </div>
          )}

          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              handleFileDrop(e.dataTransfer.files);
            }}
            className={`border-2 border-dashed rounded-2xl p-5 text-center transition flex flex-col items-center justify-center gap-2 ${
              dragActive
                ? 'border-blue-400 bg-blue-500/10'
                : 'border-slate-800 hover:border-slate-600 bg-slate-900/40'
            }`}
          >
            <Box className="w-8 h-8 text-blue-400" />
            <div>
              <p className="font-semibold text-slate-200">Arrastra tu archivo 3D aquí</p>
              <p className="text-[11px] text-slate-400">Compatible con .GLB, .GLTF, .VRM y .OBJ</p>
            </div>
            <label className="mt-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium cursor-pointer transition">
              <span>Seleccionar Archivo</span>
              <input
                type="file"
                accept=".glb,.gltf,.vrm,.obj"
                className="hidden"
                onChange={(e) => handleFileDrop(e.target.files)}
              />
            </label>
          </div>

          {fileError && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{fileError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
