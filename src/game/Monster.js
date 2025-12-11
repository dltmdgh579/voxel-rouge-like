import * as THREE from 'three';
import { useGameStore } from '../store/gameStore.js';
import { MONSTERS, SPAWN_RULES, GAME_CONFIG } from '../utils/constants.js';

let monsterId = 0;

class Monster {
  constructor(scene, type, position) {
    this.scene = scene;
    this.id = ++monsterId;
    this.type = type;
    this.stats = { ...MONSTERS[type] };
    this.hp = this.stats.hp;
    this.maxHp = this.stats.hp;
    this.dead = false;

    this.mesh = null;
    this.hpBar = null;

    this.createMesh(position);
  }

  createMesh(position) {
    const group = new THREE.Group();
    const type = this.type;
    const config = MONSTERS[type];

    // Different shapes for different monsters
    if (type === 'slime') {
      // Slime - bouncy blob
      const geo = new THREE.SphereGeometry(config.size * 0.5, 8, 6);
      const mat = new THREE.MeshLambertMaterial({ color: config.color });
      const body = new THREE.Mesh(geo, mat);
      body.scale.y = 0.7;
      body.position.y = config.size * 0.35;
      body.castShadow = true;
      group.add(body);

      // Eyes
      const eyeGeo = new THREE.SphereGeometry(0.1, 4, 4);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
      leftEye.position.set(-0.15, config.size * 0.4, -0.3);
      group.add(leftEye);
      const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
      rightEye.position.set(0.15, config.size * 0.4, -0.3);
      group.add(rightEye);

    } else if (type === 'goblin') {
      // Goblin - small humanoid
      const bodyGeo = new THREE.BoxGeometry(0.5, 0.7, 0.4);
      const mat = new THREE.MeshLambertMaterial({ color: config.color });
      const body = new THREE.Mesh(bodyGeo, mat);
      body.position.y = 0.5;
      body.castShadow = true;
      group.add(body);

      // Head
      const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.35);
      const head = new THREE.Mesh(headGeo, mat);
      head.position.y = 1.0;
      head.castShadow = true;
      group.add(head);

      // Ears
      const earGeo = new THREE.ConeGeometry(0.1, 0.25, 4);
      const leftEar = new THREE.Mesh(earGeo, mat);
      leftEar.position.set(-0.2, 1.2, 0);
      leftEar.rotation.z = -0.3;
      group.add(leftEar);
      const rightEar = new THREE.Mesh(earGeo, mat);
      rightEar.position.set(0.2, 1.2, 0);
      rightEar.rotation.z = 0.3;
      group.add(rightEar);

    } else if (type === 'wolf') {
      // Wolf - four-legged
      const bodyGeo = new THREE.BoxGeometry(0.6, 0.5, 1.0);
      const mat = new THREE.MeshLambertMaterial({ color: config.color });
      const body = new THREE.Mesh(bodyGeo, mat);
      body.position.y = 0.5;
      body.castShadow = true;
      group.add(body);

      // Head
      const headGeo = new THREE.BoxGeometry(0.4, 0.35, 0.5);
      const head = new THREE.Mesh(headGeo, mat);
      head.position.set(0, 0.55, -0.6);
      head.castShadow = true;
      group.add(head);

      // Snout
      const snoutGeo = new THREE.BoxGeometry(0.2, 0.15, 0.25);
      const snout = new THREE.Mesh(snoutGeo, mat);
      snout.position.set(0, 0.45, -0.9);
      group.add(snout);

    } else if (type === 'skeleton') {
      // Skeleton - thin humanoid
      const mat = new THREE.MeshLambertMaterial({ color: config.color });

      // Body
      const bodyGeo = new THREE.BoxGeometry(0.4, 0.8, 0.2);
      const body = new THREE.Mesh(bodyGeo, mat);
      body.position.y = 0.8;
      body.castShadow = true;
      group.add(body);

      // Head (skull)
      const headGeo = new THREE.BoxGeometry(0.35, 0.4, 0.3);
      const head = new THREE.Mesh(headGeo, mat);
      head.position.y = 1.4;
      head.castShadow = true;
      group.add(head);

      // Eye sockets
      const eyeGeo = new THREE.BoxGeometry(0.08, 0.1, 0.1);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
      leftEye.position.set(-0.08, 1.45, -0.15);
      group.add(leftEye);
      const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
      rightEye.position.set(0.08, 1.45, -0.15);
      group.add(rightEye);

    } else if (type === 'orc') {
      // Orc - large humanoid
      const mat = new THREE.MeshLambertMaterial({ color: config.color });

      // Body
      const bodyGeo = new THREE.BoxGeometry(0.9, 1.0, 0.6);
      const body = new THREE.Mesh(bodyGeo, mat);
      body.position.y = 0.9;
      body.castShadow = true;
      group.add(body);

      // Head
      const headGeo = new THREE.BoxGeometry(0.6, 0.5, 0.5);
      const head = new THREE.Mesh(headGeo, mat);
      head.position.y = 1.65;
      head.castShadow = true;
      group.add(head);

      // Arms
      const armGeo = new THREE.BoxGeometry(0.3, 0.8, 0.3);
      const leftArm = new THREE.Mesh(armGeo, mat);
      leftArm.position.set(-0.6, 0.9, 0);
      group.add(leftArm);
      const rightArm = new THREE.Mesh(armGeo, mat);
      rightArm.position.set(0.6, 0.9, 0);
      group.add(rightArm);

    } else if (type === 'mage') {
      // Mage - robed humanoid
      const mat = new THREE.MeshLambertMaterial({ color: config.color });

      // Robe body
      const bodyGeo = new THREE.ConeGeometry(0.4, 1.2, 6);
      const body = new THREE.Mesh(bodyGeo, mat);
      body.position.y = 0.6;
      body.castShadow = true;
      group.add(body);

      // Head
      const headGeo = new THREE.SphereGeometry(0.25, 8, 6);
      const headMat = new THREE.MeshLambertMaterial({ color: 0xffeaa7 });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 1.4;
      head.castShadow = true;
      group.add(head);

      // Hat
      const hatGeo = new THREE.ConeGeometry(0.3, 0.5, 6);
      const hat = new THREE.Mesh(hatGeo, mat);
      hat.position.y = 1.8;
      group.add(hat);

    } else {
      // Default box shape
      const geo = new THREE.BoxGeometry(config.size, config.size, config.size);
      const mat = new THREE.MeshLambertMaterial({ color: config.color });
      const body = new THREE.Mesh(geo, mat);
      body.position.y = config.size / 2;
      body.castShadow = true;
      group.add(body);
    }

    // HP bar
    const hpBarBg = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x333333 })
    );
    hpBarBg.position.y = config.size + 0.5;
    hpBarBg.rotation.x = -Math.PI / 4;
    group.add(hpBarBg);

    const hpBarFill = new THREE.Mesh(
      new THREE.PlaneGeometry(0.98, 0.08),
      new THREE.MeshBasicMaterial({ color: 0xff4757 })
    );
    hpBarFill.position.y = config.size + 0.5;
    hpBarFill.position.z = 0.01;
    hpBarFill.rotation.x = -Math.PI / 4;
    this.hpBar = hpBarFill;
    group.add(hpBarFill);

    this.mesh = group;
    this.mesh.position.copy(position);
    this.scene.add(this.mesh);
  }

  update(delta, playerPos) {
    if (this.dead) return;

    // Move towards player
    const direction = new THREE.Vector3()
      .subVectors(playerPos, this.mesh.position)
      .normalize();

    this.mesh.position.x += direction.x * this.stats.speed * delta;
    this.mesh.position.z += direction.z * this.stats.speed * delta;

    // Face player
    this.mesh.rotation.y = Math.atan2(direction.x, direction.z);

    // Animate (bounce for slime)
    if (this.type === 'slime') {
      const bounce = Math.sin(Date.now() * 0.01) * 0.1;
      this.mesh.position.y = bounce;
    }
  }

  takeDamage(amount) {
    if (this.dead) return;

    this.hp -= amount;

    // Update HP bar
    const hpPercent = Math.max(0, this.hp / this.maxHp);
    this.hpBar.scale.x = hpPercent;
    this.hpBar.position.x = (1 - hpPercent) * -0.5;

    // Flash white
    this.mesh.traverse((child) => {
      if (child.isMesh && child.material && !child.material.color.equals(new THREE.Color(0x000000))) {
        const original = child.material.color.getHex();
        child.material.color.setHex(0xffffff);
        setTimeout(() => {
          if (child.material) {
            child.material.color.setHex(original);
          }
        }, 50);
      }
    });

    // Create damage number
    this.showDamageNumber(amount);

    if (this.hp <= 0) {
      this.die();
    }
  }

  showDamageNumber(amount) {
    // Create floating damage text using sprite
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#ff6b6b';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.textAlign = 'center';
    ctx.strokeText(Math.floor(amount).toString(), 64, 48);
    ctx.fillText(Math.floor(amount).toString(), 64, 48);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(1.5, 0.75, 1);
    sprite.position.copy(this.mesh.position);
    sprite.position.y += 2;
    this.scene.add(sprite);

    // Animate floating up and fading
    const startY = sprite.position.y;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / 1000;

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

  die() {
    this.dead = true;

    // Rewards
    const store = useGameStore.getState();
    store.gainExp(this.stats.exp);
    store.addCoins(this.stats.coins);
    store.addKill();

    // Death animation
    const startTime = Date.now();
    const duration = 300;

    const animateDeath = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      this.mesh.scale.setScalar(1 - progress);
      this.mesh.position.y = progress * -0.5;
      this.mesh.rotation.y += 0.2;

      if (progress < 1) {
        requestAnimationFrame(animateDeath);
      } else {
        this.destroy();
      }
    };
    animateDeath();

    // Remove from store
    store.removeMonster(this.id);
  }

  destroy() {
    this.scene.remove(this.mesh);
    this.mesh.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }
}

export class MonsterManager {
  constructor(scene, game) {
    this.scene = scene;
    this.game = game;
    this.monsters = [];
    this.lastDay = 0;
    this.spawnTimer = 0;
  }

  update(delta) {
    const state = useGameStore.getState();
    const currentDay = state.run.day;
    const playerPos = this.game.player.mesh.position;

    // Only spawn after safe days
    if (currentDay > GAME_CONFIG.SAFE_DAYS) {
      // Update spawn timer
      this.spawnTimer += delta;

      // Calculate spawn interval based on day (faster spawns on later days)
      const spawnInterval = Math.max(
        GAME_CONFIG.SPAWN_INTERVAL_MIN,
        GAME_CONFIG.SPAWN_INTERVAL_BASE - (currentDay - 2) * 0.2
      );

      // Spawn monster if timer reached and under max limit
      if (this.spawnTimer >= spawnInterval && this.monsters.length < GAME_CONFIG.MAX_MONSTERS) {
        this.spawnContinuous(currentDay);
        this.spawnTimer = 0;
      }
    }

    // Track day changes (for potential future use)
    this.lastDay = currentDay;

    // Update monsters
    for (const monster of this.monsters) {
      monster.update(delta, playerPos);
    }

    // Remove dead monsters from array
    this.monsters = this.monsters.filter(m => !m.dead);
  }

  // Get available monster types for current day
  getAvailableTypes(day) {
    let rule = SPAWN_RULES[2]; // default
    const ruleKeys = Object.keys(SPAWN_RULES).map(Number).sort((a, b) => b - a);
    for (const key of ruleKeys) {
      if (day >= key) {
        rule = SPAWN_RULES[key];
        break;
      }
    }
    return rule.types.filter(type => MONSTERS[type].minDay <= day);
  }

  // Continuous spawning - spawn 1-2 monsters at a time
  spawnContinuous(day) {
    const availableTypes = this.getAvailableTypes(day);
    if (availableTypes.length === 0) return;

    // Spawn 1-2 monsters
    const count = Math.random() < 0.7 ? 1 : 2;
    for (let i = 0; i < count; i++) {
      if (this.monsters.length >= GAME_CONFIG.MAX_MONSTERS) break;
      const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      const position = this.getSpawnPosition();
      this.spawnMonster(type, position);
    }
  }

  getSpawnPosition() {
    const playerPos = this.game.player.mesh.position;
    const angle = Math.random() * Math.PI * 2;
    const distance = GAME_CONFIG.SPAWN_DISTANCE_MIN +
      Math.random() * (GAME_CONFIG.SPAWN_DISTANCE_MAX - GAME_CONFIG.SPAWN_DISTANCE_MIN);

    const x = playerPos.x + Math.cos(angle) * distance;
    const z = playerPos.z + Math.sin(angle) * distance;

    // Clamp to map
    const half = GAME_CONFIG.MAP_SIZE / 2 - 1;
    return new THREE.Vector3(
      Math.max(-half, Math.min(half, x)),
      0,
      Math.max(-half, Math.min(half, z))
    );
  }

  spawnMonster(type, position) {
    const monster = new Monster(this.scene, type, position);
    this.monsters.push(monster);
    useGameStore.getState().addMonster({ id: monster.id, type });
  }

  clearAll() {
    for (const monster of this.monsters) {
      monster.destroy();
    }
    this.monsters = [];
    this.lastDay = 0;
    useGameStore.getState().clearMonsters();
  }
}
