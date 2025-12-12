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

// Auto Skills - Automatically triggered skills
export const AUTO_SKILLS = {
  orbital: {
    id: 'orbital',
    name: 'Orbital',
    desc: 'Rotating orbs that damage enemies on contact',
    icon: '🔮',
    category: 'Auto Skill',
    damage: 8,
    count: 2, // number of orbs
    radius: 2.5, // orbit radius
    speed: 2, // rotation speed
    color: 0x74b9ff,
  },
  fireball: {
    id: 'fireball',
    name: 'Fireball',
    desc: 'Shoots fireballs at nearest enemy every 3s',
    icon: '🔥',
    category: 'Auto Skill',
    damage: 15,
    cooldown: 3,
    speed: 12,
    color: 0xff6b6b,
  },
  lightning: {
    id: 'lightning',
    name: 'Lightning',
    desc: 'Strikes random enemy with chain lightning',
    icon: '⚡',
    category: 'Auto Skill',
    damage: 20,
    cooldown: 4,
    chainCount: 3, // hits up to 3 enemies
    chainRange: 5,
    color: 0xf1c40f,
  },
  poisonAura: {
    id: 'poisonAura',
    name: 'Poison Aura',
    desc: 'Poisons nearby enemies over time',
    icon: '☠️',
    category: 'Auto Skill',
    damage: 3, // per tick
    tickRate: 0.5, // seconds
    radius: 4,
    color: 0x2ed573,
  },
  frostNova: {
    id: 'frostNova',
    name: 'Frost Nova',
    desc: 'Freezes and damages nearby enemies',
    icon: '❄️',
    category: 'Auto Skill',
    damage: 12,
    cooldown: 5,
    radius: 5,
    slowAmount: 0.5, // 50% slow
    slowDuration: 2,
    color: 0x74b9ff,
  },
  spinningBlades: {
    id: 'spinningBlades',
    name: 'Spinning Blades',
    desc: 'Blades orbit around you dealing damage',
    icon: '🗡️',
    category: 'Auto Skill',
    damage: 6,
    count: 3,
    radius: 3.5,
    speed: 3,
    color: 0xbdc3c7,
  },
};

// Passive Skills - Always active effects
export const PASSIVE_SKILLS = {
  lifesteal: {
    id: 'lifesteal',
    name: 'Lifesteal',
    desc: 'Heal 5% of damage dealt',
    icon: '🧛',
    category: 'Passive',
    value: 0.05,
  },
  thorns: {
    id: 'thorns',
    name: 'Thorns',
    desc: 'Reflect 20% damage to attackers',
    icon: '🌵',
    category: 'Passive',
    value: 0.2,
  },
  magnet: {
    id: 'magnet',
    name: 'Magnet',
    desc: 'Increase pickup range by 50%',
    icon: '🧲',
    category: 'Passive',
    value: 1.5, // multiplier
  },
  regeneration: {
    id: 'regeneration',
    name: 'Regeneration',
    desc: 'Recover 1 HP per second',
    icon: '💗',
    category: 'Passive',
    value: 1,
  },
  luck: {
    id: 'luck',
    name: 'Luck',
    desc: 'Increase critical rate by 10%',
    icon: '🍀',
    category: 'Passive',
    value: 0.1,
  },
  berserk: {
    id: 'berserk',
    name: 'Berserk',
    desc: 'ATK +30% when HP below 50%',
    icon: '😡',
    category: 'Passive',
    threshold: 0.5,
    value: 0.3,
  },
};

// Skill Upgrades - Enhance existing skills
export const SKILL_UPGRADES = {
  spinMaster: {
    id: 'spinMaster',
    name: 'Spin Master',
    desc: 'Spin Attack: Range +1, Damage +20%',
    icon: '🌀',
    category: 'Upgrade',
    target: 'spinAttack',
    effects: { radiusBonus: 1, damageBonus: 0.2 },
  },
  dashMaster: {
    id: 'dashMaster',
    name: 'Dash Master',
    desc: 'Dash: Cooldown -2s, Distance +2',
    icon: '💨',
    category: 'Upgrade',
    target: 'dash',
    effects: { cooldownReduction: 2, distanceBonus: 2 },
  },
  multiStrike: {
    id: 'multiStrike',
    name: 'Multi Strike',
    desc: 'Basic attacks hit twice',
    icon: '⚔️',
    category: 'Upgrade',
    effects: { attackCount: 2 },
  },
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

// Permanent Upgrades (purchased in lobby with coins)
export const PERMANENT_UPGRADES = {
  // Basic Stats
  hp: {
    id: 'hp',
    name: 'Vitality',
    desc: '+10 Max HP per level',
    icon: '❤️',
    category: 'Stats',
    maxLevel: 20,
    baseCost: 50,
    costMultiplier: 1.5,
    effect: { hp: 10 },
  },
  atk: {
    id: 'atk',
    name: 'Strength',
    desc: '+2 Attack per level',
    icon: '⚔️',
    category: 'Stats',
    maxLevel: 20,
    baseCost: 50,
    costMultiplier: 1.5,
    effect: { atk: 2 },
  },
  def: {
    id: 'def',
    name: 'Armor',
    desc: '+1 Defense per level',
    icon: '🛡️',
    category: 'Stats',
    maxLevel: 20,
    baseCost: 50,
    costMultiplier: 1.5,
    effect: { def: 1 },
  },
  speed: {
    id: 'speed',
    name: 'Swiftness',
    desc: '+5% Movement Speed per level',
    icon: '👟',
    category: 'Stats',
    maxLevel: 10,
    baseCost: 80,
    costMultiplier: 1.6,
    effect: { spd: 0.05 },
  },
  crit: {
    id: 'crit',
    name: 'Precision',
    desc: '+2% Critical Rate per level',
    icon: '🎯',
    category: 'Stats',
    maxLevel: 15,
    baseCost: 100,
    costMultiplier: 1.7,
    effect: { crit: 0.02 },
  },

  // Special Abilities
  startingHealing: {
    id: 'startingHealing',
    name: 'First Aid Kit',
    desc: 'Start with +20 HP healed',
    icon: '🩹',
    category: 'Starting Bonus',
    maxLevel: 5,
    baseCost: 150,
    costMultiplier: 2.0,
    effect: { startHeal: 20 },
  },
  coinMagnet: {
    id: 'coinMagnet',
    name: 'Coin Magnet',
    desc: '+10% Coin drop rate per level',
    icon: '🧲',
    category: 'Economy',
    maxLevel: 10,
    baseCost: 100,
    costMultiplier: 1.8,
    effect: { coinBonus: 0.1 },
  },
  expBoost: {
    id: 'expBoost',
    name: 'Quick Learner',
    desc: '+5% EXP gain per level',
    icon: '📚',
    category: 'Growth',
    maxLevel: 10,
    baseCost: 120,
    costMultiplier: 1.8,
    effect: { expBonus: 0.05 },
  },
  revival: {
    id: 'revival',
    name: 'Second Chance',
    desc: 'Revive once per run with 30% HP',
    icon: '👼',
    category: 'Survival',
    maxLevel: 1,
    baseCost: 1000,
    costMultiplier: 1,
    effect: { revival: true },
  },
  startingDamage: {
    id: 'startingDamage',
    name: 'Warrior Training',
    desc: '+5% damage for first 3 days',
    icon: '💪',
    category: 'Starting Bonus',
    maxLevel: 5,
    baseCost: 200,
    costMultiplier: 1.8,
    effect: { earlyDamage: 0.05 },
  },

  // Unlock Abilities
  dashCooldown: {
    id: 'dashCooldown',
    name: 'Dash Mastery',
    desc: '-0.5s Dash cooldown per level',
    icon: '💨',
    category: 'Skills',
    maxLevel: 6,
    baseCost: 150,
    costMultiplier: 1.6,
    effect: { dashCooldown: -0.5 },
  },
  spinRadius: {
    id: 'spinRadius',
    name: 'Whirlwind',
    desc: '+0.3 Spin Attack radius per level',
    icon: '🌀',
    category: 'Skills',
    maxLevel: 5,
    baseCost: 150,
    costMultiplier: 1.6,
    effect: { spinRadius: 0.3 },
  },
  attackSpeed: {
    id: 'attackSpeed',
    name: 'Rapid Strikes',
    desc: '-5% Attack cooldown per level',
    icon: '⚡',
    category: 'Combat',
    maxLevel: 8,
    baseCost: 120,
    costMultiplier: 1.7,
    effect: { attackSpeed: 0.05 },
  },

  // Fun/Special
  explosiveKills: {
    id: 'explosiveKills',
    name: 'Explosive Finale',
    desc: '10% chance enemies explode on death',
    icon: '💥',
    category: 'Special',
    maxLevel: 5,
    baseCost: 300,
    costMultiplier: 2.0,
    effect: { explosionChance: 0.1 },
  },
  treasureHunter: {
    id: 'treasureHunter',
    name: 'Treasure Hunter',
    desc: '+15% chance for rare drops',
    icon: '💎',
    category: 'Economy',
    maxLevel: 5,
    baseCost: 250,
    costMultiplier: 1.9,
    effect: { rareDropBonus: 0.15 },
  },
  vampiricStart: {
    id: 'vampiricStart',
    name: 'Vampiric Aura',
    desc: 'Start with 2% lifesteal',
    icon: '🧛',
    category: 'Starting Bonus',
    maxLevel: 3,
    baseCost: 400,
    costMultiplier: 2.5,
    effect: { startLifesteal: 0.02 },
  },
  timeWarp: {
    id: 'timeWarp',
    name: 'Time Warp',
    desc: '-3 seconds per day duration',
    icon: '⏱️',
    category: 'Survival',
    maxLevel: 5,
    baseCost: 200,
    costMultiplier: 1.8,
    effect: { dayTimeReduction: 3 },
  },
  monsterMagnet: {
    id: 'monsterMagnet',
    name: 'Monster Magnet',
    desc: '+20% monster spawn rate (more EXP!)',
    icon: '👹',
    category: 'Growth',
    maxLevel: 5,
    baseCost: 150,
    costMultiplier: 1.7,
    effect: { spawnRateBonus: 0.2 },
  },
};

// Upgrade Categories for UI organization
export const UPGRADE_CATEGORIES = ['Stats', 'Combat', 'Skills', 'Starting Bonus', 'Economy', 'Growth', 'Survival', 'Special'];
