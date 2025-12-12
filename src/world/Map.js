import * as THREE from 'three';
import { GAME_CONFIG, COLORS } from '../utils/constants.js';

export class VoxelMap {
  constructor(scene) {
    this.scene = scene;
    this.groundMesh = null;
    this.decorations = [];
    this.obstacles = []; // Collision objects (trees, rocks)

    this.createGround();
    this.createDecorations();
  }

  // Get all obstacle positions and radii for collision detection
  getObstacles() {
    return this.obstacles;
  }

  // Check if a position collides with any obstacle
  checkCollision(position, radius = 0.5) {
    for (const obstacle of this.obstacles) {
      const dx = position.x - obstacle.x;
      const dz = position.z - obstacle.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < radius + obstacle.radius) {
        return obstacle;
      }
    }
    return null;
  }

  // Get pushed-out position if collision detected
  resolveCollision(position, radius = 0.5) {
    const obstacle = this.checkCollision(position, radius);
    if (!obstacle) return null;

    const dx = position.x - obstacle.x;
    const dz = position.z - obstacle.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance === 0) {
      // Directly on top of obstacle, push in random direction
      return {
        x: position.x + (Math.random() - 0.5) * 0.5,
        z: position.z + (Math.random() - 0.5) * 0.5
      };
    }

    // Push out in the direction away from obstacle center
    const overlap = radius + obstacle.radius - distance;
    const pushX = (dx / distance) * overlap;
    const pushZ = (dz / distance) * overlap;

    return {
      x: position.x + pushX,
      z: position.z + pushZ
    };
  }

  createGround() {
    const size = GAME_CONFIG.MAP_SIZE;

    // Create instanced mesh for ground tiles
    const tileGeometry = new THREE.BoxGeometry(1, 0.5, 1);
    const tileMaterial = new THREE.MeshLambertMaterial({ color: COLORS.ground });

    const count = size * size;
    const instancedMesh = new THREE.InstancedMesh(tileGeometry, tileMaterial, count);
    instancedMesh.receiveShadow = true;

    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();

    let index = 0;
    for (let x = -size / 2; x < size / 2; x++) {
      for (let z = -size / 2; z < size / 2; z++) {
        // Slight variation in height for natural look
        const heightVariation = Math.random() * 0.1 - 0.05;

        matrix.setPosition(x + 0.5, -0.25 + heightVariation, z + 0.5);
        instancedMesh.setMatrixAt(index, matrix);

        // Color variation
        const colorVariation = 0.9 + Math.random() * 0.2;
        if ((x + z) % 2 === 0) {
          color.setHex(COLORS.ground);
        } else {
          color.setHex(COLORS.groundDark);
        }
        color.multiplyScalar(colorVariation);
        instancedMesh.setColorAt(index, color);

        index++;
      }
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }

    this.groundMesh = instancedMesh;
    this.scene.add(instancedMesh);

    // Add edge walls
    this.createWalls(size);
  }

  createWalls(size) {
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
    const wallHeight = 3;

    // North wall
    const northWall = new THREE.Mesh(
      new THREE.BoxGeometry(size + 2, wallHeight, 1),
      wallMaterial
    );
    northWall.position.set(0, wallHeight / 2, -size / 2 - 0.5);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    this.scene.add(northWall);

    // South wall
    const southWall = new THREE.Mesh(
      new THREE.BoxGeometry(size + 2, wallHeight, 1),
      wallMaterial
    );
    southWall.position.set(0, wallHeight / 2, size / 2 + 0.5);
    southWall.castShadow = true;
    southWall.receiveShadow = true;
    this.scene.add(southWall);

    // East wall
    const eastWall = new THREE.Mesh(
      new THREE.BoxGeometry(1, wallHeight, size),
      wallMaterial
    );
    eastWall.position.set(size / 2 + 0.5, wallHeight / 2, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    this.scene.add(eastWall);

    // West wall
    const westWall = new THREE.Mesh(
      new THREE.BoxGeometry(1, wallHeight, size),
      wallMaterial
    );
    westWall.position.set(-size / 2 - 0.5, wallHeight / 2, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    this.scene.add(westWall);
  }

  createDecorations() {
    const size = GAME_CONFIG.MAP_SIZE;

    // Add some trees
    for (let i = 0; i < 30; i++) {
      const x = (Math.random() - 0.5) * size * 0.9;
      const z = (Math.random() - 0.5) * size * 0.9;

      // Don't place too close to center (spawn point)
      if (Math.abs(x) < 5 && Math.abs(z) < 5) continue;

      this.createTree(x, z);
    }

    // Add some rocks
    for (let i = 0; i < 20; i++) {
      const x = (Math.random() - 0.5) * size * 0.9;
      const z = (Math.random() - 0.5) * size * 0.9;

      if (Math.abs(x) < 3 && Math.abs(z) < 3) continue;

      this.createRock(x, z);
    }

    // Add some flowers/small plants
    for (let i = 0; i < 50; i++) {
      const x = (Math.random() - 0.5) * size * 0.9;
      const z = (Math.random() - 0.5) * size * 0.9;

      this.createFlower(x, z);
    }
  }

  createTree(x, z) {
    const group = new THREE.Group();

    // Trunk
    const trunkGeo = new THREE.BoxGeometry(0.6, 2.5, 0.6);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.25;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);

    // Leaves (stacked boxes for voxel look)
    const leavesMat = new THREE.MeshLambertMaterial({ color: 0x228b22 });

    // Bottom layer
    const leaves1 = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 1, 2.5),
      leavesMat
    );
    leaves1.position.y = 3;
    leaves1.castShadow = true;
    group.add(leaves1);

    // Middle layer
    const leaves2 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1, 2),
      leavesMat
    );
    leaves2.position.y = 4;
    leaves2.castShadow = true;
    group.add(leaves2);

    // Top layer
    const leaves3 = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1, 1.5),
      leavesMat
    );
    leaves3.position.y = 5;
    leaves3.castShadow = true;
    group.add(leaves3);

    // Top point
    const leaves4 = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.8, 0.8),
      leavesMat
    );
    leaves4.position.y = 5.8;
    leaves4.castShadow = true;
    group.add(leaves4);

    group.position.set(x, 0, z);

    // Random rotation
    group.rotation.y = Math.random() * Math.PI * 2;

    // Random scale variation
    const scale = 0.8 + Math.random() * 0.4;
    group.scale.setScalar(scale);

    this.scene.add(group);
    this.decorations.push(group);

    // Add to obstacles for collision (trunk radius)
    this.obstacles.push({
      x: x,
      z: z,
      radius: 0.5 * scale, // Trunk collision radius
      type: 'tree'
    });
  }

  createRock(x, z) {
    const group = new THREE.Group();

    const rockMat = new THREE.MeshLambertMaterial({
      color: 0x808080,
    });

    // Main rock body (irregular shape using multiple boxes)
    const rock1 = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.6, 1),
      rockMat
    );
    rock1.position.y = 0.3;
    rock1.rotation.y = Math.random() * Math.PI;
    rock1.castShadow = true;
    rock1.receiveShadow = true;
    group.add(rock1);

    // Additional rock pieces
    const rock2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.4, 0.6),
      rockMat
    );
    rock2.position.set(0.3, 0.5, 0.2);
    rock2.rotation.set(0.2, 0.5, 0.1);
    rock2.castShadow = true;
    group.add(rock2);

    const rock3 = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.3, 0.4),
      rockMat
    );
    rock3.position.set(-0.4, 0.4, -0.2);
    rock3.rotation.set(-0.1, 0.3, 0.2);
    rock3.castShadow = true;
    group.add(rock3);

    group.position.set(x, 0, z);

    // Random scale
    const scale = 0.5 + Math.random() * 0.8;
    group.scale.setScalar(scale);

    this.scene.add(group);
    this.decorations.push(group);

    // Add to obstacles for collision
    this.obstacles.push({
      x: x,
      z: z,
      radius: 0.7 * scale, // Rock collision radius
      type: 'rock'
    });
  }

  createFlower(x, z) {
    const group = new THREE.Group();

    // Stem
    const stemGeo = new THREE.BoxGeometry(0.05, 0.3, 0.05);
    const stemMat = new THREE.MeshLambertMaterial({ color: 0x228b22 });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.15;
    group.add(stem);

    // Flower head
    const colors = [0xff69b4, 0xffff00, 0xff4500, 0xda70d6, 0x00ffff];
    const flowerColor = colors[Math.floor(Math.random() * colors.length)];

    const flowerGeo = new THREE.BoxGeometry(0.2, 0.1, 0.2);
    const flowerMat = new THREE.MeshLambertMaterial({ color: flowerColor });
    const flower = new THREE.Mesh(flowerGeo, flowerMat);
    flower.position.y = 0.35;
    group.add(flower);

    group.position.set(x, 0, z);

    // Random scale
    const scale = 0.8 + Math.random() * 0.5;
    group.scale.setScalar(scale);

    this.scene.add(group);
    this.decorations.push(group);
  }
}
