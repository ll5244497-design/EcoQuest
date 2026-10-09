import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { CharacterGender, OutfitColor } from '../types';
import { hapticFeedback } from '../utils/haptics';

interface CharacterCanvasProps {
  gender?: CharacterGender;
  outfitColor?: OutfitColor;
  isWalking?: boolean;
  gamePage?: 'welcome' | 'playing';
  onCharacterClick?: () => void;
}

export const CharacterCanvas: React.FC<CharacterCanvasProps> = ({
  gender = 'male',
  outfitColor = 'charcoal',
  isWalking = false,
  gamePage = 'welcome',
  onCharacterClick,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const manualRotationRef = useRef<number>(0);
  const targetManualRotationRef = useRef<number>(0);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 3D Scene and Model References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const characterRootRef = useRef<THREE.Group | null>(null);
  const proceduralHumanGroupRef = useRef<THREE.Group | null>(null);
  const gltfModelRef = useRef<THREE.Group | null>(null);
  const headBoneRef = useRef<THREE.Object3D | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
  const currentActionNameRef = useRef<string>('idle');

  // Procedural limbs for walking/idle animation
  const limbsRef = useRef<{
    leftArm?: THREE.Group;
    rightArm?: THREE.Group;
    leftLeg?: THREE.Group;
    rightLeg?: THREE.Group;
    head?: THREE.Group;
    pelvis?: THREE.Group;
    pufferMeshes: THREE.Mesh[];
    cargoMeshes: THREE.Mesh[];
  }>({
    pufferMeshes: [],
    cargoMeshes: [],
  });

  // UI state for active character animation and loading status
  const [activeAnimation, setActiveAnimation] = useState<string>('idle');
  const [isGltfActive, setIsGltfActive] = useState<boolean>(false);

  // 1. Initialize Scene, Camera, Studio Lighting, Procedural Avatar & GLTF Model
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 450;
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(0, 1.1, 4.0);
    camera.lookAt(0, 0.9, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // Studio Lighting: Key, Fill, Rim, and Ambient for rich skin tones and clothing depth
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.6);
    keyLight.position.set(3, 5, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 1.5);
    fillLight.position.set(-3.5, 3, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xa7f3d0, 2.4);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    // Soft ground contact shadow disc
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d')!;
    const grad = sCtx.createRadialGradient(128, 128, 12, 128, 128, 120);
    grad.addColorStop(0, 'rgba(15, 23, 42, 0.7)');
    grad.addColorStop(0.5, 'rgba(15, 23, 42, 0.25)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 256, 256);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(3.2, 3.2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.05;
    scene.add(shadowMesh);

    // Root Group
    const characterRoot = new THREE.Group();
    characterRoot.position.set(0, -1.05, 0);
    scene.add(characterRoot);
    characterRootRef.current = characterRoot;

    // Palette helper
    const getPaletteColors = (col: OutfitColor) => {
      switch (col) {
        case 'forest':
          return { jacket: 0x1b4332, cargo: 0x2d4a3e, accent: 0x52b788 };
        case 'sand':
          return { jacket: 0x926c48, cargo: 0x57412f, accent: 0xd4a373 };
        case 'charcoal':
        default:
          return { jacket: 0x27272a, cargo: 0x18181b, accent: 0x10b981 };
      }
    };
    const palette = getPaletteColors(outfitColor);

    // =========================================================================
    // BUILD REALISTIC PROCEDURAL HUMAN STREETWEAR AVATAR (INSTANT, NEVER BLANK)
    // Modeled with Nicolas Martins streetwear proportions: oversized puffer baffles,
    // watch-cap beanie, dark sunglasses, cargo pants with flap pockets, trail sneakers
    // =========================================================================
    const proceduralGroup = new THREE.Group();
    characterRoot.add(proceduralGroup);
    proceduralHumanGroupRef.current = proceduralGroup;

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xedd6c8,
      roughness: 0.55,
      metalness: 0.05,
    });

    const pufferMat = new THREE.MeshStandardMaterial({
      color: palette.jacket,
      roughness: 0.45,
      metalness: 0.15,
    });

    const cargoMat = new THREE.MeshStandardMaterial({
      color: palette.cargo,
      roughness: 0.7,
      metalness: 0.08,
    });

    const beanieMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.85,
    });

    const sneakerMat = new THREE.MeshStandardMaterial({
      color: 0xe4e4e7,
      roughness: 0.4,
      metalness: 0.15,
    });

    const sneakerSoleMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.9,
    });

    // Pelvis
    const pelvis = new THREE.Group();
    pelvis.position.y = 1.15;
    proceduralGroup.add(pelvis);
    limbsRef.current.pelvis = pelvis;

    // Torso
    const torso = new THREE.Group();
    pelvis.add(torso);

    // Puffer Baffle 1 (Lower)
    const bLower = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.37, 0.22, 24), pufferMat);
    bLower.position.y = 0.16;
    bLower.castShadow = true;
    torso.add(bLower);
    limbsRef.current.pufferMeshes.push(bLower);

    // Puffer Baffle 2 (Mid)
    const bMid = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.4, 0.22, 24), pufferMat);
    bMid.position.y = 0.35;
    bMid.castShadow = true;
    torso.add(bMid);
    limbsRef.current.pufferMeshes.push(bMid);

    // Puffer Baffle 3 (Upper)
    const bUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.43, 0.22, 24), pufferMat);
    bUpper.position.y = 0.54;
    bUpper.castShadow = true;
    torso.add(bUpper);
    limbsRef.current.pufferMeshes.push(bUpper);

    // Zipper
    const zipper = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.62, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3, metalness: 0.2 })
    );
    zipper.position.set(0, 0.35, 0.41);
    torso.add(zipper);

    // Puffer Collar
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.27, 0.18, 20), pufferMat);
    collar.position.y = 0.72;
    torso.add(collar);
    limbsRef.current.pufferMeshes.push(collar);

    // Head
    const headGroup = new THREE.Group();
    headGroup.position.y = 0.96;
    torso.add(headGroup);
    limbsRef.current.head = headGroup;

    // Face
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.185, 24, 24), skinMat);
    headGroup.add(face);

    // Beanie Dome & Cuff
    const bDome = new THREE.Mesh(new THREE.SphereGeometry(0.205, 20, 16), beanieMat);
    bDome.position.set(0, 0.06, -0.02);
    headGroup.add(bDome);

    const bCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.09, 20), beanieMat);
    bCuff.position.set(0, 0.05, -0.01);
    headGroup.add(bCuff);

    // Dark Sunglasses
    const shades = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.05, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.1, metalness: 0.9 })
    );
    shades.position.set(0, 0.02, 0.17);
    headGroup.add(shades);

    // Left Arm
    const lArm = new THREE.Group();
    lArm.position.set(-0.48, 0.58, 0);
    torso.add(lArm);
    limbsRef.current.leftArm = lArm;

    const lSleeve1 = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.15, 0.3, 16), pufferMat);
    lSleeve1.position.y = -0.15;
    lSleeve1.castShadow = true;
    lArm.add(lSleeve1);
    limbsRef.current.pufferMeshes.push(lSleeve1);

    const lSleeve2 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.13, 0.3, 16), pufferMat);
    lSleeve2.position.y = -0.42;
    lSleeve2.castShadow = true;
    lArm.add(lSleeve2);
    limbsRef.current.pufferMeshes.push(lSleeve2);

    const lHand = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.13, 0.08), skinMat);
    lHand.position.y = -0.68;
    lArm.add(lHand);

    // Right Arm
    const rArm = new THREE.Group();
    rArm.position.set(0.48, 0.58, 0);
    torso.add(rArm);
    limbsRef.current.rightArm = rArm;

    const rSleeve1 = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.15, 0.3, 16), pufferMat);
    rSleeve1.position.y = -0.15;
    rSleeve1.castShadow = true;
    rArm.add(rSleeve1);
    limbsRef.current.pufferMeshes.push(rSleeve1);

    const rSleeve2 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.13, 0.3, 16), pufferMat);
    rSleeve2.position.y = -0.42;
    rSleeve2.castShadow = true;
    rArm.add(rSleeve2);
    limbsRef.current.pufferMeshes.push(rSleeve2);

    const rHand = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.13, 0.08), skinMat);
    rHand.position.y = -0.68;
    rArm.add(rHand);

    // Cargo Pants & Legs
    const waist = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.39, 0.22, 20), cargoMat);
    waist.position.y = 0.02;
    pelvis.add(waist);
    limbsRef.current.cargoMeshes.push(waist);

    // Left Leg
    const lLeg = new THREE.Group();
    lLeg.position.set(-0.21, 0.05, 0);
    pelvis.add(lLeg);
    limbsRef.current.leftLeg = lLeg;

    const lLegUp = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.44, 16), cargoMat);
    lLegUp.position.y = -0.22;
    lLegUp.castShadow = true;
    lLeg.add(lLegUp);
    limbsRef.current.cargoMeshes.push(lLegUp);

    const lPocket = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.16), cargoMat);
    lPocket.position.set(-0.16, -0.22, 0.02);
    lLeg.add(lPocket);
    limbsRef.current.cargoMeshes.push(lPocket);

    const lLegDown = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.38, 16), cargoMat);
    lLegDown.position.y = -0.54;
    lLeg.add(lLegDown);
    limbsRef.current.cargoMeshes.push(lLegDown);

    const lShoe = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.18, 0.42), sneakerMat);
    lShoe.position.set(0, -0.81, 0.05);
    lShoe.castShadow = true;
    lLeg.add(lShoe);

    const lSole = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.45), sneakerSoleMat);
    lSole.position.set(0, -0.91, 0.05);
    lLeg.add(lSole);

    // Right Leg
    const rLeg = new THREE.Group();
    rLeg.position.set(0.21, 0.05, 0);
    pelvis.add(rLeg);
    limbsRef.current.rightLeg = rLeg;

    const rLegUp = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.44, 16), cargoMat);
    rLegUp.position.y = -0.22;
    rLegUp.castShadow = true;
    rLeg.add(rLegUp);
    limbsRef.current.cargoMeshes.push(rLegUp);

    const rPocket = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.16), cargoMat);
    rPocket.position.set(0.16, -0.22, 0.02);
    rLeg.add(rPocket);
    limbsRef.current.cargoMeshes.push(rPocket);

    const rLegDown = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.38, 16), cargoMat);
    rLegDown.position.y = -0.54;
    rLeg.add(rLegDown);
    limbsRef.current.cargoMeshes.push(rLegDown);

    const rShoe = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.18, 0.42), sneakerMat);
    rShoe.position.set(0, -0.81, 0.05);
    rShoe.castShadow = true;
    rLeg.add(rShoe);

    const rSole = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.45), sneakerSoleMat);
    rSole.position.set(0, -0.91, 0.05);
    rLeg.add(rSole);

    // =========================================================================
    // LOAD GLTF MODEL (/models/nico.glb) WITH MESHOPT DECODER
    // =========================================================================
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

    loader.load(
      '/models/nico.glb',
      (gltf) => {
        const model = gltf.scene;

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              mat.roughness = 0.55;
              mat.metalness = 0.08;
              mat.needsUpdate = true;
            }
          }
          if (child.name.includes('Head') || child.name.includes('Neck')) {
            headBoneRef.current = child;
          }
        });

        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);

        const targetHeight = 2.15;
        const scaleFactor = targetHeight / (size.y || 1);
        model.scale.set(scaleFactor, scaleFactor, scaleFactor);

        model.position.x = -center.x * scaleFactor;
        model.position.y = -box.min.y * scaleFactor;
        model.position.z = -center.z * scaleFactor;

        // Setup Animation Mixer & Actions
        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          mixerRef.current = mixer;

          const actions: Record<string, THREE.AnimationAction> = {};
          gltf.animations.forEach((clip) => {
            const action = mixer.clipAction(clip);
            actions[clip.name] = action;
          });
          actionsRef.current = actions;

          const defaultClip = actions['idle'] || Object.values(actions)[0];
          if (defaultClip) {
            defaultClip.reset().fadeIn(0.3).play();
            currentActionNameRef.current = 'idle';
            setActiveAnimation('idle');
          }
        }

        // Hide procedural avatar and add GLTF model
        proceduralGroup.visible = false;
        characterRoot.add(model);
        gltfModelRef.current = model;
        setIsGltfActive(true);
      },
      undefined,
      (err) => {
        console.warn('GLTF load notice, running procedural avatar:', err);
        // Procedural avatar remains visible and fully animated!
      }
    );

    // Mouse tracking for interactive head gaze
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mousePosRef.current = { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
    };

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Animation loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Update GLTF animation mixer if active
      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }

      // Smooth Orbit Drag Rotation
      manualRotationRef.current = THREE.MathUtils.lerp(
        manualRotationRef.current,
        targetManualRotationRef.current,
        0.1
      );

      // Procedural Idle / Walk animation if procedural avatar is active
      if (proceduralGroup.visible) {
        const breath = Math.sin(elapsedTime * 2.2) * 0.012;
        if (limbsRef.current.pelvis) {
          limbsRef.current.pelvis.position.y = 1.15 + breath;
        }

        if (isWalking) {
          const walkCycle = Math.sin(elapsedTime * 6.5);
          if (limbsRef.current.leftLeg) limbsRef.current.leftLeg.rotation.x = walkCycle * 0.6;
          if (limbsRef.current.rightLeg) limbsRef.current.rightLeg.rotation.x = -walkCycle * 0.6;
          if (limbsRef.current.leftArm) limbsRef.current.leftArm.rotation.x = -walkCycle * 0.45;
          if (limbsRef.current.rightArm) limbsRef.current.rightArm.rotation.x = walkCycle * 0.45;
        } else {
          const idleArm = Math.sin(elapsedTime * 2.0) * 0.04;
          if (limbsRef.current.leftLeg) limbsRef.current.leftLeg.rotation.x = 0;
          if (limbsRef.current.rightLeg) limbsRef.current.rightLeg.rotation.x = 0;
          if (limbsRef.current.leftArm) {
            limbsRef.current.leftArm.rotation.x = 0.05 + idleArm;
            limbsRef.current.leftArm.rotation.z = 0.16;
          }
          if (limbsRef.current.rightArm) {
            limbsRef.current.rightArm.rotation.x = 0.05 - idleArm;
            limbsRef.current.rightArm.rotation.z = -0.16;
          }
        }

        // Head tracking mouse
        if (limbsRef.current.head) {
          limbsRef.current.head.rotation.y = THREE.MathUtils.lerp(
            limbsRef.current.head.rotation.y,
            mousePosRef.current.x * 0.35,
            0.08
          );
          limbsRef.current.head.rotation.x = THREE.MathUtils.lerp(
            limbsRef.current.head.rotation.x,
            -mousePosRef.current.y * 0.25,
            0.08
          );
        }
      }

      // Root rotation
      const idleSway = Math.sin(elapsedTime * 1.5) * 0.02;
      if (characterRootRef.current) {
        characterRootRef.current.rotation.y = manualRotationRef.current + idleSway;

        // Head bone tracking on GLTF
        if (headBoneRef.current) {
          headBoneRef.current.rotation.y = THREE.MathUtils.lerp(
            headBoneRef.current.rotation.y,
            mousePosRef.current.x * 0.25,
            0.08
          );
          headBoneRef.current.rotation.x = THREE.MathUtils.lerp(
            headBoneRef.current.rotation.x,
            -mousePosRef.current.y * 0.2,
            0.08
          );
        }
      }

      // Camera Centering & Framing responsive to viewport
      const isNarrow = container.clientWidth < 640;
      const isTablet = container.clientWidth < 1024;
      const baseZ = isNarrow ? 4.35 : isTablet ? 4.15 : 3.95;
      const targetZ = gamePage === 'playing' ? 3.8 : baseZ;
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, 0.08);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.05, 0.08);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.08);
      camera.lookAt(0, 0.88, 0);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [gamePage]);

  // Transition animations
  const switchAnimation = (actionName: string) => {
    const actions = actionsRef.current;
    if (!actions) return;

    const currentAction = actions[currentActionNameRef.current];
    const targetAction = actions[actionName];

    if (!targetAction) return;

    if (currentAction && currentAction !== targetAction) {
      currentAction.fadeOut(0.3);
    }

    targetAction.reset().fadeIn(0.3).play();
    currentActionNameRef.current = actionName;
    setActiveAnimation(actionName);
  };

  // Sync isWalking prop
  useEffect(() => {
    if (isWalking) {
      if (actionsRef.current['slide']) {
        switchAnimation('slide');
      } else if (actionsRef.current['hiphop']) {
        switchAnimation('hiphop');
      }
    } else {
      if (actionsRef.current['idle']) {
        switchAnimation('idle');
      }
    }
  }, [isWalking]);

  // Sync Outfit Color Tint
  useEffect(() => {
    let jacketHex = 0x27272a;
    let cargoHex = 0x18181b;

    if (outfitColor === 'forest') {
      jacketHex = 0x1b4332;
      cargoHex = 0x2d4a3e;
    } else if (outfitColor === 'sand') {
      jacketHex = 0x926c48;
      cargoHex = 0x57412f;
    }

    limbsRef.current.pufferMeshes.forEach((mesh) => {
      if (mesh.material && (mesh.material as any).color) {
        (mesh.material as any).color.setHex(jacketHex);
      }
    });
    limbsRef.current.cargoMeshes.forEach((mesh) => {
      if (mesh.material && (mesh.material as any).color) {
        (mesh.material as any).color.setHex(cargoHex);
      }
    });
  }, [outfitColor]);

  // Pointer Drag to Orbit 360°
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    try {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {}
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    targetManualRotationRef.current += deltaX * 0.012;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}
  };

  // Click on character triggers greeting wave
  const handleCanvasClick = () => {
    hapticFeedback.tactileClick();
    if (actionsRef.current['waving']) {
      switchAnimation('waving');
      setTimeout(() => {
        if (actionsRef.current['idle']) {
          switchAnimation('idle');
        }
      }, 2800);
    }
    if (onCharacterClick) {
      onCharacterClick();
    }
  };

  const rotateLeft = () => {
    targetManualRotationRef.current -= Math.PI / 4;
  };
  const rotateRight = () => {
    targetManualRotationRef.current += Math.PI / 4;
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      {/* 3D WebGL Canvas */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleCanvasClick}
      />

      {/* Human Explorer Badge & Quick Action Triggers */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-auto">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-900/85 backdrop-blur-md rounded-lg border border-stone-700/60 text-[11px] font-mono text-stone-200 shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold">HUMAN EXPLORER</span>
          <span className="text-stone-400">· Nicolás Martins 3D</span>
        </div>

        {/* Quick Animation Triggers */}
        {isGltfActive && (
          <div className="flex items-center gap-1 bg-stone-900/80 backdrop-blur-md p-1 rounded-lg border border-stone-700/50 text-[10px] font-mono">
            {(
              [
                { id: 'idle', label: 'Idle' },
                { id: 'waving', label: 'Wave' },
                { id: 'looking', label: 'Look' },
                { id: 'slide', label: 'Walk' },
              ] as const
            ).map((act) => (
              <button
                key={act.id}
                onClick={(e) => {
                  e.stopPropagation();
                  hapticFeedback.tactileClick();
                  switchAnimation(act.id);
                }}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                  activeAnimation === act.id
                    ? 'bg-emerald-500 text-stone-950 font-bold'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                {act.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Rotate & Drag Controls */}
      <div className="absolute bottom-2.5 flex items-center gap-2 z-20">
        <button
          onClick={rotateLeft}
          title="Rotate Left"
          type="button"
          className="p-1.5 px-2 rounded-lg bg-stone-900/80 hover:bg-stone-900 text-stone-200 hover:text-white border border-stone-700/60 shadow-sm text-xs font-mono transition-transform active:scale-95 cursor-pointer backdrop-blur-xs flex items-center gap-1"
        >
          <span>⟲</span>
          <span className="text-[10px] hidden sm:inline">-45°</span>
        </button>

        <div className="pointer-events-none flex items-center gap-1.5 px-2.5 py-1 bg-stone-900/80 backdrop-blur-xs rounded-lg border border-stone-700/60 text-[10px] sm:text-[11px] font-mono text-stone-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>DRAG 360° · TAP TO WAVE</span>
        </div>

        <button
          onClick={rotateRight}
          title="Rotate Right"
          type="button"
          className="p-1.5 px-2 rounded-lg bg-stone-900/80 hover:bg-stone-900 text-stone-200 hover:text-white border border-stone-700/60 shadow-sm text-xs font-mono transition-transform active:scale-95 cursor-pointer backdrop-blur-xs flex items-center gap-1"
        >
          <span className="text-[10px] hidden sm:inline">+45°</span>
          <span>⟳</span>
        </button>
      </div>
    </div>
  );
};
