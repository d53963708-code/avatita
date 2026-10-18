# Plan de implementación y pasos para optimizar Avatita

Objetivo: aplicar las recomendaciones para que la app sea una versión optimizada y escalable tipo “Ani companions”: soporte amplio de modelos 3D, detección fiable de animaciones y morphs, chat eficiente, manejo de memorias compacto, TTS robusto y perfil de rendimiento ajustable.

Resumen de lo que voy a implementar en la rama feature/model-controls-manual (orden de prioridad):

1) Soporte 3D robusto y seguro (alta prioridad)
   - Añadir Character3DScene completo con GLTF/GLB/VRM/FBX/OBJ loaders, DRACO support y extracción de clips + morph targets.
   - Exponer API pública: onModelLoaded(info), playAnimation(name), stopAnimation(), disposeModel().
   - No autoplay: el modelo queda cargado y espera que la UI invoque reproducción.
   - Optimización: LOD básico, pixelRatio adaptativo y cleaning/dispose al reemplazar modelos.
   - Archivos objetivo: src/components/ThreeCanvas/Character3DScene.tsx, utilidades en src/services/modelUtils.ts

2) Chat y manejo de imágenes (alta prioridad)
   - Evitar almacenar base64 en estado: usar URL.createObjectURL para preview y mantener File/Blob para envío.
   - Compresión cliente-side con canvas / ImageBitmap o workers (AVIF/WebP preferible) antes de upload.
   - ApiClient: añadir analyzeImageBlob(imageBlob, mime, prompt, character) que envíe FormData al backend.
   - Virtualización/memoización de la lista de mensajes (react-window) y memo para MessageItem.
   - Archivos: src/components/ChatOverlay.tsx, src/services/apiClient.ts, src/services/imageUtils.ts

3) Memoria y prompts (med/alta)
   - Compactar memorias relevantes antes de enviar al backend (MemoryManager.summarizeForPrompt ya añadido).
   - Enviar memorySummary + últimos N mensajes al servidor, no todo el histórico.
   - API para compactar en background o manualmente desde Drawer ("Compactar ahora").
   - Archivos: src/services/memoryManager.ts (ya modificado), backend endpoints -> /api/chat (si aplica).

4) Rendimiento Three.js y perfil dinámico (med)
   - Renderer pixelRatio dinámico, desactivar sombras/postprocessing si perfil bajo.
   - Pause rendering cuando document.hidden o la pestaña no visible.
   - Reutilizar vectores temporales, evitar new en loop.
   - Archivos: Character3DScene.tsx, ConfigurationDrawer.tsx (exponer performanceProfile).

5) Drawer/UX y configuraciones IA (med)
   - Simplificar Drawer en pestañas: Personalidad, Modelo 3D, Memoria, IA, Rendimiento.
   - Guardar presets y export/import de personalidades.
   - Añadir testEndpoint en ApiClient (ping endpoint provider y listar modelos si responde).
   - Archivos: src/components/ConfigurationDrawer.tsx, src/services/apiClient.ts

6) Infra: ImgBot, CI y smoke tests (baja)
   - Añadir .imgbotconfig y proponer instalar ImgBot desde Marketplace.
   - Añadir GitHub Action con tsc --noEmit, lint y smoke component test (si es posible).

Plan de commits y PRs (granular):
- PR 1 (feature/3d-loaders): Character3DScene con loaders, onModelLoaded y play API, DRACO config y disposal.
- PR 2 (feature/chat-image-opt): ChatOverlay: preview con object URL, compress util y ApiClient.analyzeImageBlob.
- PR 3 (feature/messages-virt): MessageItem memoizado y react-window integration para el listado de mensajes.
- PR 4 (perf/three-tweaks): pixelRatio adaptativo, pause on hidden, performanceProfile toggles en drawer.
- PR 5 (infra/imgbot-ci): .imgbotconfig y GitHub Action smoke tests + tsc.

Estimación breve de tiempos (por PR):
- PR1: 2–3 días
- PR2: 1–2 días
- PR3: 0.5–1 día
- PR4: 0.5–1 día
- PR5: 0.5 día

Dependencias y assets a preparar:
- draco decoder (three/examples/jsm/loaders/DRACOLoader) assets (poner en public/draco o usar CDN).
- meshoptimizer / gltf-transform para pre-procesado de modelos cuando sea posible.
- Opcional: WASM-based image compressor (squoosh) en /public/wasm o usar canvas fallback.

Requisitos para backend (sugeridos):
- /api/chat: recibir message + history (últimos N) + memorySummary + characterProfile + aiProviderConfig -> devuelve reply, animation, emotion, newMemory, intimacyDelta.
- /api/analyze-image: recibir multipart/form-data con image y metadata -> devolver análisis y reply.
- /api/tts: endpoint para generar audio (base64 o URL) y cachear por texto.


---

A continuación verifiqué las prácticas y recursos actuales (2026) para maximizar rendimiento y calidad. Copio aquí, sin modificaciones, un resumen actualizado de mejores prácticas para Three.js/WebGL, glTF/GLB/VRM, compresión cliente-side y manejo de TTS (Web Speech API y fallbacks servidor-side). Este bloque proviene de una búsqueda reciente y se incluye tal cual para referencia técnica:

Absolutely—let’s break down current (2026) **best practices** in each area for high-performance web avatar applications, focusing on **Three.js/WebGL**, **model/asset optimization (glTF, GLB, VRM)**, **client-side image compression**, and **robust web text-to-speech (TTS) handling**.

---

## 1. Three.js/WebGL Performance Optimization (2026)

- **Instancing \u0026 Draw Call Reduction**: Use `InstancedMesh` and *merge geometries* wherever possible—minimizing total draw calls is still crucial.
- **Efficient Material Usage**: Reuse materials; avoid excessive unique materials that lead to shader re-compilation and cache misses.
- **Frustum/Distance Culling**: Use `frustumCulled = true` and LOD (Level-of-Detail) switching, including Three.js’s built-in `LOD` class.
- **Batching \u0026 GPU Uploads**: Defer asset loading and only upload GPU resources (`.needsUpdate`) when necessary.
- **Render Target Optimization**: If post-processing is used, match render target sizes to viewport and use lower bit-depths when possible (e.g., RGBA8 instead of RGBA16F unless HDR is essential).
- **WebGL2 Features**: Use WebGL2 for instancing, UBOs (Uniform Buffer Objects), and efficient texture arrays.
- **Offscreen Canvas/Workers**: For heavy scene updates or physics, move work into Web Workers with `OffscreenCanvas`.
- **Dynamic Resolution Scaling**: Dynamically adjust renderer pixel ratio based on performance budgets.

---

## 2. glTF/GLB/VRM Asset Optimization (2026)

- **Mesh Simplification**: Use mesh decimation tools (e.g. Blender Decimate, Meshoptimizer, Simplygon) to reduce triangle counts for distant avatars.
- **Texture Atlas**: Merge textures into as few atlases as possible to reduce GPU state changes and memory usage.
- **Texture Compression**: Use modern GPU texture compression (Basis Universal `.basis`, KTX2 with ETC1S/UASTC, or ASTC for iOS devices) in glTF files via pipeline plugins (e.g., glTF-Transform) .
- **Animation Optimization**: Reduce animation keyframes, quantize data, and strip unused skeleton bones and morph targets.
- **Meshoptimizer Integration**: Run assets through [meshoptimizer](https://github.com/zeux/meshoptimizer) for vertex/index buffer reordering, compression, and LOD generation.
- **VRM-Specific**: Use VRM 1.0 for avatar interoperability. Optimize blendshape/morph target count and compress embedded textures.
- **Binary GLB Packing**: Distribute production assets in `.glb`, not `.gltf`, for bundle efficiency.

---

## 3. Client-Side Image Compression

- **Modern Image Codecs**: Use `ImageBitmap`, WebP, AVIF, and JPEG XL for best performance/quality balance with built-in compression routines.
- **Worker-Based Compression**: Utilize Canvas2D, `createImageBitmap`, and third-party WASM compressors in Web Workers (e.g., [squoosh](https://github.com/GoogleChromeLabs/squoosh)) to offload tasks from UI thread .
- **Responsive/Progressive Loading**: Serve responsive images (srcset, sizes) and incremental loading (progressive JPEG/AVIF) for fast initial render.
- **On-the-fly Encoding**: Use canvas or WASM tools to re-encode user-uploaded images (e.g., avatars or textures) before upload to minimize bandwidth.

---

## 4. Web TTS Handling (Web Speech API \u0026 Server-Side Fallbacks)

- **Capability Detection**: Check `window.speechSynthesis` and available voices; provide transparent fallback if unavailable or user settings indicate.
- **Voice Preloading/Selection**: Query and populate available voices *before* starting speech to avoid race conditions (many browsers load voices async).
- **Chunked/Buffered Speech**: For long passages, split text into chunks before synthesis to avoid buffer overflow and improve responsiveness.
- **Server-Side TTS as Fallback**:
    - Use cloud services (e.g., Google Cloud TTS, Amazon Polly, Azure Cognitive Services) when device TTS is missing, slow, or insufficient quality.
    - Obtain audio as a binary blob and play with `<audio>` or Web Audio API.
    - Cache generated TTS audio by text for repeat requests.
- **Latency Management**: Pre-fetch speech audio for predictable interaction.
- **Network/Device Adaptation**: Adapt TTS quality/latency based on network speed and device capabilities.
- **Privacy Handling**: Warn users when speech data is sent to the cloud for TTS.

*2026 tip:* Large Language Model-powered TTS APIs offer expressiveness close to humans—consider user consent and GDPR/CCPA when handling voice data.

---

### References

- [Meshoptimizer](https://github.com/zeux/meshoptimizer)
- [glTF-Transform](https://gltf-transform.donmccurdy.com/)
- [Squoosh (Google)](https://squoosh.app/)
- [Web Speech API on MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)


---

Siguientes acciones que voy a ejecutar ahora (si confirmás):
- Crear los PRs enumerados arriba y aplicar los cambios por etapas en la rama feature/model-controls-manual.
- Implementar Character3DScene con loaders, detección de morphs y anims, API de reproducción manual y disposals.
- Refactor ChatOverlay para previews con object URLs, compresión, ApiClient.analyzeImageBlob y virtualización de mensajes (si hay muchos).
- Afinar performanceProfile: pixelRatio, shadows, postprocessing toggles.
- Añadir .imgbotconfig y configuración de CI (opcional en PR separado).

Confirmame si querés que empiece a aplicar los cambios (yo los commiteo en la rama feature/model-controls-manual y abro PRs). Si preferís, puedo aplicar solo parte por ahora y dejar lo demás para después.