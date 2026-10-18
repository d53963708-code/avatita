import { CharacterProfile, MemoryItem, ChatMessage, AnimationType, EmotionType, AIProviderConfig } from '../types/character';

export interface ChatResponse {
  reply: string;
  animation: AnimationType;
  emotion: EmotionType;
  newMemory: string | null;
  intimacyDelta: number;
}

export class ApiClient {
  static async testEndpoint(endpointUrl: string, apiKey?: string): Promise<{ success: boolean; latency?: number; message?: string; models?: string[]; error?: string }> {
    try {
      const response = await fetch('/api/test-endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpointUrl, apiKey }),
      });
      return await response.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  static async sendChatMessage(
    message: string,
    history: ChatMessage[],
    character: CharacterProfile,
    memoryBank: MemoryItem[],
    intimacyLevel: number,
    aiProviderConfig?: AIProviderConfig
  ): Promise<ChatResponse> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: history.slice(-10),
          characterProfile: {
            name: character.name,
            title: character.title,
            personality: character.personality,
            scenario: character.scenario,
          },
          memoryBank,
          intimacyLevel,
          aiProviderConfig,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server status ${response.status}`);
      }

      const data = await response.json();
      return {
        reply: data.reply || 'Me quedo sin palabras contemplándote...',
        animation: (data.animation as AnimationType) || 'talk',
        emotion: (data.emotion as EmotionType) || 'seductive',
        newMemory: data.newMemory || null,
        intimacyDelta: data.intimacyDelta || 2,
      };
    } catch (err) {
      console.warn('Backend API unavailable, executing local immersive response:', err);
      // Fallback offline dynamic replies based on character and intimacy
      return this.generateOfflineReply(message, character, intimacyLevel);
    }
  }

  static async analyzeImage(
    imageBase64: string,
    mimeType: string,
    prompt: string,
    character: CharacterProfile
  ): Promise<ChatResponse> {
    try {
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          prompt,
          characterProfile: {
            name: character.name,
            title: character.title,
            personality: character.personality,
          },
        }),
      });

      if (!response.ok) throw new Error('Image analysis failed');

      const data = await response.json();
      return {
        reply: data.reply || 'Vaya... lo que me muestras despierta sensaciones muy intensas.',
        animation: (data.animation as AnimationType) || 'flirt',
        emotion: (data.emotion as EmotionType) || 'seductive',
        newMemory: `Vio y elogió una imagen enviada por el usuario`,
        intimacyDelta: 3,
      };
    } catch (err) {
      console.warn('Using offline image analysis fallback:', err);
      return {
        reply: `He visto lo que me enviaste con total detalle... Tienes un gusto exquisito, y me fascina cómo compartes esto solo conmigo.`,
        animation: 'kiss_wink',
        emotion: 'seductive',
        newMemory: 'Compartió una imagen visual muy intrigante',
        intimacyDelta: 3,
      };
    }
  }

  static async generateTTS(text: string, voiceName: string = 'Kore'): Promise<string | null> {
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceName }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (data.audioBase64) {
        return `data:audio/wav;base64,${data.audioBase64}`;
      }
    } catch (err) {
      console.warn('Server TTS failed, falling back to Web Speech Synthesis:', err);
    }
    return null;
  }

  static playWebSpeech(text: string, gender: string = 'female', onStart?: () => void, onEnd?: () => void) {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/\[.*?\]/g, '').replace(/[\*_~]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-ES';
    utterance.rate = 0.95; // slightly slower, intimate cadence
    utterance.pitch = gender === 'female' ? 1.15 : 0.85;

    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find((v) => v.lang.startsWith('es') && (gender === 'female' ? /female|mujer|monica|helena|paulina/i.test(v.name) : /male|hombre|jorge|pablo/i.test(v.name)))
      || voices.find((v) => v.lang.startsWith('es'));
    if (esVoice) utterance.voice = esVoice;

    if (onStart) utterance.onstart = onStart;
    if (onEnd) utterance.onend = onEnd;
    utterance.onerror = () => onEnd?.();

    window.speechSynthesis.speak(utterance);
  }

  private static generateOfflineReply(
    message: string,
    character: CharacterProfile,
    intimacyLevel: number
  ): ChatResponse {
    const isHighIntimacy = intimacyLevel >= 60;
    const lower = message.toLowerCase();

    let reply = '';
    let animation: AnimationType = 'flirt';
    let emotion: EmotionType = 'seductive';

    if (lower.includes('hola') || lower.includes('buenas')) {
      reply = isHighIntimacy
        ? `Llegas justo a tiempo para hacerme temblar de deseo. No sabes cuánto extrañaba el sonido de tus pasos.`
        : `Hola, encanto. Me alegra verte entrar a mi espacio... Toma asiento a mi lado.`;
      animation = 'tease';
      emotion = 'smiling';
    } else if (lower.includes('te ves') || lower.includes('hermosa') || lower.includes('guap') || lower.includes('cuerpo')) {
      reply = `Mírame cuanto desees... Cada detalle, cada prenda está pensada para cautivar tus ojos y hacerte perder la compostura.`;
      animation = 'sensual_sway';
      emotion = 'seductive';
    } else if (lower.includes('baila') || lower.includes('danza') || lower.includes('muévete')) {
      reply = `¿Quieres verme bailar para ti? Solo si prometes no apartar tu mirada ni un solo instante...`;
      animation = 'dance';
      emotion = 'playful';
    } else if (lower.includes('beso') || lower.includes('besar') || lower.includes('tócame') || lower.includes('quiero')) {
      reply = `Ven aquí entonces... No me hagas esperar. Si cruzas esta distancia no habrá vuelta atrás.`;
      animation = 'kiss_wink';
      emotion = 'intense';
    } else {
      const general = [
        `Tus palabras tienen un magnetismo peligroso. Me encanta cómo me desafías y a la vez me seduces.`,
        `Adoro la forma en que piensas... Estar contigo me hace olvidar todo lo demás en este mundo.`,
        `Cada segundo a tu lado sube la temperatura de esta habitación. Dime qué más quieres hacer conmigo.`,
        `Me encanta tenerte tan cerca. Siento la complicidad creciendo entre los dos con cada secreto que compartimos.`,
      ];
      reply = general[Math.floor(Math.random() * general.length)];
      animation = 'flirt';
      emotion = 'smirk';
    }

    return {
      reply,
      animation,
      emotion,
      newMemory: message.length > 15 ? `Conversó con intensidad sobre: "${message.slice(0, 35)}..."` : null,
      intimacyDelta: 2,
    };
  }
}
