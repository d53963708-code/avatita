import * as THREE from 'three';

export type AnimationCategory =
  | 'idle'
  | 'talk'
  | 'emotion'
  | 'locomotion'
  | 'dance'
  | 'facial'
  | 'other';

export interface RecognizedAnimation {
  id: string;
  originalName: string;
  cleanName: string;
  category: AnimationCategory;
  categoryLabel: string;
  confidence: number; // 0 to 100%
  duration: number; // in seconds
  tracksCount: number;
  hasMorphTargets: boolean;
  affectedBones: string[];
  suggestedState?: 'idle' | 'speaking' | 'laugh' | 'flirt' | 'dance';
}

export interface AnimationSlotMapping {
  idle: string;
  speaking: string;
  laugh: string;
  flirt: string;
  dance: string;
}

export interface AnimationPlaybackConfig {
  speed: number;
  crossFadeDuration: number;
  loopMode: THREE.AnimationActionLoopStyles;
  blendWeight: number;
  autoStateSync: boolean;
}

export class AnimationClassifier {
  /**
   * Cleans ugly raw names from Mixamo / Blender / VRM
   * e.g. "Armature|mixamo.com|Layer0_idle_01" -> "Idle 01"
   */
  public static cleanClipName(rawName: string): string {
    if (!rawName) return 'Animación Sin Nombre';

    let cleaned = rawName
      .replace(/^armature\|mixamo\.com\|layer0/i, '')
      .replace(/^armature\|/i, '')
      .replace(/^mixamo\.com\|/i, '')
      .replace(/^take\s*001/i, 'Pose Base')
      .replace(/[_-]+/g, ' ')
      .trim();

    if (!cleaned) cleaned = rawName;

    // Capitalize words
    return cleaned
      .split(' ')
      .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ''))
      .join(' ');
  }

  /**
   * Analyzes a THREE.AnimationClip and classifies it into semantic intent categories
   */
  public static analyzeClip(clip: THREE.AnimationClip): RecognizedAnimation {
    const raw = clip.name || '';
    const clean = this.cleanClipName(raw);
    const duration = Number(clip.duration.toFixed(2));
    const tracksCount = clip.tracks.length;

    let hasMorphTargets = false;
    const affectedBonesSet = new Set<string>();

    clip.tracks.forEach((track) => {
      if (track.name.includes('morphTargetInfluences') || track.name.includes('.morphTarget')) {
        hasMorphTargets = true;
      }
      const boneMatch = track.name.match(/^([^.]+)\./);
      if (boneMatch && boneMatch[1]) {
        affectedBonesSet.add(boneMatch[1]);
      }
    });

    const affectedBones = Array.from(affectedBonesSet).slice(0, 8);
    const lower = raw.toLowerCase() + ' ' + clean.toLowerCase();

    let category: AnimationCategory = 'other';
    let categoryLabel = 'Acción General';
    let confidence = 50;
    let suggestedState: RecognizedAnimation['suggestedState'];

    // 1. TALK & CONVERSATION
    if (
      /talk|speak|habla|convers|gesture|dialog|chat|explain|nod|tell|explic/i.test(lower) ||
      (hasMorphTargets && /mouth|jaw|phoneme|viseme|lips/i.test(lower))
    ) {
      category = 'talk';
      categoryLabel = 'Habla & Gesticulación';
      confidence = 94;
      suggestedState = 'speaking';
    }
    // 2. IDLE & BREATHING
    else if (/idle|reposo|wait|stand|breath|respir|loop|neutral|calm|quieto|espera/i.test(lower)) {
      category = 'idle';
      categoryLabel = 'Reposo / Respiración';
      confidence = 96;
      suggestedState = 'idle';
    }
    // 3. EMOTION & FLIRT & REACTIONS
    else if (
      /flirt|seduce|provoc|sensual|sexy|tease|wink|kiss|beso|guiño|shy|blush|sonrojo|laugh|risa|reir|smile|sonrisa|joy|alegre|angry|furia|sad|triste/i.test(
        lower
      )
    ) {
      category = 'emotion';
      categoryLabel = 'Emoción & Coqueteo';
      confidence = 90;
      if (/laugh|risa|reir|joy|smile/i.test(lower)) {
        suggestedState = 'laugh';
      } else {
        suggestedState = 'flirt';
      }
    }
    // 4. DANCE & PERFORMANCE
    else if (/dance|bail|samba|hiphop|spin|giro|jump|salto|wave|saludo|bow|reverencia|cheer/i.test(lower)) {
      category = 'dance';
      categoryLabel = 'Baile & Expresión';
      confidence = 92;
      suggestedState = 'dance';
    }
    // 5. LOCOMOTION
    else if (/walk|caminar|run|correr|jog|step|paso|stride|locomotion|turn|andar/i.test(lower)) {
      category = 'locomotion';
      categoryLabel = 'Locomoción / Paso';
      confidence = 88;
    }
    // 6. FACIAL & MORPH
    else if (hasMorphTargets || /fcl_|face_|blink|parpadeo|eye_|ojos|brow|cejas|viseme/i.test(lower)) {
      category = 'facial';
      categoryLabel = 'Morfología Facial / Morphs';
      confidence = 89;
    } else {
      // Heuristics based on duration & track count
      if (duration > 3.0 && tracksCount > 10) {
        category = 'idle';
        categoryLabel = 'Reposo Probable (Larga Duración)';
        confidence = 65;
        suggestedState = 'idle';
      }
    }

    return {
      id: clip.uuid || raw,
      originalName: raw,
      cleanName: clean,
      category,
      categoryLabel,
      confidence,
      duration,
      tracksCount,
      hasMorphTargets,
      affectedBones,
      suggestedState,
    };
  }

  /**
   * Analyzes an array of clips and creates automatic slot mapping for the AI Avatar
   */
  public static autoMapSlots(clips: RecognizedAnimation[]): AnimationSlotMapping {
    const mapping: AnimationSlotMapping = {
      idle: '',
      speaking: '',
      laugh: '',
      flirt: '',
      dance: '',
    };

    if (clips.length === 0) return mapping;

    // Best Idle
    const idleCandidate =
      clips.find((c) => c.suggestedState === 'idle') ||
      clips.find((c) => c.category === 'idle') ||
      clips[0];
    mapping.idle = idleCandidate?.originalName || '';

    // Best Speaking
    const speakCandidate =
      clips.find((c) => c.suggestedState === 'speaking') ||
      clips.find((c) => c.category === 'talk') ||
      clips.find((c) => c.originalName !== mapping.idle);
    mapping.speaking = speakCandidate?.originalName || mapping.idle;

    // Best Laugh / Emotion
    const laughCandidate =
      clips.find((c) => c.suggestedState === 'laugh') ||
      clips.find((c) => /laugh|joy|smile/i.test(c.originalName)) ||
      clips.find((c) => c.category === 'emotion');
    mapping.laugh = laughCandidate?.originalName || mapping.speaking;

    // Best Flirt / Seductive
    const flirtCandidate =
      clips.find((c) => c.suggestedState === 'flirt') ||
      clips.find((c) => /flirt|seduce|sensual|wink/i.test(c.originalName)) ||
      clips.find((c) => c.category === 'emotion');
    mapping.flirt = flirtCandidate?.originalName || mapping.idle;

    // Best Dance / Performance
    const danceCandidate =
      clips.find((c) => c.suggestedState === 'dance') ||
      clips.find((c) => c.category === 'dance');
    mapping.dance = danceCandidate?.originalName || mapping.flirt;

    return mapping;
  }
}
