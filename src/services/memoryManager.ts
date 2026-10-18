import { MemoryItem, ChatMessage } from '../types/character';

const MEMORY_STORAGE_PREFIX = 'cometa_memories_v2_';
const CHAT_STORAGE_PREFIX = 'cometa_chat_v2_';
const INTIMACY_STORAGE_PREFIX = 'cometa_intimacy_v2_';

// Initial preloaded memories for default immersion
const DEFAULT_MEMORIES: Record<string, MemoryItem[]> = {
  valeria: [
    {
      id: 'mem_v1',
      timestamp: Date.now() - 86400000,
      category: 'interaction',
      content: 'Compartieron una copa de vino borgoña junto al ventanal del ático.',
      importance: 4,
    },
    {
      id: 'mem_v2',
      timestamp: Date.now() - 43200000,
      category: 'preference',
      content: 'Prefiere la compañía íntima y las conversaciones nocturnas sin tapujos.',
      importance: 5,
    },
    {
      id: 'mem_v3',
      timestamp: Date.now() - 20000000,
      category: 'secret',
      content: 'Le prometió que siempre mantendría su lealtad en las sombras.',
      importance: 5,
    },
  ],
  luna: [
    {
      id: 'mem_l1',
      timestamp: Date.now() - 86400000,
      category: 'preference',
      content: 'Le fascina la adrenalina, la música synthwave y las carreras ilegales en Neo-Shinjuku.',
      importance: 4,
    },
    {
      id: 'mem_l2',
      timestamp: Date.now() - 36000000,
      category: 'topic',
      content: 'Hackearon juntos la red central de una megacorporación rival.',
      importance: 4,
    },
  ],
  lilith: [
    {
      id: 'mem_lil1',
      timestamp: Date.now() - 90000000,
      category: 'secret',
      content: 'Sellaron un pacto de sangre simbólico bajo la luz de la luna menguante.',
      importance: 5,
    },
  ],
  dante: [
    {
      id: 'mem_d1',
      timestamp: Date.now() - 80000000,
      category: 'interaction',
      content: 'Brindaron con whisky puro mientras contemplaban las luces de la bahía.',
      importance: 4,
    },
  ],
};

export class MemoryManager {
  static getMemories(characterId: string): MemoryItem[] {
    try {
      const data = localStorage.getItem(`${MEMORY_STORAGE_PREFIX}${characterId}`);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Error reading memories from storage:', e);
    }
    return DEFAULT_MEMORIES[characterId] || [];
  }

  static saveMemories(characterId: string, memories: MemoryItem[]) {
    try {
      localStorage.setItem(`${MEMORY_STORAGE_PREFIX}${characterId}`, JSON.stringify(memories));
    } catch (e) {
      console.error('Error saving memories:', e);
    }
  }

  static addMemory(
    characterId: string,
    content: string,
    category: MemoryItem['category'] = 'interaction',
    importance: number = 3
  ): MemoryItem {
    const memories = this.getMemories(characterId);
    
    // Avoid duplicate memories with identical text
    const exists = memories.some(
      (m) => m.content.toLowerCase().trim() === content.toLowerCase().trim()
    );
    if (exists) {
      return memories.find((m) => m.content.toLowerCase().trim() === content.toLowerCase().trim())!;
    }

    const newMemory: MemoryItem = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      category,
      content: content.trim(),
      importance: Math.min(5, Math.max(1, importance)),
    };

    memories.unshift(newMemory);
    this.saveMemories(characterId, memories);
    return newMemory;
  }

  static removeMemory(characterId: string, memoryId: string) {
    const memories = this.getMemories(characterId).filter((m) => m.id !== memoryId);
    this.saveMemories(characterId, memories);
    return memories;
  }

  static updateMemory(characterId: string, memoryId: string, updates: Partial<MemoryItem>) {
    const memories = this.getMemories(characterId).map((m) => {
      if (m.id === memoryId) {
        return { ...m, ...updates };
      }
      return m;
    });
    this.saveMemories(characterId, memories);
    return memories;
  }

  static clearMemories(characterId: string) {
    localStorage.removeItem(`${MEMORY_STORAGE_PREFIX}${characterId}`);
    return [];
  }

  // Intimacy Level methods
  static getIntimacy(characterId: string): number {
    try {
      const val = localStorage.getItem(`${INTIMACY_STORAGE_PREFIX}${characterId}`);
      if (val !== null) {
        return parseInt(val, 10);
      }
    } catch (e) {
      console.warn('Error reading intimacy:', e);
    }
    return 35; // default initial bond
  }

  static setIntimacy(characterId: string, level: number) {
    const clamped = Math.min(100, Math.max(0, level));
    try {
      localStorage.setItem(`${INTIMACY_STORAGE_PREFIX}${characterId}`, clamped.toString());
    } catch (e) {
      console.error('Error saving intimacy:', e);
    }
    return clamped;
  }

  static addIntimacy(characterId: string, delta: number): number {
    const current = this.getIntimacy(characterId);
    return this.setIntimacy(characterId, current + delta);
  }

  static getIntimacyTitle(level: number): { title: string; color: string; desc: string } {
    if (level < 20) {
      return {
        title: 'Misterio & Distancia',
        color: '#94a3b8',
        desc: 'Se estudian cautelosamente. Hay intriga latente.',
      };
    }
    if (level < 40) {
      return {
        title: 'Curiosidad Seductora',
        color: '#38bdf8',
        desc: 'Las miradas se cruzan con frecuencia. El interés es evidente.',
      };
    }
    if (level < 60) {
      return {
        title: 'Cómplice Nocturno',
        color: '#c084fc',
        desc: 'Comparten secretos íntimos. La confianza fluye sin reservas.',
      };
    }
    if (level < 85) {
      return {
        title: 'Pasión Desbordante',
        color: '#f43f5e',
        desc: 'Conexión eléctrica y carnal. Cada palabra enciende el ambiente.',
      };
    }
    return {
      title: 'Devoción Absoluta',
      color: '#fb7185',
      desc: 'Entrega sin límites ni censura. Lealtad y obsesión compartida.',
    };
  }

  // Chat message persistence
  static getChatHistory(characterId: string): ChatMessage[] {
    try {
      const data = localStorage.getItem(`${CHAT_STORAGE_PREFIX}${characterId}`);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Error reading chat:', e);
    }
    return [];
  }

  static saveChatHistory(characterId: string, history: ChatMessage[]) {
    try {
      localStorage.setItem(`${CHAT_STORAGE_PREFIX}${characterId}`, JSON.stringify(history));
    } catch (e) {
      console.error('Error saving chat:', e);
    }
  }

  static clearChatHistory(characterId: string) {
    localStorage.removeItem(`${CHAT_STORAGE_PREFIX}${characterId}`);
  }

  // Export / Import
  static exportData(characterId: string) {
    const data = {
      characterId,
      memories: this.getMemories(characterId),
      chatHistory: this.getChatHistory(characterId),
      intimacy: this.getIntimacy(characterId),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }

  static importData(characterId: string, jsonString: string) {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.memories)) {
        this.saveMemories(characterId, data.memories);
      }
      if (Array.isArray(data.chatHistory)) {
        this.saveChatHistory(characterId, data.chatHistory);
      }
      if (typeof data.intimacy === 'number') {
        this.setIntimacy(characterId, data.intimacy);
      }
      return true;
    } catch (e) {
      console.error('Failed to import memory JSON:', e);
      return false;
    }
  }
}
