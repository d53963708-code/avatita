import * as THREE from 'three';
import { CustomizationSettings } from '../../types/character';

export interface AvatarBones {
  root: THREE.Group;
  hips: THREE.Group;
  spine: THREE.Group;
  chest: THREE.Group;
  neck: THREE.Group;
  head: THREE.Group;
  jaw: THREE.Mesh;
  leftEye: THREE.Group;
  rightEye: THREE.Group;
  leftEyelid: THREE.Mesh;
  rightEyelid: THREE.Mesh;
  leftEyebrow: THREE.Mesh;
  rightEyebrow: THREE.Mesh;
  leftArm: THREE.Group;
  leftForearm: THREE.Group;
  leftHand: THREE.Group;
  rightArm: THREE.Group;
  rightForearm: THREE.Group;
  rightHand: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  hairGroup: THREE.Group;
  clothingGroup: THREE.Group;
  accessoryGroup: THREE.Group;
  auraGroup: THREE.Group;
  materials: {
    skin: THREE.MeshStandardMaterial;
    hair: THREE.MeshStandardMaterial;
    hairHighlight: THREE.MeshStandardMaterial;
    eyes: THREE.MeshStandardMaterial;
    lips: THREE.MeshStandardMaterial;
    clothingPrimary: THREE.MeshStandardMaterial;
    clothingSecondary: THREE.MeshStandardMaterial;
    clothingTrim: THREE.MeshStandardMaterial;
    accessory: THREE.MeshStandardMaterial;
  };
}

export function createProceduralAvatar(
  customization: CustomizationSettings,
  gender: 'female' | 'male' | 'androgynous' = 'female'
): AvatarBones {
  const root = new THREE.Group();
  root.name = 'AvatarRoot';

  // 1. Materials
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(customization.face.skinTone),
    roughness: 0.55,
    metalness: 0.05,
  });

  const hairMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(customization.hair.color),
    roughness: customization.hair.roughness,
    metalness: customization.hair.metalness,
  });

  const hairHighlightMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(customization.hair.secondaryColor),
    roughness: 0.3,
    metalness: 0.2,
  });

  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(customization.face.eyeColor),
    emissive: new THREE.Color(customization.face.eyeColor),
    emissiveIntensity: 0.35,
    roughness: 0.1,
    metalness: 0.1,
  });

  const lipsMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(customization.face.lipstickColor),
    roughness: 0.2,
    metalness: 0.1,
  });

  const clothingPrimary = new THREE.MeshStandardMaterial({
    color: new THREE.Color(customization.clothing.primaryColor),
    roughness: customization.clothing.roughness,
    metalness: customization.clothing.metalness,
  });

  const clothingSecondary = new THREE.MeshStandardMaterial({
    color: new THREE.Color(customization.clothing.secondaryColor),
    roughness: 0.3,
    metalness: 0.7,
  });

  const clothingTrim = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#d4af37'), // Gold / platinum trim
    roughness: 0.25,
    metalness: 0.85,
  });

  const accessoryMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(customization.accessory.color),
    emissive: customization.accessory.glowing
      ? new THREE.Color(customization.accessory.color)
      : new THREE.Color(0x000000),
    emissiveIntensity: customization.accessory.glowing ? 0.8 : 0,
    roughness: 0.15,
    metalness: 0.8,
  });

  // 2. Skeletal Hierarchy Groups
  const hips = new THREE.Group();
  hips.position.y = 1.0;
  root.add(hips);

  const spine = new THREE.Group();
  hips.add(spine);

  const chest = new THREE.Group();
  chest.position.y = 0.35;
  spine.add(chest);

  const neck = new THREE.Group();
  neck.position.y = 0.38;
  chest.add(neck);

  const head = new THREE.Group();
  head.position.y = 0.18;
  neck.add(head);

  // 3. Head & Face Geometries
  // Cranium
  const craniumGeom = new THREE.SphereGeometry(0.18, 24, 20);
  craniumGeom.scale(1.0, 1.25, 1.05);
  const cranium = new THREE.Mesh(craniumGeom, skinMaterial);
  cranium.castShadow = true;
  head.add(cranium);

  // Cheeks / Face contour
  const cheekGeom = new THREE.CylinderGeometry(0.16, 0.11, 0.16, 16);
  cheekGeom.translate(0, -0.06, 0.02);
  const cheek = new THREE.Mesh(cheekGeom, skinMaterial);
  head.add(cheek);

  // Chin & Jaw (articulated for speaking/lip-sync)
  const jawGeom = new THREE.ConeGeometry(0.1, 0.14, 16);
  jawGeom.rotateX(Math.PI);
  jawGeom.translate(0, -0.16, 0.05);
  const jaw = new THREE.Mesh(jawGeom, skinMaterial);
  head.add(jaw);

  // Nose (delicate anime bridge)
  const noseGeom = new THREE.ConeGeometry(0.025, 0.07, 8);
  noseGeom.rotateX(-Math.PI * 0.45);
  noseGeom.translate(0, -0.02, 0.19);
  const nose = new THREE.Mesh(noseGeom, skinMaterial);
  head.add(nose);

  // Lips
  const upperLipGeom = new THREE.CylinderGeometry(0.012, 0.024, 0.06, 12);
  upperLipGeom.rotateZ(Math.PI / 2);
  upperLipGeom.translate(0, -0.1, 0.17);
  const upperLip = new THREE.Mesh(upperLipGeom, lipsMaterial);
  head.add(upperLip);

  const lowerLipGeom = new THREE.SphereGeometry(0.026, 12, 10);
  lowerLipGeom.scale(1.3, 0.7, 0.9);
  lowerLipGeom.translate(0, -0.12, 0.168);
  const lowerLip = new THREE.Mesh(lowerLipGeom, lipsMaterial);
  head.add(lowerLip);

  // Eyes & Eyelids (for blinking and emotions)
  const createEye = (isLeft: boolean) => {
    const eyeGroup = new THREE.Group();
    const xPos = isLeft ? -0.065 : 0.065;
    eyeGroup.position.set(xPos, 0.03, 0.145);

    // Sclera (White)
    const scleraGeom = new THREE.SphereGeometry(0.04, 16, 12);
    scleraGeom.scale(1.2, 0.9, 0.7);
    const scleraMat = new THREE.MeshStandardMaterial({ color: 0xfcfcfc, roughness: 0.1 });
    const sclera = new THREE.Mesh(scleraGeom, scleraMat);
    eyeGroup.add(sclera);

    // Iris (Custom glowing eye color)
    const irisGeom = new THREE.CircleGeometry(0.025, 16);
    irisGeom.translate(0, 0, 0.03);
    const iris = new THREE.Mesh(irisGeom, eyeMaterial);
    eyeGroup.add(iris);

    // Pupil
    const pupilGeom = new THREE.CircleGeometry(0.012, 16);
    pupilGeom.translate(0, 0, 0.032);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
    const pupil = new THREE.Mesh(pupilGeom, pupilMat);
    eyeGroup.add(pupil);

    // Specular eye catchlight (sparkle)
    const sparkleGeom = new THREE.CircleGeometry(0.006, 8);
    sparkleGeom.translate(0.008, 0.008, 0.033);
    const sparkleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const sparkle = new THREE.Mesh(sparkleGeom, sparkleMat);
    eyeGroup.add(sparkle);

    // Upper Eyelid (for blinking)
    const eyelidGeom = new THREE.SphereGeometry(0.043, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    eyelidGeom.scale(1.22, 0.95, 0.75);
    const eyelid = new THREE.Mesh(eyelidGeom, skinMaterial);
    eyelid.position.y = 0.03;
    eyeGroup.add(eyelid);

    return { eyeGroup, eyelid };
  };

  const leftEyeData = createEye(true);
  const rightEyeData = createEye(false);
  head.add(leftEyeData.eyeGroup);
  head.add(rightEyeData.eyeGroup);

  // Eyebrows
  const browGeom = new THREE.BoxGeometry(0.07, 0.012, 0.015);
  const leftEyebrow = new THREE.Mesh(browGeom, hairMaterial);
  leftEyebrow.position.set(-0.065, 0.08, 0.165);
  leftEyebrow.rotation.z = 0.1;
  head.add(leftEyebrow);

  const rightEyebrow = new THREE.Mesh(browGeom, hairMaterial);
  rightEyebrow.position.set(0.065, 0.08, 0.165);
  rightEyebrow.rotation.z = -0.1;
  head.add(rightEyebrow);

  // Blush on cheeks
  const blushMat = new THREE.MeshBasicMaterial({
    color: 0xff4d79,
    transparent: true,
    opacity: customization.face.blushIntensity * 0.45,
  });
  const blushGeom = new THREE.CircleGeometry(0.038, 16);
  const leftBlush = new THREE.Mesh(blushGeom, blushMat);
  leftBlush.position.set(-0.09, -0.04, 0.14);
  leftBlush.rotation.y = -0.4;
  head.add(leftBlush);

  const rightBlush = new THREE.Mesh(blushGeom, blushMat);
  rightBlush.position.set(0.09, -0.04, 0.14);
  rightBlush.rotation.y = 0.4;
  head.add(rightBlush);

  // 4. Hair Assembly (Customizable styles)
  const hairGroup = new THREE.Group();
  hairGroup.name = 'HairGroup';
  head.add(hairGroup);

  const buildHair = (style: string) => {
    // Clear previous hair children
    while (hairGroup.children.length > 0) {
      hairGroup.remove(hairGroup.children[0]);
    }

    // Hair cap
    const capGeom = new THREE.SphereGeometry(0.19, 20, 16);
    capGeom.scale(1.05, 1.28, 1.12);
    capGeom.translate(0, 0.04, -0.02);
    const cap = new THREE.Mesh(capGeom, hairMaterial);
    cap.castShadow = true;
    hairGroup.add(cap);

    // Bangs / Front fringe
    for (let i = -3; i <= 3; i++) {
      const bangGeom = new THREE.ConeGeometry(0.03, 0.16, 6);
      bangGeom.rotateX(Math.PI * 0.9);
      bangGeom.rotateZ(i * 0.08);
      bangGeom.translate(i * 0.035, 0.1, 0.16 - Math.abs(i) * 0.015);
      const bang = new THREE.Mesh(bangGeom, i % 2 === 0 ? hairMaterial : hairHighlightMaterial);
      hairGroup.add(bang);
    }

    if (style === 'long_waves') {
      // Cascading side and back locks
      for (let side of [-1, 1]) {
        for (let j = 0; j < 4; j++) {
          const lockGeom = new THREE.CylinderGeometry(0.025 - j * 0.003, 0.035 - j * 0.004, 0.55 + j * 0.08, 8);
          lockGeom.translate(side * (0.13 + j * 0.03), -0.22 - j * 0.06, 0.02 - j * 0.04);
          lockGeom.rotateZ(side * (0.15 + j * 0.05));
          const lock = new THREE.Mesh(lockGeom, j === 1 ? hairHighlightMaterial : hairMaterial);
          lock.castShadow = true;
          hairGroup.add(lock);
        }
      }
      // Back flowing hair
      const backGeom = new THREE.CylinderGeometry(0.18, 0.28, 0.75, 12, 1, true, 0, Math.PI);
      backGeom.rotateY(-Math.PI / 2);
      backGeom.translate(0, -0.32, -0.1);
      const backHair = new THREE.Mesh(backGeom, hairMaterial);
      hairGroup.add(backHair);
    } else if (style === 'cyber_bob') {
      // Sharp angled modern bob with neon tips
      for (let side of [-1, 1]) {
        const bobGeom = new THREE.ConeGeometry(0.1, 0.38, 8);
        bobGeom.rotateZ(side * 0.25);
        bobGeom.translate(side * 0.16, -0.1, 0.04);
        const bob = new THREE.Mesh(bobGeom, hairHighlightMaterial);
        hairGroup.add(bob);
      }
    } else if (style === 'high_ponytail') {
      // Top base knot
      const knotGeom = new THREE.SphereGeometry(0.07, 12, 12);
      knotGeom.translate(0, 0.24, -0.12);
      const knot = new THREE.Mesh(knotGeom, hairMaterial);
      hairGroup.add(knot);

      // Tail plume
      const tailGeom = new THREE.CylinderGeometry(0.06, 0.015, 0.75, 10);
      tailGeom.rotateX(-0.4);
      tailGeom.translate(0, 0.05, -0.35);
      const tail = new THREE.Mesh(tailGeom, hairHighlightMaterial);
      tail.castShadow = true;
      hairGroup.add(tail);
    } else if (style === 'wild_short') {
      // Textured spiky rebellious locks
      for (let k = 0; k < 12; k++) {
        const angle = (k / 12) * Math.PI * 2;
        const spikeGeom = new THREE.ConeGeometry(0.04, 0.14, 6);
        spikeGeom.rotateX(Math.sin(angle) * 0.4);
        spikeGeom.rotateZ(Math.cos(angle) * 0.4);
        spikeGeom.translate(Math.cos(angle) * 0.17, 0.16 + Math.sin(k) * 0.04, Math.sin(angle) * 0.17);
        const spike = new THREE.Mesh(spikeGeom, k % 3 === 0 ? hairHighlightMaterial : hairMaterial);
        hairGroup.add(spike);
      }
    } else {
      // Gothic updo / braided crown
      const crownGeom = new THREE.TorusGeometry(0.16, 0.045, 12, 24);
      crownGeom.rotateX(Math.PI / 2);
      crownGeom.translate(0, 0.18, -0.04);
      const crown = new THREE.Mesh(crownGeom, hairMaterial);
      hairGroup.add(crown);
    }
  };

  buildHair(customization.hair.style);

  // 5. Neck
  const neckGeom = new THREE.CylinderGeometry(0.065, 0.08, 0.2, 16);
  const neckMesh = new THREE.Mesh(neckGeom, skinMaterial);
  neckMesh.castShadow = true;
  neck.add(neckMesh);

  // 6. Chest, Torso & Anatomy
  const chestGeom = new THREE.CylinderGeometry(0.16, 0.13, 0.28, 16);
  chestGeom.scale(1.15, 1.0, 0.85);
  const chestMesh = new THREE.Mesh(chestGeom, skinMaterial);
  chestMesh.castShadow = true;
  chest.add(chestMesh);

  // Bust / Breasts silhouette
  const bustGeom = new THREE.SphereGeometry(0.085, 16, 14);
  bustGeom.scale(1.0, 1.1, 1.15);
  const leftBust = new THREE.Mesh(bustGeom, skinMaterial);
  leftBust.position.set(-0.075, 0.02, 0.11);
  leftBust.rotation.x = 0.2;
  leftBust.rotation.y = -0.15;
  chest.add(leftBust);

  const rightBust = new THREE.Mesh(bustGeom, skinMaterial);
  rightBust.position.set(0.075, 0.02, 0.11);
  rightBust.rotation.x = 0.2;
  rightBust.rotation.y = 0.15;
  chest.add(rightBust);

  // Waist & Hips
  const waistGeom = new THREE.CylinderGeometry(0.125, 0.17, 0.32, 16);
  waistGeom.scale(1.2, 1.0, 0.9);
  waistGeom.translate(0, 0.16, 0);
  const waistMesh = new THREE.Mesh(waistGeom, skinMaterial);
  waistMesh.castShadow = true;
  hips.add(waistMesh);

  // 7. Arms, Forearms & Hands
  const createArm = (isLeft: boolean) => {
    const side = isLeft ? -1 : 1;
    const armGroup = new THREE.Group();
    armGroup.position.set(side * 0.21, 0.12, 0.0);
    chest.add(armGroup);

    // Shoulder & Upper arm
    const upperArmGeom = new THREE.CylinderGeometry(0.045, 0.038, 0.32, 12);
    upperArmGeom.translate(0, -0.16, 0);
    const upperArm = new THREE.Mesh(upperArmGeom, skinMaterial);
    upperArm.castShadow = true;
    armGroup.add(upperArm);

    // Elbow / Forearm
    const forearmGroup = new THREE.Group();
    forearmGroup.position.set(0, -0.32, 0);
    armGroup.add(forearmGroup);

    const forearmGeom = new THREE.CylinderGeometry(0.038, 0.03, 0.3, 12);
    forearmGeom.translate(0, -0.15, 0);
    const forearm = new THREE.Mesh(forearmGeom, skinMaterial);
    forearm.castShadow = true;
    forearmGroup.add(forearm);

    // Hand & Wrist
    const handGroup = new THREE.Group();
    handGroup.position.set(0, -0.3, 0);
    forearmGroup.add(handGroup);

    const palmGeom = new THREE.BoxGeometry(0.045, 0.08, 0.025);
    palmGeom.translate(0, -0.04, 0);
    const palm = new THREE.Mesh(palmGeom, skinMaterial);
    handGroup.add(palm);

    return { armGroup, forearmGroup, handGroup };
  };

  const leftArmData = createArm(true);
  const rightArmData = createArm(false);

  // 8. Legs & High Heels
  const createLeg = (isLeft: boolean) => {
    const side = isLeft ? -1 : 1;
    const legGroup = new THREE.Group();
    legGroup.position.set(side * 0.1, 0.0, 0.0);
    hips.add(legGroup);

    // Thigh
    const thighGeom = new THREE.CylinderGeometry(0.075, 0.052, 0.48, 14);
    thighGeom.translate(0, -0.24, 0);
    const thigh = new THREE.Mesh(thighGeom, skinMaterial);
    thigh.castShadow = true;
    legGroup.add(thigh);

    // Knee / Calf
    const calfGeom = new THREE.CylinderGeometry(0.052, 0.038, 0.5, 14);
    calfGeom.translate(0, -0.73, 0.01);
    const calf = new THREE.Mesh(calfGeom, skinMaterial);
    calf.castShadow = true;
    legGroup.add(calf);

    // High Heel Boot
    const bootGeom = new THREE.BoxGeometry(0.065, 0.12, 0.16);
    bootGeom.translate(0, -0.96, 0.04);
    const boot = new THREE.Mesh(bootGeom, clothingSecondary);
    boot.castShadow = true;
    legGroup.add(boot);

    // Stiletto Heel peg
    const heelPegGeom = new THREE.CylinderGeometry(0.008, 0.005, 0.1, 8);
    heelPegGeom.translate(0, -0.96, -0.04);
    const heelPeg = new THREE.Mesh(heelPegGeom, clothingTrim);
    legGroup.add(heelPeg);

    return legGroup;
  };

  const leftLeg = createLeg(true);
  const rightLeg = createLeg(false);

  // 9. Clothing Group (Customizable Outfits)
  const clothingGroup = new THREE.Group();
  clothingGroup.name = 'ClothingGroup';
  root.add(clothingGroup);

  const outfit = customization.clothing.outfit;

  // Bodice / Corset / Top attached to chest
  const corsetGeom = new THREE.CylinderGeometry(0.162, 0.132, 0.3, 16);
  corsetGeom.scale(1.16, 1.0, 0.88);
  const corset = new THREE.Mesh(corsetGeom, clothingPrimary);
  chest.add(corset);

  // Gold Trim Border on neckline
  const trimGeom = new THREE.TorusGeometry(0.16, 0.015, 8, 20);
  trimGeom.scale(1.15, 0.85, 1.0);
  trimGeom.rotateX(Math.PI / 2);
  trimGeom.translate(0, 0.14, 0);
  const necklineTrim = new THREE.Mesh(trimGeom, clothingTrim);
  chest.add(necklineTrim);

  // Skirt / Gown / Belt on hips
  if (outfit === 'scarlet_gown') {
    // Flowing luxury gown with side slit
    const skirtGeom = new THREE.ConeGeometry(0.42, 1.05, 20, 1, true, 0, Math.PI * 1.75);
    skirtGeom.translate(0, -0.52, 0);
    const skirt = new THREE.Mesh(skirtGeom, clothingPrimary);
    skirt.material.side = THREE.DoubleSide;
    skirt.castShadow = true;
    hips.add(skirt);
  } else if (outfit === 'gothic_corset') {
    // Layered gothic ruffles
    for (let r = 0; r < 3; r++) {
      const ruffleGeom = new THREE.CylinderGeometry(0.18 + r * 0.05, 0.24 + r * 0.07, 0.12, 16);
      ruffleGeom.translate(0, -0.06 - r * 0.1, 0);
      const ruffle = new THREE.Mesh(ruffleGeom, r % 2 === 0 ? clothingPrimary : clothingSecondary);
      hips.add(ruffle);
    }
  } else if (outfit === 'cyber_leather') {
    // Cyber armor belt & holographic holster
    const beltGeom = new THREE.TorusGeometry(0.18, 0.025, 8, 20);
    beltGeom.rotateX(Math.PI / 2);
    beltGeom.translate(0, 0.12, 0);
    const belt = new THREE.Mesh(beltGeom, clothingSecondary);
    hips.add(belt);

    // Neon circuit stripe on torso
    const neonStripeGeom = new THREE.BoxGeometry(0.015, 0.26, 0.02);
    neonStripeGeom.translate(0, 0, 0.15);
    const neonStripeMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const neonStripe = new THREE.Mesh(neonStripeGeom, neonStripeMat);
    chest.add(neonStripe);
  }

  // Jacket / Cape layer
  if (customization.clothing.layers.jacket) {
    const capeGeom = new THREE.CylinderGeometry(0.24, 0.42, 0.9, 14, 1, true, -Math.PI * 0.8, Math.PI * 0.8);
    capeGeom.translate(0, -0.35, -0.08);
    const cape = new THREE.Mesh(capeGeom, clothingSecondary);
    cape.material.side = THREE.DoubleSide;
    chest.add(cape);
  }

  // 10. Accessories (Horns, Visor, Choker, Rings)
  const accessoryGroup = new THREE.Group();
  accessoryGroup.name = 'AccessoryGroup';
  root.add(accessoryGroup);

  if (customization.accessory.type === 'choker_gem') {
    // Choker with glowing pendant
    const bandGeom = new THREE.CylinderGeometry(0.075, 0.075, 0.035, 16);
    const band = new THREE.Mesh(bandGeom, clothingSecondary);
    neck.add(band);

    const gemGeom = new THREE.OctahedronGeometry(0.025, 0);
    gemGeom.translate(0, 0, 0.085);
    const gem = new THREE.Mesh(gemGeom, accessoryMaterial);
    neck.add(gem);
  } else if (customization.accessory.type === 'horns') {
    // Seductive curved demon/succubus horns
    for (let side of [-1, 1]) {
      const hornGeom = new THREE.ConeGeometry(0.03, 0.22, 10);
      hornGeom.rotateZ(side * 0.6);
      hornGeom.rotateX(-0.3);
      hornGeom.translate(side * 0.12, 0.22, -0.04);
      const horn = new THREE.Mesh(hornGeom, accessoryMaterial);
      head.add(horn);
    }
  } else if (customization.accessory.type === 'cyber_visor') {
    // Translucent glowing cyberpunk visor
    const visorGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.05, 16, 1, true, -0.8, 1.6);
    visorGeom.translate(0, 0.03, 0.08);
    const visorMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(customization.accessory.color),
      emissive: new THREE.Color(customization.accessory.color),
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.75,
      roughness: 0.1,
      metalness: 0.9,
    });
    const visor = new THREE.Mesh(visorGeom, visorMat);
    head.add(visor);
  }

  // 11. Aura & Atmosphere (particles disabled per user instruction)
  const auraGroup = new THREE.Group();
  auraGroup.name = 'AuraGroup';
  root.add(auraGroup);

  // Soft contact shadow disc right underneath the feet
  const shadowGeom = new THREE.PlaneGeometry(1.2, 1.2);
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const ctx = shadowCanvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
  grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.6,
  });
  const shadowPlane = new THREE.Mesh(shadowGeom, shadowMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.01;
  root.add(shadowPlane);

  return {
    root,
    hips,
    spine,
    chest,
    neck,
    head,
    jaw,
    leftEye: leftEyeData.eyeGroup,
    rightEye: rightEyeData.eyeGroup,
    leftEyelid: leftEyeData.eyelid,
    rightEyelid: rightEyeData.eyelid,
    leftEyebrow,
    rightEyebrow,
    leftArm: leftArmData.armGroup,
    leftForearm: leftArmData.forearmGroup,
    leftHand: leftArmData.handGroup,
    rightArm: rightArmData.armGroup,
    rightForearm: rightArmData.forearmGroup,
    rightHand: rightArmData.handGroup,
    leftLeg,
    rightLeg,
    hairGroup,
    clothingGroup,
    accessoryGroup,
    auraGroup,
    materials: {
      skin: skinMaterial,
      hair: hairMaterial,
      hairHighlight: hairHighlightMaterial,
      eyes: eyeMaterial,
      lips: lipsMaterial,
      clothingPrimary,
      clothingSecondary,
      clothingTrim,
      accessory: accessoryMaterial,
    },
  };
}
