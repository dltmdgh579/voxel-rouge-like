// Game Constants
export const GAME_CONFIG = {
  // Map settings
  MAP_SIZE: 50,
  VOXEL_SIZE: 1,

  // Day settings
  DAY_DURATION: 60, // seconds
  SAFE_DAYS: 1, // No monsters until day 2

  // Player settings
  PLAYER_SPEED: 8,
  PLAYER_SIZE: 1,
  ATTACK_RANGE: 2.5,
  ATTACK_COOLDOWN: 0.4, // seconds

  // Camera settings
  CAMERA_HEIGHT: 25,
  CAMERA_ANGLE: 60, // degrees

  // Monster spawn settings
  SPAWN_DISTANCE_MIN: 10,
  SPAWN_DISTANCE_MAX: 20,

  // Continuous spawn settings
  SPAWN_INTERVAL_BASE: 3.0, // Base seconds between spawns
  SPAWN_INTERVAL_MIN: 1.0, // Minimum spawn interval
  MAX_MONSTERS: 30, // Maximum monsters at once
};

// Player base stats
export const BASE_STATS = {
  hp: 100,
  maxHp: 100,
  atk: 10,
  def: 0,
  spd: 1.0,
  crit: 0.05,
  critDmg: 1.5,
};

// Level up EXP requirements
export const LEVEL_EXP = [
  0, 100, 150, 200, 300, 400, 500, 650, 800, 1000,
  1200, 1500, 1800, 2200, 2600, 3000, 3500, 4000, 4500, 5000
];

// Monster definitions
export const MONSTERS = {
  slime: {
    name: 'Slime',
    hp: 20,
    atk: 5,
    speed: 2,
    exp: 10,
    coins: 5,
    color: 0x7bed9f,
    size: 0.8,
    minDay: 2,
  },
  goblin: {
    name: 'Goblin',
    hp: 30,
    atk: 8,
    speed: 4,
    exp: 15,
    coins: 8,
    color: 0x2ed573,
    size: 0.9,
    minDay: 2,
  },
  wolf: {
    name: 'Wolf',
    hp: 40,
    atk: 12,
    speed: 6,
    exp: 20,
    coins: 12,
    color: 0x636e72,
    size: 1.0,
    minDay: 5,
  },
  skeleton: {
    name: 'Skeleton',
    hp: 50,
    atk: 10,
    speed: 3,
    exp: 25,
    coins: 15,
    color: 0xdfe6e9,
    size: 1.1,
    minDay: 5,
  },
  orc: {
    name: 'Orc',
    hp: 100,
    atk: 20,
    speed: 2.5,
    exp: 40,
    coins: 25,
    color: 0x6c5ce7,
    size: 1.4,
    minDay: 10,
  },
  mage: {
    name: 'Mage',
    hp: 60,
    atk: 25,
    speed: 3,
    exp: 50,
    coins: 30,
    color: 0x9b59b6,
    size: 1.0,
    minDay: 10,
  },
};

// Monster spawn rules per day
export const SPAWN_RULES = {
  2: { count: [3, 5], types: ['slime', 'goblin'] },
  5: { count: [5, 10], types: ['slime', 'goblin', 'wolf', 'skeleton'] },
  10: { count: [10, 15], types: ['slime', 'goblin', 'wolf', 'skeleton', 'orc', 'mage'] },
  15: { count: [15, 20], types: ['goblin', 'wolf', 'skeleton', 'orc', 'mage'] },
};

// Artifact definitions
export const ARTIFACTS = {
  crystal: {
    name: 'Shining Crystal',
    effect: 'exp',
    value: 50,
    color: 0x74b9ff,
    emissive: 0x0984e3,
  },
  chest: {
    name: 'Ancient Chest',
    effect: 'random',
    color: 0xfdcb6e,
    emissive: 0xe17055,
  },
  fountain: {
    name: 'Healing Fountain',
    effect: 'heal',
    value: 30,
    color: 0x55efc4,
    emissive: 0x00b894,
  },
  altar: {
    name: 'Mystic Altar',
    effect: 'levelup',
    color: 0xa29bfe,
    emissive: 0x6c5ce7,
  },
  grass: {
    name: 'Tall Grass',
    effect: 'exp',
    value: 10,
    color: 0x00b894,
    emissive: 0x00cec9,
  },
};

// Item definitions
export const ITEMS = {
  // Weapons
  sword: { name: 'Sword', type: 'weapon', stats: { atk: 10 } },
  bow: { name: 'Bow', type: 'weapon', stats: { atk: 8 }, ranged: true },
  staff: { name: 'Staff', type: 'weapon', stats: { atk: 6 }, aoe: true },
  dagger: { name: 'Dagger', type: 'weapon', stats: { atk: 5, crit: 0.1 } },

  // Armor
  leather: { name: 'Leather Armor', type: 'armor', stats: { def: 5 } },
  iron: { name: 'Iron Armor', type: 'armor', stats: { def: 10, spd: -0.1 } },
  robe: { name: 'Robe', type: 'armor', stats: { def: 3 }, cooldownReduction: 0.1 },

  // Accessories
  ring: { name: 'Ring', type: 'accessory', stats: { crit: 0.05 } },
  necklace: { name: 'Necklace', type: 'accessory', stats: { maxHp: 20 } },
  boots: { name: 'Boots', type: 'accessory', stats: { spd: 0.2 } },
};

// Item rarities
export const RARITIES = {
  common: { name: 'Common', color: '#ffffff', multiplier: 1.0 },
  uncommon: { name: 'Uncommon', color: '#2ed573', multiplier: 1.3 },
  rare: { name: 'Rare', color: '#3498db', multiplier: 1.6 },
  epic: { name: 'Epic', color: '#9b59b6', multiplier: 2.0 },
  legendary: { name: 'Legendary', color: '#f1c40f', multiplier: 2.5 },
};

// Skills
export const SKILLS = {
  spinAttack: {
    name: 'Spin Attack',
    key: 'q',
    cooldown: 5,
    damage: 1.5, // multiplier
    radius: 3,
    type: 'active',
  },
  dash: {
    name: 'Dash',
    key: 'shift',
    cooldown: 8,
    distance: 5,
    invincible: true,
    type: 'active',
  },
  heal: {
    name: 'Healing',
    key: 'r',
    cooldown: 15,
    healPercent: 0.3,
    type: 'active',
  },
  fireball: {
    name: 'Fireball',
    key: 'f',
    cooldown: 6,
    damage: 2.0,
    radius: 2,
    range: 10,
    type: 'active',
  },
};

// Passive skills
export const PASSIVES = {
  lifesteal: { name: 'Lifesteal', effect: 'heal on hit', value: 0.05 },
  thorns: { name: 'Thorns', effect: 'reflect damage', value: 0.1 },
  expBoost: { name: 'EXP Boost', effect: 'exp multiplier', value: 0.2 },
  luck: { name: 'Luck', effect: 'drop rate', value: 0.15 },
};

// Level up choices categories
export const CHOICE_TYPES = {
  stat: 'stat',
  item: 'item',
  upgrade: 'upgrade',
  skill: 'skill',
};

// Colors
export const COLORS = {
  ground: 0x27ae60,
  groundDark: 0x229954,
  player: 0x3498db,
  playerLight: 0x5dade2,
  attack: 0xff6b6b,
  healing: 0x2ed573,
  exp: 0xffd700,
};
