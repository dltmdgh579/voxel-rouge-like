import { create } from 'zustand';
import { audioManager } from '../game/AudioManager.js';
import { BASE_STATS, LEVEL_EXP, AUTO_SKILLS, PASSIVE_SKILLS, SKILL_UPGRADES, PERMANENT_UPGRADES } from '../utils/constants.js';

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
    permanentStats: { hp: 0, atk: 0, def: 0, spd: 0, crit: 0 },
    upgrades: {}, // Now stores all upgrade levels by ID
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
  isPaused: false,

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
    autoSkills: [], // Active auto skills (e.g., ['orbital', 'fireball'])
    passives: [], // Active passive skills (e.g., ['lifesteal', 'thorns'])
    skillUpgrades: {}, // Skill upgrade levels (e.g., { spinMaster: true })
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
    // Play game start sound and BGM
    audioManager.playSfx('sfx_game_start');
    audioManager.playBgm('bgm_gameplay_early', 1);

    const { account } = get();
    const baseStats = { ...BASE_STATS };
    const upgrades = account.upgrades || {};

    // Apply all permanent upgrades
    Object.keys(upgrades).forEach(id => {
      const level = upgrades[id] || 0;
      const upgrade = PERMANENT_UPGRADES[id];
      if (!upgrade || level === 0) return;

      const effect = upgrade.effect;
      if (effect.hp) {
        baseStats.hp += effect.hp * level;
        baseStats.maxHp += effect.hp * level;
      }
      if (effect.atk) baseStats.atk += effect.atk * level;
      if (effect.def) baseStats.def += effect.def * level;
      if (effect.spd) baseStats.spd += effect.spd * level;
      if (effect.crit) baseStats.crit += effect.crit * level;
    });

    // Apply permanent stats (legacy support)
    baseStats.hp += account.permanentStats.hp || 0;
    baseStats.maxHp += account.permanentStats.hp || 0;
    baseStats.atk += account.permanentStats.atk || 0;
    baseStats.def += account.permanentStats.def || 0;
    baseStats.spd += account.permanentStats.spd || 0;
    baseStats.crit += account.permanentStats.crit || 0;

    // Calculate bonus values from upgrades
    const coinBonus = (upgrades.coinMagnet || 0) * 0.1;
    const expBonus = (upgrades.expBoost || 0) * 0.05;
    const hasRevival = (upgrades.revival || 0) >= 1;
    const startLifesteal = (upgrades.vampiricStart || 0) * 0.02;
    const explosionChance = (upgrades.explosiveKills || 0) * 0.1;

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
        autoSkills: [],
        passives: startLifesteal > 0 ? ['lifesteal'] : [], // Start with lifesteal if upgraded
        skillUpgrades: {},
        kills: 0,
        coinsEarned: 0,
        // Bonus stats from upgrades
        coinBonus,
        expBonus,
        hasRevival,
        usedRevival: false,
        explosionChance,
        startLifesteal,
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
    // Play lobby BGM
    audioManager.playBgm('bgm_lobby', 1);
    set({ gameState: 'lobby', isPaused: false });
  },

  // Pause/Resume
  pauseGame: () => {
    const { gameState } = get();
    if (gameState === 'playing') {
      set({ gameState: 'paused', isPaused: true });
    }
  },

  resumeGame: () => {
    const { gameState } = get();
    if (gameState === 'paused') {
      set({ gameState: 'playing', isPaused: false });
    }
  },

  togglePause: () => {
    const { gameState } = get();
    if (gameState === 'playing') {
      set({ gameState: 'paused', isPaused: true });
    } else if (gameState === 'paused') {
      set({ gameState: 'playing', isPaused: false });
    }
  },

  // Day system
  updateTimer: (delta) => {
    const { run, gameState, account } = get();
    if (gameState !== 'playing') return;

    const newTimer = run.timer - delta;

    if (newTimer <= 0) {
      // Calculate day duration based on timeWarp upgrade
      const timeWarpLevel = account.upgrades?.timeWarp || 0;
      const dayDuration = Math.max(30, 60 - (timeWarpLevel * 3)); // Min 30 seconds

      // Next day
      set({
        run: {
          ...run,
          day: run.day + 1,
          timer: dayDuration,
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
      // Play death sound
      audioManager.playSfx('sfx_player_death');
      // Play game over BGM
      audioManager.playBgm('bgm_gameover', 1);
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
      // Play level up sound
      audioManager.playSfx('sfx_levelup');
      get().showLevelUpChoices();
    }
  },

  showLevelUpChoices: () => {
    const { run } = get();

    // Build available choices based on what player doesn't have
    const availableChoices = [];

    // Add auto skills that player doesn't have
    Object.values(AUTO_SKILLS).forEach(skill => {
      if (!run.autoSkills.includes(skill.id)) {
        availableChoices.push({
          type: 'autoSkill',
          id: skill.id,
          category: skill.category,
          icon: skill.icon,
          name: skill.name,
          desc: skill.desc,
        });
      }
    });

    // Add passive skills that player doesn't have
    Object.values(PASSIVE_SKILLS).forEach(skill => {
      if (!run.passives.includes(skill.id)) {
        availableChoices.push({
          type: 'passive',
          id: skill.id,
          category: skill.category,
          icon: skill.icon,
          name: skill.name,
          desc: skill.desc,
        });
      }
    });

    // Add skill upgrades that player doesn't have
    Object.values(SKILL_UPGRADES).forEach(upgrade => {
      if (!run.skillUpgrades[upgrade.id]) {
        availableChoices.push({
          type: 'upgrade',
          id: upgrade.id,
          category: upgrade.category,
          icon: upgrade.icon,
          name: upgrade.name,
          desc: upgrade.desc,
        });
      }
    });

    // Shuffle and pick 3 unique choices
    const shuffled = [...availableChoices].sort(() => Math.random() - 0.5);
    const choices = shuffled.slice(0, 3);

    // If we don't have enough choices, add some stat boosts
    while (choices.length < 3) {
      const statBoosts = [
        { type: 'stat', category: 'Stat Boost', icon: '⚔️', name: 'Power Up', desc: 'ATK +5', effect: { atk: 5 } },
        { type: 'stat', category: 'Stat Boost', icon: '🛡️', name: 'Toughness', desc: 'DEF +3', effect: { def: 3 } },
        { type: 'stat', category: 'Stat Boost', icon: '❤️', name: 'Vitality', desc: 'Max HP +25', effect: { maxHp: 25 } },
      ];
      choices.push(statBoosts[choices.length % statBoosts.length]);
    }

    set({
      gameState: 'levelup',
      showLevelUp: true,
      levelUpChoices: choices,
    });
  },

  selectLevelUpChoice: (choice) => {
    // Play selection sound
    audioManager.playSfx('sfx_choice_select');

    const { run } = get();

    let newRun = { ...run };

    switch (choice.type) {
      case 'autoSkill':
        // Add new auto skill
        newRun.autoSkills = [...run.autoSkills, choice.id];
        break;

      case 'passive':
        // Add new passive skill
        newRun.passives = [...run.passives, choice.id];
        // Apply immediate effects for some passives
        if (choice.id === 'luck') {
          newRun.stats = { ...run.stats, crit: run.stats.crit + PASSIVE_SKILLS.luck.value };
        }
        break;

      case 'upgrade':
        // Add skill upgrade
        newRun.skillUpgrades = { ...run.skillUpgrades, [choice.id]: true };
        break;

      case 'stat':
        // Apply stat boost
        const newStats = { ...run.stats };
        Object.keys(choice.effect).forEach(key => {
          if (newStats[key] !== undefined) {
            newStats[key] += choice.effect[key];
          }
        });
        if (choice.effect.maxHp) {
          newStats.hp += choice.effect.maxHp;
        }
        newRun.stats = newStats;
        break;
    }

    set({
      gameState: 'playing',
      showLevelUp: false,
      levelUpChoices: [],
      run: newRun,
    });
  },

  // Coins
  addCoins: (amount) => {
    // Play coin sound
    audioManager.playSfx('sfx_coin_collect', { volume: 0.5, pitchVariation: 0.1 });

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
  purchaseUpgrade: (upgradeId) => {
    const { account } = get();
    const upgrade = PERMANENT_UPGRADES[upgradeId];

    if (!upgrade) return false;

    const currentLevel = account.upgrades[upgradeId] || 0;

    // Check max level
    if (currentLevel >= upgrade.maxLevel) return false;

    // Calculate cost
    const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));

    if (account.coins >= cost) {
      const newAccount = {
        ...account,
        coins: account.coins - cost,
        upgrades: {
          ...account.upgrades,
          [upgradeId]: currentLevel + 1,
        },
      };
      saveAccountData(newAccount);
      set({ account: newAccount });
      return true;
    }
    return false;
  },

  // Get upgrade cost for display
  getUpgradeCost: (upgradeId) => {
    const { account } = get();
    const upgrade = PERMANENT_UPGRADES[upgradeId];
    if (!upgrade) return 0;

    const currentLevel = account.upgrades[upgradeId] || 0;
    if (currentLevel >= upgrade.maxLevel) return -1; // Max level reached

    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
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
