import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import {
  AnimationSlotMapping,
  AnimationClassifier,
  RecognizedAnimation,
} from '../../services/animationClassifier';
import {
  AnimationType,
  CustomizationSettings,
  EmotionType,
  HardwareConfig,
  ModelTransformConfig,
  MorphTargetItem,
  PerformanceProfileConfig,
} from '../../types/character';
import { AvatarBones, createProceduralAvatar } from './proceduralAvatar';

interface Character3DSceneProps {
  customization: CustomizationSettings;
  gender?: 'female' | 'male' | 'androgynous';
  activeAnimation: AnimationType;
  activeEmotion: EmotionType;
  isSpeaking: boolean;
  cameraPreset: 'face' | 'bust' | 'full' | 'orbit';
  customModelFile?: File | null;
  modelTransform?: ModelTransformConfig;
  morphTargetsList?: MorphTargetItem[];
  animationSlotMapping?: AnimationSlotMapping;
  playbackSpeed?: number;
  crossFadeDuration?: number;
  performanceProfile?: PerformanceProfileConfig;
  onModelLoaded?: (info: {
    name: string;
    animations: string[];
    recognizedAnimations?: RecognizedAnimation[];
    morphs?: MorphTargetItem[];
  }) => void;
  onAnimationChanged?: (anim: AnimationType) => void;
  onMorphsDetected?: (morphs: MorphTargetItem[]) => void;
}

export const Character3DScene: React.FC<Character3DSceneProps> = ({
  customization,
  gender = 'female',
  activeAnimation,
  activeEmotion,
  isSpeaking,
  cameraPreset,
  customModelFile,
  modelTransform,
  morphTargetsList,
  animationSlotMapping,
  playbackSpeed = 1,
  crossFadeDuration = 0.35,
  performanceProfile,
  onModelLoaded,
  onAnimationChanged,
  onMorphsDetected,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const avatarBonesRef = useRef<AvatarBones | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const customModelGroupRef = useRef<THREE.Group | null>(null);
  const baseModelObjectRef = useRef<THREE.Object3D | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const mixerActionsRef = useRef<Record<string, THREE.AnimationAction>>({});
  const currentActiveActionRef = useRef<THREE.AnimationAction | null>(null);
  const morphMeshesRef = useRef<THREE.Mesh[]>([]);
  const mouthMorphTargetsRef = useRef<{ mesh: THREE.Mesh; index: number }[]>([]);
  const [modelLoading, setModelLoading] = useState(false);

  // Camera animation targets
  const cameraTargetRef = useRef<{
    pos: THREE.Vector3;
    lookAt: THREE.Vector3;
  }>({
    pos: new THREE.Vector3(0, 1.35, 1.8),
    lookAt: new THREE.Vector3(0, 1.25, 0),
  });

  const mousePosRef = useRef<{ x: number; y: number; isDown: boolean; startX: number; startY: number }>({
    x: 0,
    y: 0,
    isDown: false,
    startX: 0,
    startY: 0,
  });

  const orbitAnglesRef = useRef<{ theta: number; phi: number; radius: number }>({
    theta: 0,
    phi: Math.PI / 2.1,
    radius: 1.8,
  });

  const applyCameraPreset = (
    preset: 'face' | 'bust' | 'full' | 'orbit',
    width: number,
    height: number
  ) => {
    const isPortrait = width < height;
    // On narrow mobile screens (portrait aspect ratio ~0.45 - 0.55),
    // adjust camera distance (radius) and target Y so the full avatar fits head to toe
    if (preset === 'face') {
      orbitAnglesRef.current.radius = isPortrait ? 0.95 : 0.65;
      cameraTargetRef.current.lookAt.set(0, 1.48, 0);
    } else if (preset === 'bust') {
      orbitAnglesRef.current.radius = isPortrait ? 1.9 : 1.3;
      cameraTargetRef.current.lookAt.set(0, 1.25, 0);
    } else if (preset === 'full') {
      // Full body view: ensures head and high heel boots are 100% visible on smartphones
      orbitAnglesRef.current.radius = isPortrait ? 3.45 : 2.4;
      cameraTargetRef.current.lookAt.set(0, isPortrait ? 0.85 : 0.9, 0);
    } else {
      // Free orbit
      orbitAnglesRef.current.radius = isPortrait ? 2.8 : 1.8;
      cameraTargetRef.current.lookAt.set(0, isPortrait ? 0.95 : 1.1, 0);
    }
  };

  // Update camera presets smoothly
  useEffect(() => {
    const w = mountRef.current?.clientWidth || window.innerWidth;
    const h = mountRef.current?.clientHeight || window.innerHeight;
    applyCameraPreset(cameraPreset, w, h);
  }, [cameraPreset]);

  // Switch animation clip on custom loaded 3D models with smooth crossfading & slot mapping
  useEffect(() => {
    if (!mixerRef.current || !mixerActionsRef.current) return;
    const actions = mixerActionsRef.current;
    const actionKeys = Object.keys(actions);
    if (actionKeys.length === 0) return;

    // Check slot mapping first
    let requestedClip = activeAnimation;
    if (animationSlotMapping) {
      if (activeAnimation === 'idle' && animationSlotMapping.idle) {
        requestedClip = animationSlotMapping.idle;
      } else if ((activeAnimation === 'whisper' || isSpeaking) && animationSlotMapping.speaking) {
        requestedClip = animationSlotMapping.speaking;
      } else if (activeAnimation === 'laugh' && animationSlotMapping.laugh) {
        requestedClip = animationSlotMapping.laugh;
      } else if (activeAnimation === 'flirt' && animationSlotMapping.flirt) {
        requestedClip = animationSlotMapping.flirt;
      } else if (activeAnimation === 'dance' && animationSlotMapping.dance) {
        requestedClip = animationSlotMapping.dance;
      }
    }

    // 1. Exact match
    let targetAction = actions[requestedClip];

    // 2. Case-insensitive or substring match
    if (!targetAction) {
      const lowerReq = requestedClip.toLowerCase();
      const matchedKey = actionKeys.find((key) => {
        const lowerKey = key.toLowerCase();
        return lowerKey === lowerReq || lowerKey.includes(lowerReq) || lowerReq.includes(lowerKey);
      });
      if (matchedKey) {
        targetAction = actions[matchedKey];
      }
    }

    // 3. Semantic fallback for common conversational attitudes
    if (!targetAction && activeAnimation === 'dance') {
      const danceKey = actionKeys.find((k) => /dance|bail|spin/i.test(k));
      if (danceKey) targetAction = actions[danceKey];
    } else if (!targetAction && (activeAnimation === 'flirt' || activeAnimation === 'sensual_sway' || activeAnimation === 'tease')) {
      const flirtKey = actionKeys.find((k) => /sway|pose|sexy|sensual|walk|flirt|provoc/i.test(k));
      if (flirtKey) targetAction = actions[flirtKey];
    } else if (!targetAction && activeAnimation === 'idle') {
      const idleKey = actionKeys.find((k) => /idle|reposo|stand|wait/i.test(k));
      if (idleKey) targetAction = actions[idleKey];
    }

    // 4. Default fallback: keep first available action
    if (!targetAction && !currentActiveActionRef.current) {
      targetAction = actions[actionKeys[0]];
    }

    const fadeTime = Math.max(0.05, Math.min(1.5, crossFadeDuration));
    const speed = Math.max(0.1, Math.min(3.0, playbackSpeed));

    if (targetAction && targetAction !== currentActiveActionRef.current) {
      const prevAction = currentActiveActionRef.current;
      targetAction.reset();
      targetAction.enabled = true;
      targetAction.setEffectiveTimeScale(speed);
      targetAction.setEffectiveWeight(1);
      targetAction.fadeIn(fadeTime);
      targetAction.play();

      if (prevAction) {
        prevAction.fadeOut(fadeTime);
      }
      currentActiveActionRef.current = targetAction;
    } else if (targetAction && currentActiveActionRef.current) {
      // Update playback speed dynamically
      currentActiveActionRef.current.setEffectiveTimeScale(speed);
    }
  }, [activeAnimation, animationSlotMapping, playbackSpeed, crossFadeDuration, isSpeaking]);

  // Main Three.js Lifecycle
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Renderer setup (Transparent so pure black #000000 or custom room/photo background displays seamlessly)
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = null;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 2. Mandatory RoomEnvironment studio reflection (per Three.js skill)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3. Studio 3-point lighting rig
    const warmth = customization.environment.lightWarmth ?? 0.7;
    const keyLightColor = new THREE.Color().lerpColors(
      new THREE.Color(0x70a5ff),
      new THREE.Color(0xffe0b2),
      warmth
    );
    const hemiLightColor = new THREE.Color().lerpColors(
      new THREE.Color(0x1a2639),
      new THREE.Color(0x2d1a33),
      warmth
    );

    const keyLight = new THREE.DirectionalLight(keyLightColor, 2.8);
    keyLight.position.set(1.8, 3.2, 2.4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 10;
    keyLight.shadow.camera.left = -1.5;
    keyLight.shadow.camera.right = 1.5;
    keyLight.shadow.camera.top = 2.5;
    keyLight.shadow.camera.bottom = -0.5;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, hemiLightColor, 1.2);
    hemiLight.position.set(0, 5, 0);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(0xff2a85, 2.2);
    rimLight.position.set(-2.2, 2.4, -2.0);
    scene.add(rimLight);

    const frontFill = new THREE.PointLight(keyLightColor, 1.0, 5);
    frontFill.position.set(0, 1.4, 1.6);
    scene.add(frontFill);

    // Natural shadow receiver on the ground (invisible except for avatar contact shadow)
    const floorGeom = new THREE.PlaneGeometry(12, 12);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.45 });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // 4. Camera setup
    const isPortrait = container.clientWidth < container.clientHeight;
    const camera = new THREE.PerspectiveCamera(
      isPortrait ? 46 : 40,
      container.clientWidth / container.clientHeight,
      0.1,
      30
    );
    applyCameraPreset(cameraPreset, container.clientWidth, container.clientHeight);
    camera.position.set(0, 1.35, 1.8);

    // 5. Initial Procedural Avatar
    const avatar = createProceduralAvatar(customization, gender);
    avatarBonesRef.current = avatar;
    scene.add(avatar.root);

    // Pre-allocate scratch math vectors for zero GC in render loop (Three.js directive)
    const _camTarget = new THREE.Vector3(0, 1.25, 0);
    const _camPos = new THREE.Vector3();
    const clock = new THREE.Clock();
    let animationFrameId: number;
    let nextBlinkTime = 2.0;
    let isBlinking = false;
    let blinkProgress = 0;

    // Render loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      const time = clock.getElapsedTime();

      // Update loaded model mixer if active
      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }

      // Procedural Avatar Skeletal Animation Machine
      const bones = avatarBonesRef.current;
      if (bones && bones.root.visible) {
        // Natural Breathing oscillation
        const breath = Math.sin(time * 2.2) * 0.02;
        bones.chest.position.y = 0.35 + breath * 0.5;
        bones.chest.scale.set(1 + breath * 0.4, 1 + breath * 0.2, 1 + breath * 0.6);

        // Blinking system
        if (time > nextBlinkTime && !isBlinking) {
          isBlinking = true;
          blinkProgress = 0;
          nextBlinkTime = time + 2.5 + Math.random() * 3.5;
        }

        if (isBlinking) {
          blinkProgress += delta * 12;
          const blinkScale = Math.sin(blinkProgress * Math.PI);
          bones.leftEyelid.scale.y = Math.max(0.01, 1 - blinkScale * 0.95);
          bones.rightEyelid.scale.y = Math.max(0.01, 1 - blinkScale * 0.95);
          if (blinkProgress >= 1) {
            isBlinking = false;
            bones.leftEyelid.scale.y = 1;
            bones.rightEyelid.scale.y = 1;
          }
        }

        // Talking / Lip Sync Jaw flutter for procedural avatar
        if (isSpeaking) {
          const jawFlutter = Math.abs(Math.sin(time * 18) * 0.06 + Math.sin(time * 26) * 0.04);
          bones.jaw.position.y = -0.16 - jawFlutter;
        } else {
          bones.jaw.position.y = THREE.MathUtils.damp(bones.jaw.position.y, -0.16, 12, delta);
        }

        // Head tracking mouse pointer (soft exponential damping)
        const targetHeadRotY = -mousePosRef.current.x * 0.45;
        const targetHeadRotX = mousePosRef.current.y * 0.35;
        bones.head.rotation.y = THREE.MathUtils.damp(bones.head.rotation.y, targetHeadRotY, 5, delta);
        bones.head.rotation.x = THREE.MathUtils.damp(bones.head.rotation.x, targetHeadRotX, 5, delta);

        // Animation presets
        if (activeAnimation === 'idle') {
          // Gentle sensual breathing & subtle hip sway
          const sway = Math.sin(time * 1.4) * 0.04;
          bones.hips.rotation.z = THREE.MathUtils.damp(bones.hips.rotation.z, sway, 4, delta);
          bones.spine.rotation.y = THREE.MathUtils.damp(bones.spine.rotation.y, Math.cos(time * 1.4) * 0.03, 4, delta);
          bones.leftArm.rotation.z = THREE.MathUtils.damp(bones.leftArm.rotation.z, 0.15 + sway * 0.5, 4, delta);
          bones.rightArm.rotation.z = THREE.MathUtils.damp(bones.rightArm.rotation.z, -0.15 - sway * 0.5, 4, delta);
          bones.leftArm.rotation.x = THREE.MathUtils.damp(bones.leftArm.rotation.x, 0.05, 4, delta);
          bones.rightArm.rotation.x = THREE.MathUtils.damp(bones.rightArm.rotation.x, 0.05, 4, delta);
        } else if (activeAnimation === 'flirt') {
          // Seductive head tilt and playful hand toward face
          bones.head.rotation.z = THREE.MathUtils.damp(bones.head.rotation.z, 0.18, 5, delta);
          bones.hips.rotation.y = THREE.MathUtils.damp(bones.hips.rotation.y, 0.22, 5, delta);
          bones.leftArm.rotation.x = THREE.MathUtils.damp(bones.leftArm.rotation.x, -0.7, 5, delta);
          bones.leftArm.rotation.z = THREE.MathUtils.damp(bones.leftArm.rotation.z, 0.4, 5, delta);
          bones.leftForearm.rotation.x = THREE.MathUtils.damp(bones.leftForearm.rotation.x, -1.2, 5, delta);
        } else if (activeAnimation === 'tease') {
          // Hands on hips, arched back
          bones.spine.rotation.x = THREE.MathUtils.damp(bones.spine.rotation.x, -0.12, 5, delta);
          bones.leftArm.rotation.x = THREE.MathUtils.damp(bones.leftArm.rotation.x, 0.3, 5, delta);
          bones.leftArm.rotation.z = THREE.MathUtils.damp(bones.leftArm.rotation.z, 0.7, 5, delta);
          bones.leftForearm.rotation.x = THREE.MathUtils.damp(bones.leftForearm.rotation.x, -1.4, 5, delta);
          bones.rightArm.rotation.x = THREE.MathUtils.damp(bones.rightArm.rotation.x, 0.3, 5, delta);
          bones.rightArm.rotation.z = THREE.MathUtils.damp(bones.rightArm.rotation.z, -0.7, 5, delta);
          bones.rightForearm.rotation.x = THREE.MathUtils.damp(bones.rightForearm.rotation.x, -1.4, 5, delta);
        } else if (activeAnimation === 'whisper') {
          // Leans forward intimately towards camera
          bones.spine.rotation.x = THREE.MathUtils.damp(bones.spine.rotation.x, 0.28, 5, delta);
          bones.head.rotation.x = THREE.MathUtils.damp(bones.head.rotation.x, -0.15, 5, delta);
          bones.rightArm.rotation.x = THREE.MathUtils.damp(bones.rightArm.rotation.x, -0.8, 5, delta);
          bones.rightForearm.rotation.x = THREE.MathUtils.damp(bones.rightForearm.rotation.x, -1.1, 5, delta);
        } else if (activeAnimation === 'laugh') {
          // Bouncy laugh, head back
          const laughBounce = Math.sin(time * 16) * 0.05;
          bones.head.rotation.x = THREE.MathUtils.damp(bones.head.rotation.x, -0.25 + laughBounce, 8, delta);
          bones.chest.position.y = 0.35 + laughBounce * 0.4;
          bones.leftArm.rotation.z = THREE.MathUtils.damp(bones.leftArm.rotation.z, 0.4, 5, delta);
          bones.rightArm.rotation.z = THREE.MathUtils.damp(bones.rightArm.rotation.z, -0.4, 5, delta);
        } else if (activeAnimation === 'sensual_sway') {
          // Undulating slow dance
          const swayRoll = Math.sin(time * 2.2) * 0.12;
          const swayYaw = Math.cos(time * 2.2) * 0.15;
          bones.hips.rotation.z = swayRoll;
          bones.hips.rotation.y = swayYaw;
          bones.spine.rotation.z = -swayRoll * 0.8;
          bones.leftArm.rotation.z = 0.3 + Math.sin(time * 2.2) * 0.2;
          bones.rightArm.rotation.z = -0.3 - Math.sin(time * 2.2) * 0.2;
        } else if (activeAnimation === 'kiss_wink') {
          // Kiss blown with arm and wink
          bones.rightArm.rotation.x = THREE.MathUtils.damp(bones.rightArm.rotation.x, -1.1, 6, delta);
          bones.rightForearm.rotation.x = THREE.MathUtils.damp(bones.rightForearm.rotation.x, -1.3, 6, delta);
          bones.head.rotation.z = THREE.MathUtils.damp(bones.head.rotation.z, -0.12, 6, delta);
          // Wink right eye
          bones.rightEyelid.scale.y = THREE.MathUtils.damp(bones.rightEyelid.scale.y, 0.05, 12, delta);
        } else if (activeAnimation === 'dance') {
          // Fluid spin and rhythmic motion
          const danceT = time * 2.5;
          bones.hips.rotation.y = Math.sin(danceT) * 0.35;
          bones.hips.position.y = 1.0 + Math.abs(Math.sin(danceT * 2)) * 0.04;
          bones.leftArm.rotation.x = Math.sin(danceT) * 0.6;
          bones.leftArm.rotation.z = 0.5 + Math.cos(danceT) * 0.3;
          bones.rightArm.rotation.x = -Math.sin(danceT) * 0.6;
          bones.rightArm.rotation.z = -0.5 - Math.cos(danceT) * 0.3;
        } else if (activeAnimation === 'proud') {
          // Tall, chin up, hands on waist
          bones.spine.rotation.x = THREE.MathUtils.damp(bones.spine.rotation.x, -0.15, 5, delta);
          bones.head.rotation.x = THREE.MathUtils.damp(bones.head.rotation.x, -0.18, 5, delta);
          bones.leftArm.rotation.z = THREE.MathUtils.damp(bones.leftArm.rotation.z, 0.55, 5, delta);
          bones.rightArm.rotation.z = THREE.MathUtils.damp(bones.rightArm.rotation.z, -0.55, 5, delta);
        } else if (activeAnimation === 'angry') {
          // Arms crossed, head turned sharply away
          bones.head.rotation.y = THREE.MathUtils.damp(bones.head.rotation.y, 0.45, 6, delta);
          bones.leftArm.rotation.x = THREE.MathUtils.damp(bones.leftArm.rotation.x, -0.6, 6, delta);
          bones.leftForearm.rotation.x = THREE.MathUtils.damp(bones.leftForearm.rotation.x, -1.6, 6, delta);
          bones.rightArm.rotation.x = THREE.MathUtils.damp(bones.rightArm.rotation.x, -0.6, 6, delta);
          bones.rightForearm.rotation.x = THREE.MathUtils.damp(bones.rightForearm.rotation.x, -1.6, 6, delta);
        }

        // Orbiting Aura rotation
        if (bones.auraGroup) {
          bones.auraGroup.rotation.y += delta * 0.7;
        }
      }

      // Imported 3D model blendshape lip-sync flutter
      if (mouthMorphTargetsRef.current.length > 0) {
        if (isSpeaking) {
          const mouthFlutter = Math.abs(Math.sin(time * 18) * 0.65 + Math.sin(time * 26) * 0.35);
          mouthMorphTargetsRef.current.forEach(({ mesh, index }) => {
            if (mesh.morphTargetInfluences) {
              mesh.morphTargetInfluences[index] = mouthFlutter;
            }
          });
        } else {
          mouthMorphTargetsRef.current.forEach(({ mesh, index }) => {
            if (mesh.morphTargetInfluences && mesh.morphTargetInfluences[index] > 0.005) {
              mesh.morphTargetInfluences[index] = THREE.MathUtils.damp(
                mesh.morphTargetInfluences[index],
                0,
                15,
                delta
              );
            }
          });
        }
      }

      // Smooth damped camera orbiting & position update
      const angles = orbitAnglesRef.current;
      const targetR = angles.radius;
      const targetPhi = angles.phi;
      const targetTheta = angles.theta;

      _camPos.x = targetR * Math.sin(targetPhi) * Math.sin(targetTheta);
      _camPos.y = targetR * Math.cos(targetPhi) + cameraTargetRef.current.lookAt.y;
      _camPos.z = targetR * Math.sin(targetPhi) * Math.cos(targetTheta);

      camera.position.x = THREE.MathUtils.damp(camera.position.x, _camPos.x, 8, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, _camPos.y, 8, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, _camPos.z, 8, delta);

      _camTarget.x = THREE.MathUtils.damp(_camTarget.x, cameraTargetRef.current.lookAt.x, 8, delta);
      _camTarget.y = THREE.MathUtils.damp(_camTarget.y, cameraTargetRef.current.lookAt.y, 8, delta);
      _camTarget.z = THREE.MathUtils.damp(_camTarget.z, cameraTargetRef.current.lookAt.z, 8, delta);

      camera.lookAt(_camTarget);

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.fov = w < h ? 46 : 40;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      applyCameraPreset(cameraPreset, w, h);
    };
    window.addEventListener('resize', handleResize);

    // Mouse & Touch Interaction handlers
    const onPointerDown = (e: PointerEvent) => {
      mousePosRef.current.isDown = true;
      mousePosRef.current.startX = e.clientX;
      mousePosRef.current.startY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mousePosRef.current.x = normX;
      mousePosRef.current.y = normY;

      if (mousePosRef.current.isDown) {
        const dx = e.clientX - mousePosRef.current.startX;
        const dy = e.clientY - mousePosRef.current.startY;
        mousePosRef.current.startX = e.clientX;
        mousePosRef.current.startY = e.clientY;

        orbitAnglesRef.current.theta -= dx * 0.008;
        orbitAnglesRef.current.phi = Math.max(
          0.3,
          Math.min(Math.PI / 1.8, orbitAnglesRef.current.phi + dy * 0.008)
        );
      }
    };

    const onPointerUp = () => {
      mousePosRef.current.isDown = false;
    };

    // Mobile Pinch-to-zoom
    let initialPinchDist = 0;
    let initialPinchRadius = orbitAnglesRef.current.radius;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDist = Math.hypot(dx, dy);
        initialPinchRadius = orbitAnglesRef.current.radius;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialPinchDist > 0) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDist = Math.hypot(dx, dy);
        const scale = initialPinchDist / Math.max(10, currentDist);
        orbitAnglesRef.current.radius = Math.max(
          0.5,
          Math.min(4.8, initialPinchRadius * scale)
        );
      }
    };

    const onTouchEnd = () => {
      initialPinchDist = 0;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      orbitAnglesRef.current.radius = Math.max(
        0.5,
        Math.min(3.8, orbitAnglesRef.current.radius + e.deltaY * 0.0015)
      );
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);
    container.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('wheel', onWheel);

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Procedural Avatar when customization changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Only rebuild procedural avatar if custom 3D model is not currently replacing it
    if (!customModelGroupRef.current) {
      if (avatarBonesRef.current) {
        scene.remove(avatarBonesRef.current.root);
      }
      const newAvatar = createProceduralAvatar(customization, gender);
      avatarBonesRef.current = newAvatar;
      scene.add(newAvatar.root);
    }
  }, [customization, gender]);

  // Load custom 3D file (.glb, .gltf, .vrm, .obj) when provided
  useEffect(() => {
    if (!customModelFile) return;
    const scene = sceneRef.current;
    if (!scene) return;

    setModelLoading(true);
    const fileName = customModelFile.name.toLowerCase();
    const fileUrl = URL.createObjectURL(customModelFile);

    const handleLoadedObject = (object: THREE.Object3D, animations: THREE.AnimationClip[] = []) => {
      // Remove old custom model if any
      if (customModelGroupRef.current) {
        scene.remove(customModelGroupRef.current);
      }
      // Hide procedural avatar
      if (avatarBonesRef.current) {
        avatarBonesRef.current.root.visible = false;
      }

      // Center and scale to standard height (~1.8m)
      const box = new THREE.Box3().setFromObject(object);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);

      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = maxDim > 0 ? 1.8 / maxDim : 1;
      object.scale.setScalar(scale);

      // Re-center on floor (y=0)
      object.position.x = -center.x * scale;
      object.position.y = -box.min.y * scale;
      object.position.z = -center.z * scale;

      object.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      const group = new THREE.Group();
      group.name = 'CustomLoadedModel';
      group.add(object);
      scene.add(group);
      customModelGroupRef.current = group;

      baseModelObjectRef.current = object;

      // Detect morph targets across meshes
      const detectedMorphs: MorphTargetItem[] = [];
      const morphMeshes: THREE.Mesh[] = [];
      const mouthMorphs: { mesh: THREE.Mesh; index: number }[] = [];

      object.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh && mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
          morphMeshes.push(mesh);
          for (const [name, index] of Object.entries(mesh.morphTargetDictionary)) {
            let category: 'mouth' | 'eyes' | 'brows' | 'other' = 'other';
            const lower = name.toLowerCase();
            if (/jaw|mouth|lip|viseme|aa|ih|ou|ee|oh|a|i|u|e|o|habla|boca/i.test(lower)) {
              category = 'mouth';
              mouthMorphs.push({ mesh, index });
            } else if (/eye|blink|squint|wink|parpadeo|ojo/i.test(lower)) {
              category = 'eyes';
            } else if (/brow|ceja/i.test(lower)) {
              category = 'brows';
            }
            detectedMorphs.push({
              id: `${mesh.name || 'mesh'}_${name}_${index}`,
              name,
              meshName: mesh.name || 'Mesh',
              index,
              weight: mesh.morphTargetInfluences[index] || 0,
              category,
            });
          }
        }
      });

      morphMeshesRef.current = morphMeshes;
      mouthMorphTargetsRef.current = mouthMorphs;
      if (onMorphsDetected && detectedMorphs.length > 0) {
        onMorphsDetected(detectedMorphs);
      }

      // Clean up previous mixer if any
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
      }

      // Analyze animations with AnimationClassifier
      const recognizedAnimations = animations.map((clip) => AnimationClassifier.analyzeClip(clip));

      // Setup AnimationMixer if animations exist
      if (animations.length > 0) {
        const mixer = new THREE.AnimationMixer(object);
        mixerRef.current = mixer;
        const actions: Record<string, THREE.AnimationAction> = {};
        animations.forEach((clip, idx) => {
          const action = mixer.clipAction(clip);
          actions[clip.name || `anim_${idx}`] = action;
        });
        mixerActionsRef.current = actions;

        // Play first animation or recognized idle by default
        const bestIdle = recognizedAnimations.find((r) => r.category === 'idle')?.originalName;
        const firstActionKey = bestIdle || Object.keys(actions)[0];
        const firstAction = actions[firstActionKey];
        if (firstAction) {
          firstAction.reset().play();
          currentActiveActionRef.current = firstAction;
          if (firstActionKey) onAnimationChanged?.(firstActionKey);
        }
      }

      onModelLoaded?.({
        name: customModelFile.name,
        animations: animations.map((a, i) => a.name || `Clip_${i + 1}`),
        recognizedAnimations,
        morphs: detectedMorphs,
      });

      setModelLoading(false);
    };

    if (fileName.endsWith('.glb') || fileName.endsWith('.gltf') || fileName.endsWith('.vrm')) {
      const loader = new GLTFLoader();
      loader.load(
        fileUrl,
        (gltf) => {
          handleLoadedObject(gltf.scene, gltf.animations);
        },
        undefined,
        (err) => {
          console.error('Failed to load GLTF/VRM file:', err);
          setModelLoading(false);
        }
      );
    } else if (fileName.endsWith('.obj')) {
      const loader = new OBJLoader();
      loader.load(
        fileUrl,
        (obj) => {
          handleLoadedObject(obj);
        },
        undefined,
        (err) => {
          console.error('Failed to load OBJ file:', err);
          setModelLoading(false);
        }
      );
    }
  }, [customModelFile]);

  // Synchronize morph targets weights from UI sliders
  useEffect(() => {
    if (!morphTargetsList || morphMeshesRef.current.length === 0) return;
    morphTargetsList.forEach((m) => {
      const mesh = morphMeshesRef.current.find((cm) => (cm.name || 'Mesh') === m.meshName);
      if (mesh && mesh.morphTargetInfluences && mesh.morphTargetInfluences[m.index] !== undefined) {
        mesh.morphTargetInfluences[m.index] = m.weight;
      }
    });
  }, [morphTargetsList]);

  // Synchronize model transforms & material tuning
  useEffect(() => {
    if (!customModelGroupRef.current || !modelTransform) return;
    const group = customModelGroupRef.current;
    group.scale.setScalar(modelTransform.scale);
    group.position.x = modelTransform.offsetX;
    group.position.y = modelTransform.offsetY;
    group.position.z = modelTransform.offsetZ;
    group.rotation.y = modelTransform.rotationY;

    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material;
        if (Array.isArray(mat)) {
          mat.forEach((m) => applyMatConfig(m, modelTransform));
        } else if (mat) {
          applyMatConfig(mat as THREE.Material, modelTransform);
        }
      }
    });
  }, [modelTransform]);

  function applyMatConfig(mat: THREE.Material, config: ModelTransformConfig) {
    if ('wireframe' in mat) {
      (mat as any).wireframe = config.wireframe;
    }
    if ('roughness' in mat && config.roughnessMod !== 0) {
      (mat as any).roughness = Math.max(0.05, Math.min(1.0, 0.45 + config.roughnessMod));
    }
    if ('metalness' in mat && config.metalnessMod !== 0) {
      (mat as any).metalness = Math.max(0.0, Math.min(1.0, 0.15 + config.metalnessMod));
    }
    if ('color' in mat && config.colorTint && config.colorTint !== '#ffffff') {
      (mat as any).color = new THREE.Color(config.colorTint);
    }
  }

  return (
    <div className="relative w-full h-full select-none touch-none">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      {modelLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none z-10">
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-slate-900/90 border border-violet-500/30 text-violet-300 text-sm shadow-2xl">
            <span className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
            Cargando modelo 3D con animaciones...
          </div>
        </div>
      )}
    </div>
  );
};
