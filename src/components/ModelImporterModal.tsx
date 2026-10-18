import React, { useRef, useState } from 'react';
import { Box, Upload, X, CheckCircle, FileCode, Play, AlertCircle } from 'lucide-react';

interface ModelImporterModalProps {
  currentModelName?: string;
  loadedAnimations?: string[];
  onSelectModelFile: (file: File) => void;
  onResetToProcedural: () => void;
  onClose: () => void;
}

export const ModelImporterModal: React.FC<ModelImporterModalProps> = ({
  currentModelName,
  loadedAnimations = [],
  onSelectModelFile,
  onResetToProcedural,
  onClose,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const name = file.name.toLowerCase();
    if (name.endsWith('.glb') || name.endsWith('.gltf') || name.endsWith('.vrm') || name.endsWith('.obj')) {
      setErrorMessage(null);
      onSelectModelFile(file);
      onClose();
    } else {
      setErrorMessage('Por favor selecciona un archivo con formato .glb, .gltf, .vrm o .obj');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0f172a] border border-slate-700/60 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Cargar Modelo 3D (GLTF / VRM / OBJ)
              </h2>
              <p className="text-xs text-slate-400">Importa tus propios avatares con animaciones personalizadas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Active Model Status */}
          {currentModelName ? (
            <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
                  <CheckCircle className="w-4 h-4" />
                  Modelo Personalizado Activo
                </div>
                <p className="text-sm font-medium text-white">{currentModelName}</p>
                {loadedAnimations.length > 0 && (
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Play className="w-3 h-3 text-cyan-400" />
                    {loadedAnimations.length} animaciones detectadas
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  onResetToProcedural();
                  onClose();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Volver al Avatar Base
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Usando el motor procedural de alta fidelidad Three.js con morphs y ropa interactiva.
            </div>
          )}

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2.5 ${
              dragActive
                ? 'border-cyan-400 bg-cyan-500/10'
                : 'border-slate-700 hover:border-slate-500 bg-slate-900/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".glb,.gltf,.vrm,.obj"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Arrastra y suelta tu archivo 3D aquí</p>
              <p className="text-xs text-slate-400 mt-0.5">o haz clic para explorar en tu dispositivo</p>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 mt-1">
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] font-mono text-cyan-300">.GLB</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] font-mono text-cyan-300">.GLTF</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] font-mono text-violet-300">.VRM</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] font-mono text-slate-300">.OBJ</span>
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 space-y-1.5 text-xs text-slate-400">
            <p className="font-semibold text-slate-300 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              Compatibilidad de Formatos:
            </p>
            <ul className="list-disc list-inside space-y-0.5 pl-1">
              <li><strong>VRM / GLTF:</strong> Los modelos humanoides cargan sus esqueletos y animaciones automáticas.</li>
              <li><strong>Centrado automático:</strong> El visor auto-escala el modelo para ajustarse al escenario y la iluminación PBR.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-5 py-3 border-t border-slate-800 bg-slate-900/80">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
