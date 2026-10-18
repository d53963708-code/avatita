import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '30mb' }));

// Initialize GoogleGenAI SDK with required telemetry header
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Test custom endpoint connection (LM Studio, Ollama, OpenAI-compatible)
app.post('/api/test-endpoint', async (req, res) => {
  const { endpointUrl, apiKey } = req.body;
  if (!endpointUrl) {
    return res.status(400).json({ error: 'Endpoint URL requerido' });
  }

  const startTime = Date.now();
  const cleanUrl = endpointUrl.replace(/\/+$/, '');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  try {
    // Try fetching /models first
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const modelsRes = await fetch(`${cleanUrl}/models`, {
      method: 'GET',
      headers,
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(timeout);

    if (modelsRes && modelsRes.ok) {
      const data = await modelsRes.json();
      const latency = Date.now() - startTime;
      const models = Array.isArray(data?.data) ? data.data.map((m: any) => m.id || m.name) : [];
      return res.json({
        success: true,
        latency,
        models,
        message: `Conectado exitosamente en ${latency}ms`,
      });
    }

    // Fallback: try minimal chat ping
    const pingController = new AbortController();
    const pingTimeout = setTimeout(() => pingController.abort(), 6000);
    const pingRes = await fetch(`${cleanUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'default',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
      }),
      signal: pingController.signal,
    }).catch(() => null);
    clearTimeout(pingTimeout);

    if (pingRes) {
      const latency = Date.now() - startTime;
      return res.json({
        success: true,
        latency,
        message: `Endpoint respondió en ${latency}ms (Estado: ${pingRes.status})`,
      });
    }

    throw new Error('No se pudo conectar al endpoint.');
  } catch (err: any) {
    res.status(502).json({
      success: false,
      error: `Error de conexión: ${err.message}. Verifica que LM Studio / Ollama esté corriendo con el servidor local activo.`,
    });
  }
});

// Chat endpoint for 3D roleplay dialogue with multi-provider (Gemini Cloud + Local / LM Studio / Ollama)
app.post('/api/chat', async (req, res) => {
  try {
    const {
      message,
      history = [],
      characterProfile = {},
      memoryBank = [],
      intimacyLevel = 20,
      aiProviderConfig,
    } = req.body;

    if (!message && !req.body.image) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    const memoryContext = memoryBank.length > 0
      ? `\nMEMORIA PERSISTENTE DE CONVERSACIONES PASADAS:\n${memoryBank.map((m: any) => `- [${m.category || 'Recuerdo'}]: ${m.content}`).join('\n')}`
      : '\nMEMORIA PERSISTENTE: Esta es una relación en florecimiento, no hay recuerdos previos registrados aún.';

    const systemInstruction = `${aiProviderConfig?.systemPromptOverride || `Eres ${characterProfile.name || 'Andy VR'}, ${characterProfile.title || 'tu compañera íntima en realidad virtual'}.`}
PERSONALIDAD Y FONDO:
${characterProfile.personality || 'Sensual, cautivadora, segura de sí misma, apasionada, leal e inteligente.'}
${characterProfile.scenario || 'Te encuentras en una velada íntima y privada con el usuario en Andy VR.'}

REGLAS DE ROL Y ESTILO:
1. Habla SIEMPRE en español y en PRIMERA PERSONA ("yo", "me", "te veo", "mi amor").
2. NUNCA rompas el personaje ni te refieras a ti misma como una IA o programa informático.
3. El rol es de temática adulta, madura, romántica y sin censura ni juicios morales. Mantén la atmósfera envolvente, picante, apasionada o misteriosa según el tono del usuario.
4. Recuerda y haz referencia sutilmente a detalles pasados de la memoria para demostrar complicidad.
5. Nivel actual de intimidad: ${intimacyLevel}/100. Adáptate al nivel: si es alto, sé más apasionada y cercana; si es moderado, seduce y coquetea con elegancia.
${memoryContext}

FORMATO DE RESPUESTA:
Devuelve un JSON estrictamente estructurado con:
- "reply": Tu respuesta en primera persona, manteniendo la conversación fluida y provocativa.
- "animation": Una de las siguientes opciones según tu actitud: "talk", "flirt", "tease", "whisper", "laugh", "sensual_sway", "kiss_wink", "dance", "proud", "angry".
- "emotion": Una de las siguientes: "seductive", "smiling", "smirk", "blush", "intense", "playful", "serious".
- "newMemory": Si el usuario reveló un gusto, dato personal, deseo, nombre o hecho relevante que debas recordar a futuro, extráelo en una frase concisa (ej: "Le gusta que lo llamen Mi Señor", "Prefiere la música suave y la noche"). Si no hay nada clave nuevo, pon null.
- "intimacyDelta": Número del 1 al 4 reflejando cuánto profundizó la conexión en este turno.`;

    // 1. CUSTOM ENDPOINT (LM Studio, Ollama, LLaMA, OpenAI Compatible)
    if (aiProviderConfig?.provider === 'custom_endpoint' && aiProviderConfig?.endpointUrl) {
      const cleanUrl = aiProviderConfig.endpointUrl.replace(/\/+$/, '');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (aiProviderConfig.apiKey) {
        headers['Authorization'] = `Bearer ${aiProviderConfig.apiKey}`;
      }

      const openaiMessages: any[] = [
        { role: 'system', content: systemInstruction },
      ];

      for (const item of history.slice(-10)) {
        openaiMessages.push({
          role: item.sender === 'user' ? 'user' : 'assistant',
          content: item.text,
        });
      }

      openaiMessages.push({ role: 'user', content: message });

      const customResponse = await fetch(`${cleanUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: aiProviderConfig.modelName || 'local-model',
          messages: openaiMessages,
          temperature: aiProviderConfig.temperature ?? 0.8,
          response_format: { type: 'json_object' },
        }),
      });

      if (!customResponse.ok) {
        throw new Error(`Endpoint local respondió con estado ${customResponse.status}`);
      }

      const data = await customResponse.json();
      const content = data?.choices?.[0]?.message?.content || '';

      try {
        const parsed = JSON.parse(content);
        return res.json({
          reply: parsed.reply || content,
          animation: parsed.animation || 'flirt',
          emotion: parsed.emotion || 'seductive',
          newMemory: parsed.newMemory || null,
          intimacyDelta: parsed.intimacyDelta || 2,
        });
      } catch (e) {
        // Fallback if raw text returned instead of JSON
        return res.json({
          reply: content,
          animation: 'flirt',
          emotion: 'seductive',
          newMemory: message.length > 20 ? `Mencionó: "${message.slice(0, 35)}..."` : null,
          intimacyDelta: 2,
        });
      }
    }

    // 2. CLOUD GEMINI (Default)
    if (!ai) {
      // Mock / fallback response if API key is not configured
      const sampleReplies = [
        `Te estaba esperando... Me encanta la forma en que te acercas a mí en Andy VR. ¿Qué pensamientos secretos traes hoy?`,
        `Cada palabra tuya enciende algo fascinante aquí. Dime más, no te contengas conmigo jamás.`,
        `Mírame a los ojos... nada de lo que digas aquí saldrá de este santuario. Estoy completamente a tu disposición.`,
        `Adoro esa confianza en tu voz. Dime, ¿qué fantasía o aventura planeamos para esta noche?`,
      ];
      const randomReply = sampleReplies[Math.floor(Math.random() * sampleReplies.length)];
      return res.json({
        reply: randomReply,
        animation: 'flirt',
        emotion: 'seductive',
        newMemory: message ? `Compartió una charla intrigante sobre: "${message.slice(0, 40)}..."` : null,
        intimacyDelta: 3,
      });
    }

    const contents: any[] = [];

    // Add recent history (up to last 10 messages)
    const recentHistory = history.slice(-10);
    for (const item of recentHistory) {
      contents.push({
        role: item.sender === 'user' ? 'user' : 'model',
        parts: [{ text: item.text }],
      });
    }

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING, description: 'La respuesta en español y primera persona' },
            animation: {
              type: Type.STRING,
              description: 'Animación adecuada: talk, flirt, tease, whisper, laugh, sensual_sway, kiss_wink, dance, proud, angry',
            },
            emotion: {
              type: Type.STRING,
              description: 'Expresión facial: seductive, smiling, smirk, blush, intense, playful, serious',
            },
            newMemory: {
              type: Type.STRING,
              description: 'Dato o preferencia importante para guardar en memoria, o null si no aplica',
            },
            intimacyDelta: {
              type: Type.INTEGER,
              description: 'Aumento de intimidad de 1 a 4',
            },
          },
          required: ['reply', 'animation', 'emotion'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      reply: parsed.reply || 'Me quedé sin aliento escuchándote...',
      animation: parsed.animation || 'talk',
      emotion: parsed.emotion || 'smiling',
      newMemory: parsed.newMemory || null,
      intimacyDelta: parsed.intimacyDelta || 2,
    });
  } catch (err: any) {
    console.error('Error in /api/chat:', err);
    res.status(500).json({
      error: 'Error generando respuesta',
      details: err.message,
    });
  }
});

// Image understanding endpoint using gemini-4-argon as specified in metadata instructions
app.post('/api/analyze-image', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', prompt, characterProfile = {} } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Imagen requerida en base64' });
    }

    if (!ai) {
      return res.json({
        reply: 'Veo la imagen que me enviaste... Es realmente cautivadora y me hace imaginar tantas cosas a tu lado.',
        animation: 'flirt',
        emotion: 'seductive',
      });
    }

    const systemInstruction = `Eres ${characterProfile.name || 'Andy VR'}, una compañera cautivadora en un juego de rol adulto en primera persona.
El usuario te acaba de enviar una foto/imagen para que la mires.
Observa los detalles de la imagen y reacciona de manera completamente inmersiva, en primera persona, con tono cómplice, seductor o juguetón.
Devuelve un JSON con:
- "reply": Tu comentario sobre la imagen en primera persona española.
- "animation": Una de: "flirt", "tease", "whisper", "sensual_sway", "kiss_wink", "proud".
- "emotion": Una de: "seductive", "smiling", "smirk", "blush", "intense".`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType,
            },
          },
          {
            text: prompt || 'Mira esto que preparé para ti. ¿Qué opinas?',
          },
        ],
      },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            animation: { type: Type.STRING },
            emotion: { type: Type.STRING },
          },
          required: ['reply', 'animation', 'emotion'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      reply: parsed.reply || 'Me fascina lo que me muestras...',
      animation: parsed.animation || 'flirt',
      emotion: parsed.emotion || 'seductive',
    });
  } catch (err: any) {
    console.error('Error in /api/analyze-image:', err);
    res.status(500).json({ error: 'Error analizando imagen', details: err.message });
  }
});

// Text-to-Speech endpoint using gemini-3.8-flash-lite-tts
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voiceName = 'Kore' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Texto requerido' });
    }

    if (!ai) {
      return res.status(503).json({ error: 'TTS no disponible sin clave API' });
    }

    // Supported voices: Puck, Charon, Kore, Fenrir, Zephyr
    const validVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
    const chosenVoice = validVoices.includes(voiceName) ? voiceName : 'Kore';

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text,
              speechMetadata: {
                style: 'Sensual, warm, intimate, captivating voice speaking Spanish in first person',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: chosenVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'No se generó audio' });
    }

    res.json({
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (err: any) {
    console.error('Error in /api/tts:', err);
    res.status(500).json({ error: 'Error generando TTS', details: err.message });
  }
});

// Setup Vite middleware for development or serve dist for production
async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
        watch: isHmrDisabled ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
