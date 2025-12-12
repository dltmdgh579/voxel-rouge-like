import * as THREE from 'three';
import { useGameStore } from '../store/gameStore.js';
import { audioManager } from './AudioManager.js';
import { GAME_CONFIG, COLORS, SKILLS, PASSIVE_SKILLS, SKILL_UPGRADES } from '../utils/constants.js';

export class Player {
  constructor(scene, game) {
    this.scene = scene;
    this.game = game;

    this.mesh = null;
    this.attackMesh = null;
    this.attackTimer = 0;
    this.invincible = false;
    this.invincibleTimer = 0;

    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3(0, 0, -1);

    this.createMesh();
  }

  createMesh() {
    // Create voxel-style player
    const group = new THREE.Group();

    // Body
    const bodyGeo = new THREE.BoxGeometry(0.8, 1.2, 0.6);
    const bodyMat = new THREE.MeshLambertMaterial({ color: COLORS.player });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.8;
    body.castShadow = true;
    group.add(body);

    // Head
    const headGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const headMat = new THREE.MeshLambertMaterial({ color: COLORS.playerLight });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.7;
    head.castShadow = true;
    group.add(head);

    // Left arm
    const armGeo = new THREE.BoxGeometry(0.25, 0.8, 0.25);
    const armMat = new THREE.MeshLambertMaterial({ color: COLORS.player });
    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.55, 0.8, 0);
    leftArm.castShadow = true;
    group.add(leftArm);

    // Right arm (weapon hand)
    const rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(0.55, 0.8, 0);
    rightArm.castShadow = true;
    group.add(rightArm);

    // Weapon (sword)
    const weaponGeo = new THREE.BoxGeometry(0.15, 1.2, 0.1);
    const weaponMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    this.weapon = new THREE.Mesh(weaponGeo, weaponMat);
    this.weapon.position.set(0.55, 1.2, -0.3);
    this.weapon.rotation.x = -0.3;
    this.weapon.castShadow = true;
    group.add(this.weapon);

    // Left leg
    const legGeo = new THREE.BoxGeometry(0.3, 0.6, 0.3);
    const legMat = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.2, 0.3, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    // Right leg
    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.2, 0.3, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    this.mesh = group;
    this.mesh.position.set(0, 0, 0);
    this.scene.add(this.mesh);

    // Create attack effect mesh (hidden by default)
    this.createAttackMesh();
  }

  createAttackMesh() {
    // Attack swing effect - match ATTACK_RANGE (2)
    const geo = new THREE.RingGeometry(0.3, GAME_CONFIG.ATTACK_RANGE, 12, 1, 0, Math.PI);
    const mat = new THREE.MeshBasicMaterial({
      color: COLORS.attack,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    this.attackMesh = new THREE.Mesh(geo, mat);
    this.attackMesh.rotation.x = -Math.PI / 2;
    this.attackMesh.visible = false;
    this.scene.add(this.attackMesh);

    // Spin attack effect - match skill radius (3)
    const spinGeo = new THREE.RingGeometry(0.3, SKILLS.spinAttack.radius, 32);
    const spinMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    this.spinAttackMesh = new THREE.Mesh(spinGeo, spinMat);
    this.spinAttackMesh.rotation.x = -Math.PI / 2;
    this.spinAttackMesh.visible = false;
    this.scene.add(this.spinAttackMesh);
  }

  move(x, z, delta) {
    const stats = useGameStore.getState().run.stats;
    const speed = GAME_CONFIG.PLAYER_SPEED * stats.spd;

    // Normalize diagonal movement
    const length = Math.sqrt(x * x + z * z);
    const normalizedX = x / length;
    const normalizedZ = z / length;

    // Calculate new position
    let newX = this.mesh.position.x + normalizedX * speed * delta;
    let newZ = this.mesh.position.z + normalizedZ * speed * delta;

    // Clamp to map bounds
    const half = GAME_CONFIG.MAP_SIZE / 2 - 1;
    newX = Math.max(-half, Math.min(half, newX));
    newZ = Math.max(-half, Math.min(half, newZ));

    // Check collision with obstacles
    const map = this.game.map;
    if (map) {
      const resolved = map.resolveCollision({ x: newX, z: newZ }, 0.5);
      if (resolved) {
        newX = resolved.x;
        newZ = resolved.z;
        // Re-clamp after collision resolution
        newX = Math.max(-half, Math.min(half, newX));
        newZ = Math.max(-half, Math.min(half, newZ));
      }
    }

    this.mesh.position.x = newX;
    this.mesh.position.z = newZ;

    // Update direction
    if (x !== 0 || z !== 0) {
      this.direction.set(normalizedX, 0, normalizedZ);
      this.mesh.rotation.y = Math.atan2(normalizedX, normalizedZ);
    }
  }

  attack() {
    if (this.attackTimer > 0) return;

    const state = useGameStore.getState();
    const stats = state.run.stats;
    const passives = state.run.passives;
    const upgrades = state.run.skillUpgrades;

    this.attackTimer = GAME_CONFIG.ATTACK_COOLDOWN;

    // Play attack sound
    audioManager.playAttack();

    // Show attack effect
    this.showAttackEffect();

    // Multi-strike: attack twice
    const attackCount = upgrades.multiStrike ? SKILL_UPGRADES.multiStrike.effects.attackCount : 1;

    // Check for monster hits
    const monsters = this.game.monsterManager.monsters;
    const playerPos = this.mesh.position;

    let totalDamageDealt = 0;

    for (let strike = 0; strike < attackCount; strike++) {
      for (const monster of monsters) {
        if (monster.dead) continue;
        const dist = playerPos.distanceTo(monster.mesh.position);

        if (dist < GAME_CONFIG.ATTACK_RANGE) {
          // Check if monster is in attack direction (180 degree arc)
          const toMonster = new THREE.Vector3()
            .subVectors(monster.mesh.position, playerPos)
            .normalize();
          const dot = this.direction.dot(toMonster);

          if (dot > 0 || dist < 1.5) {
            // Calculate damage
            let damage = stats.atk;

            // Berserk: +30% ATK when HP below 50%
            if (passives.includes('berserk')) {
              const hpPercent = stats.hp / stats.maxHp;
              if (hpPercent < PASSIVE_SKILLS.berserk.threshold) {
                damage *= (1 + PASSIVE_SKILLS.berserk.value);
              }
            }

            // Crit check
            if (Math.random() < stats.crit) {
              damage *= stats.critDmg;
            }

            monster.takeDamage(damage);
            totalDamageDealt += damage;
          }
        }
      }
    }

    // Lifesteal: heal 5% of damage dealt
    if (passives.includes('lifesteal') && totalDamageDealt > 0) {
      const healAmount = totalDamageDealt * PASSIVE_SKILLS.lifesteal.value;
      useGameStore.getState().heal(healAmount);
    }

    // Animate weapon swing
    this.animateWeaponSwing();
  }

  showAttackEffect() {
    this.attackMesh.position.copy(this.mesh.position);
    this.attackMesh.position.y = 0.5;
    // Fix direction: rotate to match player facing direction
    this.attackMesh.rotation.z = this.mesh.rotation.y + Math.PI;
    this.attackMesh.visible = true;
    this.attackMesh.material.opacity = 0.6;

    setTimeout(() => {
      this.attackMesh.visible = false;
    }, 150);
  }

  animateWeaponSwing() {
    const startRotation = -0.3;
    const endRotation = -1.5;
    const duration = 150;
    const start = performance.now();

    const animate = () => {
      const elapsed = performance.now() - start;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 0.5) {
        this.weapon.rotation.x = startRotation + (endRotation - startRotation) * (progress * 2);
      } else {
        this.weapon.rotation.x = endRotation + (startRotation - endRotation) * ((progress - 0.5) * 2);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  useSkill(skillName) {
    const state = useGameStore.getState();
    if (state.gameState !== 'playing') return;

    const cooldowns = state.run.skillCooldowns;
    const upgrades = state.run.skillUpgrades;
    const skill = SKILLS[skillName];

    if (!skill) return;
    if (cooldowns[skillName] && cooldowns[skillName] > 0) return;

    // Calculate cooldown with upgrades
    let cooldown = skill.cooldown;
    if (skillName === 'dash' && upgrades.dashMaster) {
      cooldown -= SKILL_UPGRADES.dashMaster.effects.cooldownReduction;
    }

    // Set cooldown
    state.setSkillCooldown(skillName, cooldown);

    // Execute skill
    if (skillName === 'spinAttack') {
      audioManager.playSfx('sfx_skill_spin');
      this.spinAttack();
    } else if (skillName === 'dash') {
      audioManager.playSfx('sfx_skill_dash');
      this.dash();
    }
  }

  spinAttack() {
    const skill = SKILLS.spinAttack;
    const state = useGameStore.getState();
    const stats = state.run.stats;
    const upgrades = state.run.skillUpgrades;
    const passives = state.run.passives;

    // Apply spinMaster upgrade
    let radius = skill.radius;
    let damageMultiplier = skill.damage;
    if (upgrades.spinMaster) {
      radius += SKILL_UPGRADES.spinMaster.effects.radiusBonus;
      damageMultiplier *= (1 + SKILL_UPGRADES.spinMaster.effects.damageBonus);
    }

    let damage = stats.atk * damageMultiplier;

    // Berserk bonus
    if (passives.includes('berserk')) {
      const hpPercent = stats.hp / stats.maxHp;
      if (hpPercent < PASSIVE_SKILLS.berserk.threshold) {
        damage *= (1 + PASSIVE_SKILLS.berserk.value);
      }
    }

    // Show spin effect - no scaling, just fade out
    this.spinAttackMesh.position.copy(this.mesh.position);
    this.spinAttackMesh.position.y = 0.5;
    this.spinAttackMesh.visible = true;
    this.spinAttackMesh.scale.set(radius / skill.radius, radius / skill.radius, radius / skill.radius);
    this.spinAttackMesh.material.opacity = 0.6;

    // Animate fade out only (no scale change to match actual range)
    const startTime = performance.now();
    const duration = 300;

    const animateSpin = () => {
      const elapsed = performance.now() - startTime;
      const progress = elapsed / duration;

      if (progress < 1) {
        this.spinAttackMesh.material.opacity = 0.6 * (1 - progress);
        this.mesh.rotation.y += 0.3;
        requestAnimationFrame(animateSpin);
      } else {
        this.spinAttackMesh.visible = false;
      }
    };
    animateSpin();

    // Damage all monsters in radius
    const monsters = this.game.monsterManager.monsters;
    const playerPos = this.mesh.position;
    let totalDamageDealt = 0;

    for (const monster of monsters) {
      if (monster.dead) continue;
      const dist = playerPos.distanceTo(monster.mesh.position);
      if (dist < radius) {
        monster.takeDamage(damage);
        totalDamageDealt += damage;
      }
    }

    // Lifesteal
    if (passives.includes('lifesteal') && totalDamageDealt > 0) {
      const healAmount = totalDamageDealt * PASSIVE_SKILLS.lifesteal.value;
      useGameStore.getState().heal(healAmount);
    }
  }

  dash() {
    const skill = SKILLS.dash;
    const upgrades = useGameStore.getState().run.skillUpgrades;

    // Make invincible during dash
    this.invincible = true;

    // Apply dashMaster upgrade
    let dashDistance = skill.distance;
    if (upgrades.dashMaster) {
      dashDistance += SKILL_UPGRADES.dashMaster.effects.distanceBonus;
    }

    const startPos = this.mesh.position.clone();
    let endPos = startPos.clone().add(this.direction.clone().multiplyScalar(dashDistance));

    // Clamp to bounds
    const half = GAME_CONFIG.MAP_SIZE / 2 - 1;
    endPos.x = Math.max(-half, Math.min(half, endPos.x));
    endPos.z = Math.max(-half, Math.min(half, endPos.z));

    // Check for obstacles along dash path and stop at first collision
    const map = this.game.map;
    if (map) {
      const steps = 10; // Check collision at multiple points
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const checkX = startPos.x + (endPos.x - startPos.x) * t;
        const checkZ = startPos.z + (endPos.z - startPos.z) * t;

        if (map.checkCollision({ x: checkX, z: checkZ }, 0.5)) {
          // Stop dash just before the obstacle
          const safeT = Math.max(0, (i - 1) / steps);
          endPos.x = startPos.x + (endPos.x - startPos.x) * safeT;
          endPos.z = startPos.z + (endPos.z - startPos.z) * safeT;
          break;
        }
      }
    }

    // Animate dash
    const startTime = performance.now();
    const duration = 200;

    const animateDash = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing
      const eased = 1 - Math.pow(1 - progress, 3);

      this.mesh.position.lerpVectors(startPos, endPos, eased);

      if (progress < 1) {
        requestAnimationFrame(animateDash);
      } else {
        this.invincible = false;
      }
    };

    animateDash();

    // Create trail effect
    this.createDashTrail(startPos, endPos);
  }

  createDashTrail(start, end) {
    const trailGeo = new THREE.BoxGeometry(0.3, 1, 0.3);
    const trailMat = new THREE.MeshBasicMaterial({
      color: 0x74b9ff,
      transparent: true,
      opacity: 0.5,
    });

    for (let i = 0; i < 5; i++) {
      const trail = new THREE.Mesh(trailGeo, trailMat.clone());
      const t = i / 5;
      trail.position.lerpVectors(start, end, t);
      trail.position.y = 0.8;
      this.scene.add(trail);

      // Fade out and remove
      const startFade = performance.now() + i * 50;
      const fadeDuration = 300;

      const fadeTrail = () => {
        const elapsed = performance.now() - startFade;
        if (elapsed < 0) {
          requestAnimationFrame(fadeTrail);
          return;
        }
        const progress = elapsed / fadeDuration;
        trail.material.opacity = 0.5 * (1 - progress);
        trail.scale.setScalar(1 - progress * 0.5);

        if (progress < 1) {
          requestAnimationFrame(fadeTrail);
        } else {
          this.scene.remove(trail);
          trail.geometry.dispose();
          trail.material.dispose();
        }
      };
      fadeTrail();
    }
  }

  onHit() {
    // Play hit sound
    audioManager.playSfx('sfx_player_hit');

    // Flash red
    this.mesh.traverse((child) => {
      if (child.isMesh && child.material) {
        const originalColor = child.material.color.getHex();
        child.material.color.setHex(0xff0000);

        setTimeout(() => {
          child.material.color.setHex(originalColor);
        }, 100);
      }
    });

    // Brief invincibility
    this.invincible = true;
    setTimeout(() => {
      this.invincible = false;
    }, 500);
  }

  knockback(direction) {
    const knockbackForce = 2;
    // Fix: Ignore Y component to prevent player from going underground
    const flatDirection = new THREE.Vector3(direction.x, 0, direction.z).normalize();
    this.velocity.copy(flatDirection.multiplyScalar(knockbackForce));

    const startTime = performance.now();
    const duration = 150;

    const animateKnockback = () => {
      const elapsed = performance.now() - startTime;
      const progress = elapsed / duration;

      if (progress < 1) {
        const movement = this.velocity.clone().multiplyScalar(0.05 * (1 - progress));
        movement.y = 0; // Ensure no Y movement
        this.mesh.position.add(movement);
        // Keep player on ground
        this.mesh.position.y = 0;
        requestAnimationFrame(animateKnockback);
      }
    };

    animateKnockback();
  }

  update(delta) {
    // Update attack cooldown
    if (this.attackTimer > 0) {
      this.attackTimer -= delta;
    }

    // Update invincibility
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= delta;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
      }
    }

    // Safety: Always keep player on ground level
    if (this.mesh.position.y !== 0) {
      this.mesh.position.y = 0;
    }
  }

  reset() {
    this.mesh.position.set(0, 0, 0);
    this.mesh.rotation.y = 0;
    this.direction.set(0, 0, -1);
    this.attackTimer = 0;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.velocity.set(0, 0, 0);
  }
}
