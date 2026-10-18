import React, { useState } from 'react';
import {
  Brain,
  Heart,
  Plus,
  Trash2,
  X,
  Download,
  Upload,
  Sparkles,
  Tag,
  Star,
  Check,
} from 'lucide-react';
import { MemoryItem } from '../types/character';
import { MemoryManager } from '../services/memoryManager';

interface MemoryManagerModalProps {
  characterId: string;
  characterName: string;
  memories: MemoryItem[];
  intimacyLevel: number;
  onMemoriesUpdated: (memories: MemoryItem[]) => void;
  onIntimacyUpdated: (level: number) => void;
  onClose: () => void;
}

export const MemoryManagerModal: React.FC<MemoryManagerModalProps> = ({
  characterId,
  characterName,
  memories,
  intimacyLevel,
  onMemoriesUpdated,
  onIntimacyUpdated,
  onClose,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | MemoryItem['category']>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryItem['category']>('preference');
  const [newImportance, setNewImportance] = useState(4);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const intimacyInfo = MemoryManager.getIntimacyTitle(intimacyLevel);

  const filteredMemories = activeFilter === 'all'
    ? memories
    : memories.filter((m) => m.category === activeFilter);

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    const added = MemoryManager.addMemory(characterId, newContent, newCategory, newImportance);
    const updated = [added, ...memories.filter((m) => m.id !== added.id)];
    onMemoriesUpdated(updated);
    setNewContent('');
    setIsAdding(false);
  };

  const handleDeleteMemory = (id: string) => {
    const updated = MemoryManager.removeMemory(characterId, id);
    onMemoriesUpdated(updated);
  };

  const handleClearAll = () => {
    if (window.confirm(`¿Seguro que deseas reiniciar los recuerdos de ${characterName}?`)) {
      const updated = MemoryManager.clearMemories(characterId);
      onMemoriesUpdated(updated);
    }
  };

  const handleExport = () => {
    const data = MemoryManager.exportData(characterId);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cometa_memoria_${characterId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const success = MemoryManager.importData(characterId, text);
      if (success) {
        onMemoriesUpdated(MemoryManager.getMemories(characterId));
        onIntimacyUpdated(MemoryManager.getIntimacy(characterId));
        setImportStatus('¡Memoria importada con éxito!');
        setTimeout(() => setImportStatus(null), 3000);
      } else {
        setImportStatus('Error en el formato del archivo');
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  const categoryLabels: Record<MemoryItem['category'], { label: string; color: string }> = {
    preference: { label: 'Preferencia / Gusto', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    topic: { label: 'Tema Discutido', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    interaction: { label: 'Interacción / Momento', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
    secret: { label: 'Secreto Revelado', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-[#0f172a] border border-slate-700/60 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-pink-600 flex items-center justify-center text-white">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                Banco de Memoria Persistente
              </h2>
              <p className="text-xs text-slate-400">Recuerdos, preferencias y nivel de afinidad con {characterName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Intimacy & Relationship Status Banner */}
        <div className="p-4 bg-gradient-to-r from-purple-950/40 via-slate-900 to-pink-950/40 border-b border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
              <span className="text-sm font-semibold text-white">{intimacyInfo.title}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-mono">
                {intimacyLevel}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={intimacyLevel}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  MemoryManager.setIntimacy(characterId, val);
                  onIntimacyUpdated(val);
                }}
                className="w-24 sm:w-32 accent-pink-500 cursor-pointer"
                title="Ajustar afinidad manualmente"
              />
            </div>
          </div>
          <p className="text-xs text-slate-300">{intimacyInfo.desc}</p>

          <div className="w-full bg-slate-800/80 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
              style={{ width: `${intimacyLevel}%` }}
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-950/40 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg transition ${
                activeFilter === 'all'
                  ? 'bg-purple-600 text-white font-medium'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Todos ({memories.length})
            </button>
            <button
              onClick={() => setActiveFilter('preference')}
              className={`px-2.5 py-1 rounded-lg transition ${
                activeFilter === 'preference'
                  ? 'bg-amber-600 text-white font-medium'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Preferencias
            </button>
            <button
              onClick={() => setActiveFilter('topic')}
              className={`px-2.5 py-1 rounded-lg transition ${
                activeFilter === 'topic'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Temas
            </button>
            <button
              onClick={() => setActiveFilter('interaction')}
              className={`px-2.5 py-1 rounded-lg transition ${
                activeFilter === 'interaction'
                  ? 'bg-pink-600 text-white font-medium'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Interacciones
            </button>
            <button
              onClick={() => setActiveFilter('secret')}
              className={`px-2.5 py-1 rounded-lg transition ${
                activeFilter === 'secret'
                  ? 'bg-purple-700 text-white font-medium'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Secretos
            </button>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-medium transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nuevo Recuerdo</span>
          </button>
        </div>

        {/* Add Memory Form */}
        {isAdding && (
          <form onSubmit={handleAddMemory} className="p-4 border-b border-slate-800 bg-slate-900/90 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Grabar Nuevo Recuerdo en la Mente de {characterName}
            </h3>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Ejemplo: Le gusta que le susurren al oído, o compartieron un vino tinto en la terraza..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Categoría:</span>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
                >
                  <option value="preference">Preferencia / Gusto</option>
                  <option value="topic">Tema Discutido</option>
                  <option value="interaction">Interacción / Momento</option>
                  <option value="secret">Secreto Revelado</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Importancia:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewImportance(star)}
                      className="p-0.5 text-amber-400"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          star <= newImportance ? 'fill-amber-400' : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-semibold"
                >
                  Guardar Recuerdo
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Memory List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {importStatus && (
            <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs text-center">
              {importStatus}
            </div>
          )}

          {filteredMemories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
              <Brain className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No hay recuerdos registrados en esta categoría aún.</p>
              <p className="text-xs text-slate-600 mt-1">
                La IA aprende y almacena automáticamente información clave mientras charlas.
              </p>
            </div>
          ) : (
            filteredMemories.map((m) => {
              const cat = categoryLabels[m.category] || categoryLabels.preference;
              return (
                <div
                  key={m.id}
                  className="group flex items-start justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900/90 transition gap-3"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cat.color}`}>
                        {cat.label}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(m.timestamp).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-0.5 ml-auto sm:ml-0">
                        {Array.from({ length: m.importance }).map((_, i) => (
                          <Star key={i} className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{m.content}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteMemory(m.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition opacity-80 group-hover:opacity-100"
                    title="Eliminar recuerdo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-950/80 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 transition"
              title="Descargar copia de seguridad en JSON"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Exportar JSON</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 cursor-pointer transition">
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Importar</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>

          <div className="flex items-center gap-2">
            {memories.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition"
              >
                Limpiar Memoria
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
