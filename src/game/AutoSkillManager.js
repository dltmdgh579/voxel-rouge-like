import * as THREE from 'three';
import { useGameStore } from '../store/gameStore.js';
import { AUTO_SKILLS, PASSIVE_SKILLS } from '../utils/constants.js';

export class AutoSkillManager {
  constructor(scene, game) {
    this.scene = scene;
    this.game = game;

    // Cooldown timers for auto skills
    this.cooldowns = {};

    // Active visual objects for skills
    this.orbitals = [];
    this.spinningBlades = [];
    this.projectiles = [];
    this.auraEffect = null;

    // Poison aura tick timer
    this.poisonTickTimer = 0;

    // Regeneration timer
    this.regenTimer = 0;
  }

  update(delta) {
    const state = useGameStore.getState();
    if (state.gameState !== 'playing') return;

    const { autoSkills, passives } = state.run;
    const playerPos = this.game.player.mesh.position;
    const monsters = this.game.monsterManager.monsters;

    // Update auto skills
    autoSkills.forEach(skillId => {
      this.updateAutoSkill(skillId, delta, playerPos, monsters, state);
    });

    // Update passives
    this.updatePassives(delta, passives, state);

    // Update projectiles
    this.updateProjectiles(delta, monsters);

    // Clean up dead projectiles
    this.projectiles = this.projectiles.filter(p => !p.dead);
  }

  updateAutoSkill(skillId, delta, playerPos, monsters, state) {
    const skill = AUTO_SKILLS[skillId];
    if (!skill) return;

    switch (skillId) {
      case 'orbital':
        this.updateOrbital(delta, playerPos, monsters, skill);
        break;
      case 'fireball':
        this.updateFireball(delta, playerPos, monsters, skill);
        break;
      case 'lightning':
        this.updateLightning(delta, playerPos, monsters, skill);
        break;
      case 'poisonAura':
        this.updatePoisonAura(delta, playerPos, monsters, skill);
        break;
      case 'frostNova':
        this.updateFrostNova(delta, playerPos, monsters, skill);
        break;
      case 'spinningBlades':
        this.updateSpinningBlades(delta, playerPos, monsters, skill);
        break;
    }
  }

  // ============ ORBITAL ============
  updateOrbital(delta, playerPos, monsters, skill) {
    // Create orbitals if not exist
    if (this.orbitals.length === 0) {
      for (let i = 0; i < skill.count; i++) {
        const orb = this.createOrbitalMesh(skill.color);
        orb.angle = (Math.PI * 2 / skill.count) * i;
        this.orbitals.push(orb);
        this.scene.add(orb);
      }
    }

    // Update orbital positions
    this.orbitals.forEach(orb => {
      orb.angle += skill.speed * delta;
      orb.position.x = playerPos.x + Math.cos(orb.angle) * skill.radius;
      orb.position.z = playerPos.z + Math.sin(orb.angle) * skill.radius;
      orb.position.y = 1;
    });

    // Check collision with monsters (2D distance on XZ plane)
    monsters.forEach(monster => {
      if (monster.dead) return;
      this.orbitals.forEach(orb => {
        const dx = orb.position.x - monster.mesh.position.x;
        const dz = orb.position.z - monster.mesh.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 1.2) {
          if (!orb.hitCooldown || orb.hitCooldown <= 0) {
            monster.takeDamage(skill.damage);
            orb.hitCooldown = 0.5; // Hit cooldown per monster
          }
        }
      });
    });

    // Update hit cooldowns
    this.orbitals.forEach(orb => {
      if (orb.hitCooldown > 0) orb.hitCooldown -= delta;
    });
  }

  createOrbitalMesh(color) {
    const geo = new THREE.SphereGeometry(0.3, 8, 8);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    return mesh;
  }

  // ============ FIREBALL ============
  updateFireball(delta, playerPos, monsters, skill) {
    // Initialize cooldown
    if (this.cooldowns.fireball === undefined) this.cooldowns.fireball = 0;

    this.cooldowns.fireball -= delta;

    if (this.cooldowns.fireball <= 0 && monsters.length > 0) {
      // Find nearest monster
      let nearest = null;
      let nearestDist = Infinity;

      monsters.forEach(monster => {
        if (monster.dead) return;
        const dist = playerPos.distanceTo(monster.mesh.position);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = monster;
        }
      });

      if (nearest && nearestDist < 15) {
        this.shootFireball(playerPos, nearest.mesh.position, skill);
        this.cooldowns.fireball = skill.cooldown;
      }
    }
  }

  shootFireball(from, to, skill) {
    const geo = new THREE.SphereGeometry(0.35, 8, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: skill.color,
    });
    const fireball = new THREE.Mesh(geo, mat);
    fireball.position.set(from.x, 1, from.z);

    // Calculate direction on XZ plane only
    const direction = new THREE.Vector3(to.x - from.x, 0, to.z - from.z).normalize();

    this.projectiles.push({
      mesh: fireball,
      direction,
      speed: skill.speed,
      damage: skill.damage,
      type: 'fireball',
      dead: false,
      lifetime: 3,
    });

    this.scene.add(fireball);
  }

  // ============ LIGHTNING ============
  updateLightning(delta, playerPos, monsters, skill) {
    if (this.cooldowns.lightning === undefined) this.cooldowns.lightning = 0;

    this.cooldowns.lightning -= delta;

    if (this.cooldowns.lightning <= 0 && monsters.length > 0) {
      // Pick random monster
      const aliveMonsters = monsters.filter(m => !m.dead);
      if (aliveMonsters.length > 0) {
        const target = aliveMonsters[Math.floor(Math.random() * aliveMonsters.length)];
        this.strikeLightning(target, aliveMonsters, skill);
        this.cooldowns.lightning = skill.cooldown;
      }
    }
  }

  strikeLightning(target, monsters, skill) {
    // Visual effect
    this.createLightningEffect(target.mesh.position, skill.color);
    target.takeDamage(skill.damage);

    // Chain lightning
    let lastPos = target.mesh.position.clone();
    let hitMonsters = [target];

    for (let i = 1; i < skill.chainCount; i++) {
      // Find nearest unhit monster
      let nearest = null;
      let nearestDist = Infinity;

      monsters.forEach(monster => {
        if (monster.dead || hitMonsters.includes(monster)) return;
        const dist = lastPos.distanceTo(monster.mesh.position);
        if (dist < skill.chainRange && dist < nearestDist) {
          nearestDist = dist;
          nearest = monster;
        }
      });

      if (nearest) {
        this.createLightningEffect(nearest.mesh.position, skill.color);
        nearest.takeDamage(skill.damage * 0.7); // Chain does less damage
        hitMonsters.push(nearest);
        lastPos = nearest.mesh.position.clone();
      } else {
        break;
      }
    }
  }

  createLightningEffect(position, color) {
    const geo = new THREE.CylinderGeometry(0.1, 0.1, 10, 6);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9
    });
    const lightning = new THREE.Mesh(geo, mat);
    lightning.position.copy(position);
    lightning.position.y = 5;
    this.scene.add(lightning);

    // Flash effect
    setTimeout(() => {
      this.scene.remove(lightning);
      geo.dispose();
      mat.dispose();
    }, 100);
  }

  // ============ POISON AURA ============
  updatePoisonAura(delta, playerPos, monsters, skill) {
    // Create aura effect if not exists
    if (!this.auraEffect) {
      const geo = new THREE.RingGeometry(0.5, skill.radius, 32);
      const mat = new THREE.MeshBasicMaterial({
        color: skill.color,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      });
      this.auraEffect = new THREE.Mesh(geo, mat);
      this.auraEffect.rotation.x = -Math.PI / 2;
      this.scene.add(this.auraEffect);
    }

    // Update position
    this.auraEffect.position.copy(playerPos);
    this.auraEffect.position.y = 0.1;

    // Tick damage
    this.poisonTickTimer += delta;
    if (this.poisonTickTimer >= skill.tickRate) {
      this.poisonTickTimer = 0;

      monsters.forEach(monster => {
        if (monster.dead) return;
        const dist = playerPos.distanceTo(monster.mesh.position);
        if (dist < skill.radius) {
          monster.takeDamage(skill.damage);
        }
      });
    }
  }

  // ============ FROST NOVA ============
  updateFrostNova(delta, playerPos, monsters, skill) {
    if (this.cooldowns.frostNova === undefined) this.cooldowns.frostNova = 0;

    this.cooldowns.frostNova -= delta;

    if (this.cooldowns.frostNova <= 0) {
      // Check if any monster is in range
      const monstersInRange = monsters.filter(m =>
        !m.dead && playerPos.distanceTo(m.mesh.position) < skill.radius
      );

      if (monstersInRange.length > 0) {
        // Visual effect
        this.createFrostNovaEffect(playerPos, skill);

        // Damage and slow
        monstersInRange.forEach(monster => {
          monster.takeDamage(skill.damage);
          // Apply slow
          if (!monster.slowed) {
            monster.slowed = true;
            monster.originalSpeed = monster.stats.speed;
            monster.stats.speed *= skill.slowAmount;

            setTimeout(() => {
              if (monster && !monster.dead) {
                monster.stats.speed = monster.originalSpeed;
                monster.slowed = false;
              }
            }, skill.slowDuration * 1000);
          }
        });

        this.cooldowns.frostNova = skill.cooldown;
      }
    }
  }

  createFrostNovaEffect(position, skill) {
    const geo = new THREE.RingGeometry(0.5, skill.radius, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: skill.color,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    const nova = new THREE.Mesh(geo, mat);
    nova.position.copy(position);
    nova.position.y = 0.2;
    nova.rotation.x = -Math.PI / 2;
    nova.scale.set(0.1, 0.1, 0.1);
    this.scene.add(nova);

    // Expand and fade
    const startTime = performance.now();
    const duration = 300;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = elapsed / duration;

      if (progress < 1) {
        nova.scale.set(progress, progress, progress);
        nova.material.opacity = 0.6 * (1 - progress);
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(nova);
        geo.dispose();
        mat.dispose();
      }
    };
    animate();
  }

  // ============ SPINNING BLADES ============
  updateSpinningBlades(delta, playerPos, monsters, skill) {
    // Create blades if not exist
    if (this.spinningBlades.length === 0) {
      for (let i = 0; i < skill.count; i++) {
        const blade = this.createBladeMesh(skill.color);
        blade.angle = (Math.PI * 2 / skill.count) * i;
        this.spinningBlades.push(blade);
        this.scene.add(blade);
      }
    }

    // Update blade positions
    this.spinningBlades.forEach(blade => {
      blade.angle += skill.speed * delta;
      blade.position.x = playerPos.x + Math.cos(blade.angle) * skill.radius;
      blade.position.z = playerPos.z + Math.sin(blade.angle) * skill.radius;
      blade.position.y = 0.8;
      blade.rotation.y = blade.angle + Math.PI / 2;
    });

    // Check collision with monsters (2D distance on XZ plane)
    monsters.forEach(monster => {
      if (monster.dead) return;
      this.spinningBlades.forEach(blade => {
        const dx = blade.position.x - monster.mesh.position.x;
        const dz = blade.position.z - monster.mesh.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 1.5) {
          if (!blade.hitCooldown || blade.hitCooldown <= 0) {
            monster.takeDamage(skill.damage);
            blade.hitCooldown = 0.3;
          }
        }
      });
    });

    // Update hit cooldowns
    this.spinningBlades.forEach(blade => {
      if (blade.hitCooldown > 0) blade.hitCooldown -= delta;
    });
  }

  createBladeMesh(color) {
    const geo = new THREE.BoxGeometry(0.1, 0.6, 1.2);
    const mat = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    return mesh;
  }

  // ============ PASSIVES ============
  updatePassives(delta, passives, state) {
    // Regeneration
    if (passives.includes('regeneration')) {
      this.regenTimer += delta;
      if (this.regenTimer >= 1) {
        this.regenTimer = 0;
        useGameStore.getState().heal(PASSIVE_SKILLS.regeneration.value);
      }
    }
  }

  // ============ PROJECTILES ============
  updateProjectiles(delta, monsters) {
    this.projectiles.forEach(proj => {
      if (proj.dead) return;

      // Move projectile
      proj.mesh.position.add(proj.direction.clone().multiplyScalar(proj.speed * delta));
      proj.lifetime -= delta;

      // Check lifetime
      if (proj.lifetime <= 0) {
        proj.dead = true;
        this.scene.remove(proj.mesh);
        return;
      }

      // Check collision with monsters (2D distance on XZ plane)
      monsters.forEach(monster => {
        if (monster.dead || proj.dead) return;
        const dx = proj.mesh.position.x - monster.mesh.position.x;
        const dz = proj.mesh.position.z - monster.mesh.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 1.2) {
          monster.takeDamage(proj.damage);
          proj.dead = true;
          this.scene.remove(proj.mesh);

          // Explosion effect for fireball
          if (proj.type === 'fireball') {
            this.createExplosionEffect(proj.mesh.position, 0xff6b6b);
          }
        }
      });
    });
  }

  createExplosionEffect(position, color) {
    const geo = new THREE.SphereGeometry(0.5, 8, 8);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8
    });
    const explosion = new THREE.Mesh(geo, mat);
    explosion.position.copy(position);
    this.scene.add(explosion);

    const startTime = performance.now();
    const duration = 200;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = elapsed / duration;

      if (progress < 1) {
        explosion.scale.setScalar(1 + progress * 2);
        explosion.material.opacity = 0.8 * (1 - progress);
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(explosion);
        geo.dispose();
        mat.dispose();
      }
    };
    animate();
  }

  // ============ CLEANUP ============
  clearAll() {
    // Remove orbitals
    this.orbitals.forEach(orb => {
      this.scene.remove(orb);
      orb.geometry.dispose();
      orb.material.dispose();
    });
    this.orbitals = [];

    // Remove spinning blades
    this.spinningBlades.forEach(blade => {
      this.scene.remove(blade);
      blade.geometry.dispose();
      blade.material.dispose();
    });
    this.spinningBlades = [];

    // Remove projectiles
    this.projectiles.forEach(proj => {
      this.scene.remove(proj.mesh);
    });
    this.projectiles = [];

    // Remove aura
    if (this.auraEffect) {
      this.scene.remove(this.auraEffect);
      this.auraEffect.geometry.dispose();
      this.auraEffect.material.dispose();
      this.auraEffect = null;
    }

    // Reset cooldowns
    this.cooldowns = {};
    this.poisonTickTimer = 0;
    this.regenTimer = 0;
  }
}
