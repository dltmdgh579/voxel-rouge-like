import { create } from 'zustand';
import { BASE_STATS, LEVEL_EXP } from '../utils/constants.js';

// Load saved account data from localStorage
const loadAccountData = () => {
  try {
    const saved = localStorage.getItem('voxelSurvivor_account');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load account data:', e);
  }
  return {
    level: 1,
    exp: 0,
    coins: 0,
    totalCoins: 0,
    permanentStats: { hp: 0, atk: 0, def: 0 },
    upgrades: { hp: 0, atk: 0, def: 0 },
    purchases: [],
    highestDay: 0,
  };
};

// Save account data to localStorage
const saveAccountData = (account) => {
  try {
    localStorage.setItem('voxelSurvivor_account', JSON.stringify(account));
  } catch (e) {
    console.error('Failed to save account data:', e);
  }
};

export const useGameStore = create((set, get) => ({
  // Game state
  gameState: 'lobby', // 'lobby', 'playing', 'paused', 'levelup', 'gameover'

  // Account data (persistent)
  account: loadAccountData(),

  // Run data (temporary, reset each game)
  run: {
    day: 1,
    timer: 30, // Day 1 is 30 seconds
    level: 1,
    exp: 0,
    expToNext: LEVEL_EXP[1] || 100,
    stats: { ...BASE_STATS },
    items: [],
    skills: ['spinAttack', 'dash'],
    skillCooldowns: {},
    kills: 0,
    coinsEarned: 0,
  },

  // Active entities in game
  monsters: [],
  artifacts: [],
  projectiles: [],

  // UI state
  levelUpChoices: [],
  showLevelUp: false,

  // Actions
  startGame: () => {
    const { account } = get();
    const baseStats = { ...BASE_STATS };

    // Apply permanent stats
    baseStats.hp += account.permanentStats.hp;
    baseStats.maxHp += account.permanentStats.hp;
    baseStats.atk += account.permanentStats.atk;
    baseStats.def += account.permanentStats.def;

    // Apply coin upgrades
    baseStats.hp += account.upgrades.hp * 10;
    baseStats.maxHp += account.upgrades.hp * 10;
    baseStats.atk += account.upgrades.atk * 2;
    baseStats.def += account.upgrades.def * 1;

    set({
      gameState: 'playing',
      run: {
        day: 1,
        timer: 30, // Day 1 is 30 seconds
        level: 1,
        exp: 0,
        expToNext: LEVEL_EXP[1] || 100,
        stats: baseStats,
        items: [],
        skills: ['spinAttack', 'dash'],
        skillCooldowns: {},
        kills: 0,
        coinsEarned: 0,
      },
      monsters: [],
      artifacts: [],
      projectiles: [],
      showLevelUp: false,
    });
  },

  endGame: () => {
    const { run, account } = get();

    // Calculate rewards
    const coinsEarned = run.coinsEarned;
    const expEarned = run.day * 10 + run.kills * 5 + run.level * 20;

    // Update account
    const newAccount = {
      ...account,
      coins: account.coins + coinsEarned,
      totalCoins: account.totalCoins + coinsEarned,
      exp: account.exp + expEarned,
      highestDay: Math.max(account.highestDay, run.day),
    };

    // Check for account level up
    const expNeeded = newAccount.level * 100;
    if (newAccount.exp >= expNeeded) {
      newAccount.level += 1;
      newAccount.exp -= expNeeded;
    }

    saveAccountData(newAccount);

    set({
      gameState: 'gameover',
      account: newAccount,
    });
  },

  returnToLobby: () => {
    set({ gameState: 'lobby' });
  },

  // Day system
  updateTimer: (delta) => {
    const { run, gameState } = get();
    if (gameState !== 'playing') return;

    const newTimer = run.timer - delta;

    if (newTimer <= 0) {
      // Next day
      set({
        run: {
          ...run,
          day: run.day + 1,
          timer: 60,
        },
      });
    } else {
      set({
        run: {
          ...run,
          timer: newTimer,
        },
      });
    }
  },

  // Player stats
  takeDamage: (amount) => {
    const { run } = get();
    const damage = Math.max(1, amount - run.stats.def);
    const newHp = Math.max(0, run.stats.hp - damage);

    set({
      run: {
        ...run,
        stats: {
          ...run.stats,
          hp: newHp,
        },
      },
    });

    if (newHp <= 0) {
      get().endGame();
    }

    return damage;
  },

  heal: (amount) => {
    const { run } = get();
    const newHp = Math.min(run.stats.maxHp, run.stats.hp + amount);

    set({
      run: {
        ...run,
        stats: {
          ...run.stats,
          hp: newHp,
        },
      },
    });
  },

  // Experience and leveling
  gainExp: (amount) => {
    const { run, gameState } = get();
    if (gameState !== 'playing') return;

    let newExp = run.exp + amount;
    let newLevel = run.level;
    let newExpToNext = run.expToNext;
    let shouldLevelUp = false;

    while (newExp >= newExpToNext && newLevel < 20) {
      newExp -= newExpToNext;
      newLevel += 1;
      newExpToNext = LEVEL_EXP[newLevel] || newLevel * 100;
      shouldLevelUp = true;
    }

    set({
      run: {
        ...run,
        exp: newExp,
        level: newLevel,
        expToNext: newExpToNext,
      },
    });

    if (shouldLevelUp) {
      get().showLevelUpChoices();
    }
  },

  showLevelUpChoices: () => {
    const { run } = get();

    // Generate 3 random choices
    const choices = [];

    // All possible choices with categories
    const allOptions = [
      // Stats
      { type: 'stat', category: 'Stat Boost', icon: 'ATK', name: 'Power Strike', desc: 'ATK +5', effect: { atk: 5 } },
      { type: 'stat', category: 'Stat Boost', icon: 'DEF', name: 'Iron Skin', desc: 'DEF +3', effect: { def: 3 } },
      { type: 'stat', category: 'Stat Boost', icon: 'HP', name: 'Vitality', desc: 'Max HP +20', effect: { maxHp: 20 } },
      { type: 'stat', category: 'Stat Boost', icon: 'SPD', name: 'Swift Foot', desc: 'Speed +10%', effect: { spd: 0.1 } },
      { type: 'stat', category: 'Stat Boost', icon: 'CRIT', name: 'Precision', desc: 'Crit Rate +5%', effect: { crit: 0.05 } },
      // Items
      { type: 'item', category: 'Equipment', icon: 'Sword', name: 'Sharp Blade', desc: 'ATK +10', effect: { atk: 10 } },
      { type: 'item', category: 'Equipment', icon: 'Shield', name: 'Steel Shield', desc: 'DEF +8', effect: { def: 8 } },
      { type: 'item', category: 'Equipment', icon: 'Ring', name: 'Crit Ring', desc: 'Crit Rate +8%', effect: { crit: 0.08 } },
      { type: 'item', category: 'Equipment', icon: 'Boots', name: 'Wind Boots', desc: 'Speed +15%', effect: { spd: 0.15 } },
      // Skills
      { type: 'skill', category: 'Skill', icon: 'Heal', name: 'Recovery', desc: 'Heal +20% boost', effect: 'healBoost' },
      { type: 'skill', category: 'Skill', icon: 'Spin', name: 'Whirlwind', desc: 'Spin Range +1', effect: 'spinRange' },
      { type: 'skill', category: 'Skill', icon: 'Dash', name: 'Quick Step', desc: 'Dash CD -1s', effect: 'dashCooldown' },
    ];

    // Shuffle and pick 3 unique choices
    const shuffled = [...allOptions].sort(() => Math.random() - 0.5);
    choices.push(shuffled[0], shuffled[1], shuffled[2]);

    set({
      gameState: 'levelup',
      showLevelUp: true,
      levelUpChoices: choices,
    });
  },

  selectLevelUpChoice: (choice) => {
    const { run } = get();

    let newStats = { ...run.stats };

    if (choice.type === 'stat' || choice.type === 'item') {
      Object.keys(choice.effect).forEach(key => {
        if (newStats[key] !== undefined) {
          newStats[key] += choice.effect[key];
        }
      });

      // If maxHp increased, also increase current hp
      if (choice.effect.maxHp) {
        newStats.hp += choice.effect.maxHp;
      }
    }

    set({
      gameState: 'playing',
      showLevelUp: false,
      levelUpChoices: [],
      run: {
        ...run,
        stats: newStats,
      },
    });
  },

  // Coins
  addCoins: (amount) => {
    const { run } = get();
    set({
      run: {
        ...run,
        coinsEarned: run.coinsEarned + amount,
      },
    });
  },

  // Kills
  addKill: () => {
    const { run } = get();
    set({
      run: {
        ...run,
        kills: run.kills + 1,
      },
    });
  },

  // Monster management
  addMonster: (monster) => {
    const { monsters } = get();
    set({ monsters: [...monsters, monster] });
  },

  removeMonster: (id) => {
    const { monsters } = get();
    set({ monsters: monsters.filter(m => m.id !== id) });
  },

  clearMonsters: () => {
    set({ monsters: [] });
  },

  // Artifact management
  addArtifact: (artifact) => {
    const { artifacts } = get();
    set({ artifacts: [...artifacts, artifact] });
  },

  removeArtifact: (id) => {
    const { artifacts } = get();
    set({ artifacts: artifacts.filter(a => a.id !== id) });
  },

  // Upgrade purchases (lobby)
  purchaseUpgrade: (type) => {
    const { account } = get();
    const cost = (account.upgrades[type] + 1) * 100;

    if (account.coins >= cost) {
      const newAccount = {
        ...account,
        coins: account.coins - cost,
        upgrades: {
          ...account.upgrades,
          [type]: account.upgrades[type] + 1,
        },
      };
      saveAccountData(newAccount);
      set({ account: newAccount });
      return true;
    }
    return false;
  },

  // Skill cooldowns
  setSkillCooldown: (skill, time) => {
    const { run } = get();
    set({
      run: {
        ...run,
        skillCooldowns: {
          ...run.skillCooldowns,
          [skill]: time,
        },
      },
    });
  },

  updateSkillCooldowns: (delta) => {
    const { run } = get();
    const newCooldowns = { ...run.skillCooldowns };

    Object.keys(newCooldowns).forEach(skill => {
      newCooldowns[skill] = Math.max(0, newCooldowns[skill] - delta);
    });

    set({
      run: {
        ...run,
        skillCooldowns: newCooldowns,
      },
    });
  },
}));
