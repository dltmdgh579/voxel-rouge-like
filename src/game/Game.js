import * as THREE from 'three';
import { useGameStore } from '../store/gameStore.js';
import { Player } from './Player.js';
import { MonsterManager } from './Monster.js';
import { VoxelMap } from '../world/Map.js';
import { ArtifactManager } from './Artifact.js';
import { AutoSkillManager } from './AutoSkillManager.js';
import { UIManager } from '../ui/HUD.js';
import { audioManager } from './AudioManager.js';
import { GAME_CONFIG, PASSIVE_SKILLS } from '../utils/constants.js';

export class Game {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    this.player = null;
    this.map = null;
    this.monsterManager = null;
    this.artifactManager = null;
    this.autoSkillManager = null;
    this.uiManager = null;

    this.keys = {};
    this.mouse = { x: 0, y: 0, clicked: false };

    // Audio manager reference
    this.audio = audioManager;

    // Track last day for BGM changes
    this.lastDay = 0;

    this.init();
  }

  init() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.scene.fog = new THREE.Fog(0x1a1a2e, 30, 60);

    // Create camera (top-down perspective)
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
    this.camera.position.set(0, GAME_CONFIG.CAMERA_HEIGHT, 15);
    this.camera.lookAt(0, 0, 0);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document.getElementById('game-container').appendChild(this.renderer.domElement);

    // Lighting
    this.setupLighting();

    // Create map
    this.map = new VoxelMap(this.scene);

    // Create player
    this.player = new Player(this.scene, this);

    // Create managers
    this.monsterManager = new MonsterManager(this.scene, this);
    this.artifactManager = new ArtifactManager(this.scene, this);
    this.autoSkillManager = new AutoSkillManager(this.scene, this);
    this.uiManager = new UIManager(this);

    // Event listeners
    this.setupEventListeners();

    // Initialize audio on first user interaction
    this.setupAudioInit();

    // Start game loop
    this.animate();
  }

  setupAudioInit() {
    const initAudio = async () => {
      await this.audio.init();
      // Play lobby BGM
      const gameState = useGameStore.getState().gameState;
      if (gameState === 'lobby') {
        this.audio.playBgm('bgm_lobby');
      }
      // Remove listeners after first interaction
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };

    document.addEventListener('click', initAudio);
    document.addEventListener('keydown', initAudio);
  }

  setupLighting() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0x404060, 0.6);
    this.scene.add(ambient);

    // Main directional light (sun)
    this.sunLight = new THREE.DirectionalLight(0xffffee, 1.0);
    this.sunLight.position.set(20, 30, 10);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 100;
    this.sunLight.shadow.camera.left = -30;
    this.sunLight.shadow.camera.right = 30;
    this.sunLight.shadow.camera.top = 30;
    this.sunLight.shadow.camera.bottom = -30;
    this.scene.add(this.sunLight);

    // Hemisphere light for sky
    const hemi = new THREE.HemisphereLight(0x87ceeb, 0x2d5a27, 0.4);
    this.scene.add(hemi);
  }

  setupEventListeners() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;

      // Skill keys
      if (e.key.toLowerCase() === 'q') {
        this.player.useSkill('spinAttack');
      }
      if (e.key.toLowerCase() === 'shift') {
        this.player.useSkill('dash');
      }
      if (e.key === ' ') {
        e.preventDefault();
        this.player.attack();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    // Mouse - attach to canvas only to avoid UI conflicts
    this.renderer.domElement.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    this.renderer.domElement.addEventListener('mousedown', (e) => {
      if (e.button === 0) { // Left click
        this.mouse.clicked = true;
        const gameState = useGameStore.getState().gameState;
        if (gameState === 'playing') {
          this.player.attack();
        }
      }
    });

    this.renderer.domElement.addEventListener('mouseup', () => {
      this.mouse.clicked = false;
    });

    // Window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const gameState = useGameStore.getState().gameState;

    if (gameState === 'playing') {
      // Update timer
      useGameStore.getState().updateTimer(delta);

      // Update skill cooldowns
      useGameStore.getState().updateSkillCooldowns(delta);

      // Handle input
      this.handleInput(delta);

      // Update player
      this.player.update(delta);

      // Update camera to follow player
      this.updateCamera();

      // Update monsters
      this.monsterManager.update(delta);

      // Update artifacts
      this.artifactManager.update(delta);

      // Update auto skills
      this.autoSkillManager.update(delta);

      // Check collisions
      this.checkCollisions();

      // Update BGM based on day
      this.updateBgm();
    }

    // Update UI
    this.uiManager.update();

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  handleInput(delta) {
    const moveX = (this.keys['d'] ? 1 : 0) - (this.keys['a'] ? 1 : 0);
    const moveZ = (this.keys['s'] ? 1 : 0) - (this.keys['w'] ? 1 : 0);

    if (moveX !== 0 || moveZ !== 0) {
      this.player.move(moveX, moveZ, delta);
    }
  }

  updateCamera() {
    if (!this.player || !this.player.mesh) return;

    const targetX = this.player.mesh.position.x;
    const targetZ = this.player.mesh.position.z + 15;

    // Smoother camera follow (reduced from 0.1 to 0.03)
    const smoothing = 0.03;
    this.camera.position.x += (targetX - this.camera.position.x) * smoothing;
    this.camera.position.z += (targetZ - this.camera.position.z) * smoothing;

    // Smooth lookAt target
    if (!this.cameraLookTarget) {
      this.cameraLookTarget = new THREE.Vector3();
    }
    this.cameraLookTarget.x += (this.player.mesh.position.x - this.cameraLookTarget.x) * smoothing;
    this.cameraLookTarget.z += (this.player.mesh.position.z - this.cameraLookTarget.z) * smoothing;

    this.camera.lookAt(this.cameraLookTarget.x, 0, this.cameraLookTarget.z);
  }

  checkCollisions() {
    const state = useGameStore.getState();
    if (state.gameState !== 'playing') return;

    const passives = state.run.passives;

    // Player vs Monsters
    const playerPos = this.player.mesh.position;
    const monsters = this.monsterManager.monsters;

    for (const monster of monsters) {
      if (monster.dead) continue;
      const dist = playerPos.distanceTo(monster.mesh.position);
      if (dist < 1.5 && !this.player.invincible) {
        // Monster damages player
        const damage = useGameStore.getState().takeDamage(monster.stats.atk);
        this.player.onHit();

        // Thorns: reflect 20% damage back to monster
        if (passives.includes('thorns')) {
          const reflectDamage = damage * PASSIVE_SKILLS.thorns.value;
          monster.takeDamage(reflectDamage);
        }

        // Knockback
        const dir = new THREE.Vector3()
          .subVectors(playerPos, monster.mesh.position)
          .normalize();
        this.player.knockback(dir);
      }
    }

    // Player vs Artifacts
    const artifacts = this.artifactManager.artifacts;
    for (const artifact of artifacts) {
      const dist = playerPos.distanceTo(artifact.mesh.position);
      if (dist < 2) {
        this.artifactManager.interact(artifact);
      }
    }
  }

  startNewRun() {
    // Clear existing entities
    this.monsterManager.clearAll();
    this.artifactManager.clearAll();
    this.autoSkillManager.clearAll();

    // Reset player position
    this.player.reset();

    // Generate new artifacts
    this.artifactManager.generateArtifacts();

    // Start game state
    useGameStore.getState().startGame();
  }

  getMouseWorldPosition() {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(this.mouse.x, this.mouse.y), this.camera);

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const target = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, target);

    return target;
  }

  updateBgm() {
    const currentDay = useGameStore.getState().run.day;

    if (currentDay !== this.lastDay) {
      this.lastDay = currentDay;

      // Play day change sound
      this.audio.playSfx('sfx_day_change');

      // Switch BGM based on day
      const bgmKey = this.audio.getBgmForDay(currentDay);
      this.audio.playBgm(bgmKey, 2);
    }
  }
}
