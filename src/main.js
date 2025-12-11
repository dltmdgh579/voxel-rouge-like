import { Game } from './game/Game.js';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
  // Initialize game
  const game = new Game();

  // Store game reference globally for debugging
  window.game = game;

  console.log('Voxel Survivor initialized!');
  console.log('Controls:');
  console.log('  WASD - Move');
  console.log('  Space/Click - Attack');
  console.log('  Q - Spin Attack');
  console.log('  Shift - Dash');
});
