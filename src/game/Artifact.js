import * as THREE from 'three';
import { useGameStore } from '../store/gameStore.js';
import { ARTIFACTS, GAME_CONFIG } from '../utils/constants.js';

let artifactId = 0;

class Artifact {
  constructor(scene, type, position) {
    this.scene = scene;
    this.id = ++artifactId;
    this.type = type;
    this.config = ARTIFACTS[type];
    this.collected = false;

    this.mesh = null;
    this.createMesh(position);
  }

  createMesh(position) {
    const group = new THREE.Group();
    const config = this.config;

    if (this.type === 'crystal') {
      // Crystal - floating gem
      const geo = new THREE.OctahedronGeometry(0.5, 0);
      const mat = new THREE.MeshPhongMaterial({
        color: config.color,
        emissive: config.emissive,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.9,
      });
      const crystal = new THREE.Mesh(geo, mat);
      crystal.position.y = 1.2;
      crystal.castShadow = true;
      group.add(crystal);
      this.crystalMesh = crystal;

      // Glow
      const glowGeo = new THREE.SphereGeometry(0.7, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: config.emissive,
        transparent: true,
        opacity: 0.2,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.y = 1.2;
      group.add(glow);

    } else if (this.type === 'chest') {
      // Chest - box shape
      const bodyGeo = new THREE.BoxGeometry(0.8, 0.5, 0.5);
      const mat = new THREE.MeshLambertMaterial({ color: config.color });
      const body = new THREE.Mesh(bodyGeo, mat);
      body.position.y = 0.25;
      body.castShadow = true;
      group.add(body);

      // Lid
      const lidGeo = new THREE.BoxGeometry(0.85, 0.15, 0.55);
      const lid = new THREE.Mesh(lidGeo, mat);
      lid.position.y = 0.55;
      lid.castShadow = true;
      group.add(lid);

      // Lock
      const lockGeo = new THREE.BoxGeometry(0.15, 0.2, 0.1);
      const lockMat = new THREE.MeshLambertMaterial({ color: 0xbdc3c7 });
      const lock = new THREE.Mesh(lockGeo, lockMat);
      lock.position.set(0, 0.3, -0.3);
      group.add(lock);

    } else if (this.type === 'fountain') {
      // Fountain - circular base with water
      const baseGeo = new THREE.CylinderGeometry(0.8, 1, 0.3, 16);
      const baseMat = new THREE.MeshLambertMaterial({ color: 0x636e72 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 0.15;
      base.castShadow = true;
      group.add(base);

      // Water
      const waterGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.2, 16);
      const waterMat = new THREE.MeshPhongMaterial({
        color: config.color,
        emissive: config.emissive,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.8,
      });
      const water = new THREE.Mesh(waterGeo, waterMat);
      water.position.y = 0.35;
      group.add(water);

      // Pillar
      const pillarGeo = new THREE.CylinderGeometry(0.15, 0.2, 1, 8);
      const pillar = new THREE.Mesh(pillarGeo, baseMat);
      pillar.position.y = 0.7;
      group.add(pillar);

    } else if (this.type === 'altar') {
      // Altar - stone platform with glow
      const baseGeo = new THREE.BoxGeometry(1.5, 0.2, 1.5);
      const baseMat = new THREE.MeshLambertMaterial({ color: 0x636e72 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 0.1;
      base.castShadow = true;
      group.add(base);

      // Pillars
      const pillarGeo = new THREE.BoxGeometry(0.2, 1.2, 0.2);
      const positions = [
        [-0.55, 0.7, -0.55],
        [0.55, 0.7, -0.55],
        [-0.55, 0.7, 0.55],
        [0.55, 0.7, 0.55],
      ];
      for (const pos of positions) {
        const pillar = new THREE.Mesh(pillarGeo, baseMat);
        pillar.position.set(...pos);
        pillar.castShadow = true;
        group.add(pillar);
      }

      // Glowing center
      const glowGeo = new THREE.SphereGeometry(0.4, 16, 16);
      const glowMat = new THREE.MeshPhongMaterial({
        color: config.color,
        emissive: config.emissive,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.8,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.y = 1.0;
      group.add(glow);
      this.glowMesh = glow;

    } else if (this.type === 'grass') {
      // Tall grass - simple bundle
      const grassMat = new THREE.MeshLambertMaterial({
        color: config.color,
        side: THREE.DoubleSide,
      });

      for (let i = 0; i < 5; i++) {
        const grassGeo = new THREE.PlaneGeometry(0.15, 0.8);
        const grass = new THREE.Mesh(grassGeo, grassMat);
        const angle = (i / 5) * Math.PI * 2;
        grass.position.set(
          Math.cos(angle) * 0.2,
          0.4,
          Math.sin(angle) * 0.2
        );
        grass.rotation.y = angle;
        grass.rotation.x = 0.1;
        group.add(grass);
      }
    }

    this.mesh = group;
    this.mesh.position.copy(position);
    this.scene.add(this.mesh);
  }

  update(delta) {
    if (this.collected) return;

    // Floating animation for crystal
    if (this.type === 'crystal' && this.crystalMesh) {
      this.crystalMesh.rotation.y += delta * 2;
      this.crystalMesh.position.y = 1.2 + Math.sin(Date.now() * 0.003) * 0.2;
    }

    // Pulse animation for altar
    if (this.type === 'altar' && this.glowMesh) {
      const scale = 1 + Math.sin(Date.now() * 0.005) * 0.1;
      this.glowMesh.scale.setScalar(scale);
    }
  }

  collect() {
    if (this.collected) return;
    this.collected = true;

    const store = useGameStore.getState();
    const config = this.config;

    // Apply effect
    switch (config.effect) {
      case 'exp':
        store.gainExp(config.value);
        this.showText(`+${config.value} EXP`);
        break;

      case 'heal':
        store.heal(config.value);
        this.showText(`+${config.value} HP`);
        break;

      case 'levelup':
        store.gainExp(store.run.expToNext); // Instant level up
        this.showText('LEVEL UP!');
        break;

      case 'random':
        const roll = Math.random();
        if (roll < 0.5) {
          const exp = 30 + Math.floor(Math.random() * 50);
          store.gainExp(exp);
          this.showText(`+${exp} EXP`);
        } else {
          const coins = 10 + Math.floor(Math.random() * 30);
          store.addCoins(coins);
          this.showText(`+${coins} Coins`);
        }
        break;
    }

    // Collection animation
    this.animateCollection();
  }

  showText(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#ffd700';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.strokeText(text, 128, 48);
    ctx.fillText(text, 128, 48);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(3, 0.75, 1);
    sprite.position.copy(this.mesh.position);
    sprite.position.y += 2;
    this.scene.add(sprite);

    // Animate
    const startY = sprite.position.y;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / 1500;

      sprite.position.y = startY + progress * 2;
      sprite.material.opacity = 1 - progress;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(sprite);
        sprite.material.dispose();
        texture.dispose();
      }
    };
    animate();
  }

  animateCollection() {
    const startTime = Date.now();
    const duration = 500;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      this.mesh.scale.setScalar(1 - progress);
      this.mesh.position.y = progress * 2;
      this.mesh.rotation.y += 0.2;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.destroy();
      }
    };
    animate();

    useGameStore.getState().removeArtifact(this.id);
  }

  destroy() {
    this.scene.remove(this.mesh);
    this.mesh.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
}

export class ArtifactManager {
  constructor(scene, game) {
    this.scene = scene;
    this.game = game;
    this.artifacts = [];
  }

  update(delta) {
    for (const artifact of this.artifacts) {
      artifact.update(delta);
    }

    // Remove collected artifacts
    this.artifacts = this.artifacts.filter(a => !a.collected);
  }

  generateArtifacts() {
    const mapSize = GAME_CONFIG.MAP_SIZE;

    // Place crystals
    for (let i = 0; i < 5; i++) {
      const pos = this.getRandomPosition(mapSize);
      this.spawnArtifact('crystal', pos);
    }

    // Place chests
    for (let i = 0; i < 3; i++) {
      const pos = this.getRandomPosition(mapSize);
      this.spawnArtifact('chest', pos);
    }

    // Place fountain
    const fountainPos = this.getRandomPosition(mapSize);
    this.spawnArtifact('fountain', fountainPos);

    // Place altar
    const altarPos = this.getRandomPosition(mapSize);
    this.spawnArtifact('altar', altarPos);

    // Place grass bundles
    for (let i = 0; i < 20; i++) {
      const pos = this.getRandomPosition(mapSize);
      this.spawnArtifact('grass', pos);
    }
  }

  getRandomPosition(mapSize) {
    const half = mapSize / 2 - 2;
    return new THREE.Vector3(
      (Math.random() - 0.5) * mapSize * 0.8,
      0,
      (Math.random() - 0.5) * mapSize * 0.8
    );
  }

  spawnArtifact(type, position) {
    const artifact = new Artifact(this.scene, type, position);
    this.artifacts.push(artifact);
    useGameStore.getState().addArtifact({ id: artifact.id, type });
  }

  interact(artifact) {
    artifact.collect();
  }

  clearAll() {
    for (const artifact of this.artifacts) {
      artifact.destroy();
    }
    this.artifacts = [];
  }
}
