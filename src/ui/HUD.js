import { useGameStore } from '../store/gameStore.js';
import { audioManager } from '../game/AudioManager.js';
import { SKILLS } from '../utils/constants.js';

export class UIManager {
  constructor(game) {
    this.game = game;
    this.levelUpShown = false; // Flag to prevent re-rendering
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Start game button
    document.getElementById('start-game-btn').addEventListener('click', () => {
      audioManager.playSfx('sfx_ui_click');
      this.game.startNewRun();
      this.showGameUI();
    });

    // Restart button
    document.getElementById('restart-btn').addEventListener('click', () => {
      audioManager.playSfx('sfx_ui_click');
      this.hideGameOver();
      this.showLobby();
    });

    // Upgrades button
    document.getElementById('upgrades-btn').addEventListener('click', () => {
      audioManager.playSfx('sfx_ui_click');
      this.showUpgradesModal();
    });
  }

  update() {
    const state = useGameStore.getState();

    if (state.gameState === 'lobby') {
      this.updateLobby(state);
    } else if (state.gameState === 'playing' || state.gameState === 'levelup') {
      this.updateHUD(state);
      this.updateSkillsHUD(state);
    }

    if (state.gameState === 'levelup' && state.showLevelUp && !this.levelUpShown) {
      this.showLevelUp(state);
      this.levelUpShown = true;
    }

    // Reset flag when not in levelup state
    if (state.gameState !== 'levelup') {
      this.levelUpShown = false;
    }

    if (state.gameState === 'gameover') {
      this.showGameOver(state);
    }
  }

  updateLobby(state) {
    document.getElementById('lobby-coins').textContent = state.account.coins;
    document.getElementById('lobby-level').textContent = state.account.level;
  }

  updateHUD(state) {
    const { run } = state;

    // HP
    const hpPercent = (run.stats.hp / run.stats.maxHp) * 100;
    document.getElementById('hp-fill').style.width = `${hpPercent}%`;
    document.getElementById('hp-text').textContent =
      `${Math.ceil(run.stats.hp)}/${run.stats.maxHp}`;

    // Level and EXP
    document.getElementById('level-text').textContent = run.level;
    const expPercent = (run.exp / run.expToNext) * 100;
    document.getElementById('exp-fill').style.width = `${expPercent}%`;

    // Day and Timer
    document.getElementById('day-text').textContent = run.day;
    const minutes = Math.floor(run.timer / 60);
    const seconds = Math.floor(run.timer % 60);
    document.getElementById('timer-text').textContent =
      `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Stats
    document.getElementById('atk-text').textContent = Math.floor(run.stats.atk);
    document.getElementById('def-text').textContent = Math.floor(run.stats.def);
    document.getElementById('coins-text').textContent = run.coinsEarned;
  }

  updateSkillsHUD(state) {
    const { run } = state;
    const cooldowns = run.skillCooldowns;

    // Q skill (spin attack)
    const skillQ = document.getElementById('skill-q');
    const spinCooldown = cooldowns.spinAttack || 0;
    if (spinCooldown > 0) {
      skillQ.classList.remove('ready');
      skillQ.querySelector('.cooldown').textContent = spinCooldown.toFixed(1) + 's';
    } else {
      skillQ.classList.add('ready');
      skillQ.querySelector('.cooldown').textContent = '';
    }

    // Shift skill (dash)
    const skillShift = document.getElementById('skill-shift');
    const dashCooldown = cooldowns.dash || 0;
    if (dashCooldown > 0) {
      skillShift.classList.remove('ready');
      skillShift.querySelector('.cooldown').textContent = dashCooldown.toFixed(1) + 's';
    } else {
      skillShift.classList.add('ready');
      skillShift.querySelector('.cooldown').textContent = '';
    }
  }

  showLevelUp(state) {
    const container = document.getElementById('choices-container');
    container.innerHTML = '';

    const levelUpUI = document.getElementById('level-up-ui');
    levelUpUI.classList.add('active');

    state.levelUpChoices.forEach((choice, index) => {
      const card = document.createElement('div');
      card.className = 'choice-card';

      // Get category class for colored badge
      const categoryClass = choice.type || 'stat';

      card.innerHTML = `
        <div class="choice-icon-wrapper">
          <div class="choice-icon-frame">
            <span class="choice-icon">${this.getChoiceIcon(choice)}</span>
          </div>
        </div>
        <div class="choice-info">
          <div class="choice-name">${choice.name}</div>
          <div class="choice-category ${categoryClass}">${choice.category || choice.type}</div>
          <div class="choice-desc">${this.getChoiceDesc(choice)}</div>
        </div>
      `;

      card.addEventListener('click', (e) => {
        e.stopPropagation();
        // Add selection animation
        card.style.transform = 'scale(1.05) translateY(-10px)';
        card.style.borderColor = '#2ed573';
        card.style.boxShadow = '0 10px 0 #229954, 0 15px 30px rgba(46, 213, 115, 0.4)';

        setTimeout(() => {
          useGameStore.getState().selectLevelUpChoice(choice);
          levelUpUI.classList.remove('active');
          this.levelUpShown = false;
        }, 200);
      });

      card.addEventListener('mouseenter', () => {
        audioManager.playSfx('sfx_ui_hover', { volume: 0.3 });
      });

      container.appendChild(card);
    });
  }

  getChoiceIcon(choice) {
    // New skills already have emoji icons in their data
    if (choice.icon && choice.icon.length <= 2) {
      return choice.icon;
    }

    // Fallback for old-style icon names
    const icons = {
      'ATK': '⚔️',
      'DEF': '🛡️',
      'HP': '❤️',
      'SPD': '⚡',
      'CRIT': '💥',
      'Sword': '🗡️',
      'Shield': '🛡️',
      'Ring': '💍',
      'Boots': '👢',
      'Heal': '💚',
      'Spin': '🌀',
      'Dash': '💨',
    };
    return icons[choice.icon] || '✨';
  }

  getChoiceDesc(choice) {
    // Use the desc from choice data if available
    if (choice.desc) {
      return `<span class="highlight">${choice.desc}</span>`;
    }

    if (choice.type === 'stat' || choice.type === 'item') {
      const effects = [];
      for (const [key, value] of Object.entries(choice.effect)) {
        const sign = value > 0 ? '+' : '';
        effects.push(`<span class="highlight">${key.toUpperCase()} ${sign}${value}</span>`);
      }
      return effects.join(', ');
    }
    return '<span class="highlight">Skill upgrade</span>';
  }

  showGameOver(state) {
    const gameOverUI = document.getElementById('game-over-ui');
    gameOverUI.classList.add('active');

    document.getElementById('result-day').textContent = state.run.day;
    document.getElementById('result-level').textContent = state.run.level;
    document.getElementById('result-kills').textContent = state.run.kills;
    document.getElementById('result-coins').textContent = state.run.coinsEarned;
  }

  hideGameOver() {
    const gameOverUI = document.getElementById('game-over-ui');
    gameOverUI.classList.remove('active');
  }

  showLobby() {
    useGameStore.getState().returnToLobby();
    document.getElementById('lobby-ui').classList.remove('hidden');
    document.getElementById('hud').style.display = 'none';
    document.getElementById('skills-hud').style.display = 'none';
  }

  showGameUI() {
    document.getElementById('lobby-ui').classList.add('hidden');
    document.getElementById('hud').style.display = 'flex';
    document.getElementById('skills-hud').style.display = 'flex';
  }

  showUpgradesModal() {
    const state = useGameStore.getState();
    const account = state.account;

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'upgrades-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 300;
    `;

    modal.innerHTML = `
      <h2 style="color: #ffd700; font-size: 32px; margin-bottom: 30px;">Upgrades</h2>
      <div style="color: white; font-size: 20px; margin-bottom: 20px;">
        Coins: ${account.coins}
      </div>
      <div style="display: flex; gap: 20px; margin-bottom: 30px;">
        <div class="upgrade-card" data-type="hp" style="
          background: rgba(255,255,255,0.1);
          padding: 20px;
          border-radius: 10px;
          border: 2px solid #555;
          cursor: pointer;
          text-align: center;
          color: white;
          min-width: 150px;
        ">
          <div style="font-size: 24px;">❤️</div>
          <div style="font-size: 18px; margin: 10px 0;">HP Boost</div>
          <div style="color: #aaa;">Lv.${account.upgrades.hp}</div>
          <div style="color: #ffd700; margin-top: 10px;">
            Cost: ${(account.upgrades.hp + 1) * 100}
          </div>
          <div style="color: #7bed9f; font-size: 14px;">+10 Max HP</div>
        </div>
        <div class="upgrade-card" data-type="atk" style="
          background: rgba(255,255,255,0.1);
          padding: 20px;
          border-radius: 10px;
          border: 2px solid #555;
          cursor: pointer;
          text-align: center;
          color: white;
          min-width: 150px;
        ">
          <div style="font-size: 24px;">⚔️</div>
          <div style="font-size: 18px; margin: 10px 0;">ATK Boost</div>
          <div style="color: #aaa;">Lv.${account.upgrades.atk}</div>
          <div style="color: #ffd700; margin-top: 10px;">
            Cost: ${(account.upgrades.atk + 1) * 100}
          </div>
          <div style="color: #7bed9f; font-size: 14px;">+2 ATK</div>
        </div>
        <div class="upgrade-card" data-type="def" style="
          background: rgba(255,255,255,0.1);
          padding: 20px;
          border-radius: 10px;
          border: 2px solid #555;
          cursor: pointer;
          text-align: center;
          color: white;
          min-width: 150px;
        ">
          <div style="font-size: 24px;">🛡️</div>
          <div style="font-size: 18px; margin: 10px 0;">DEF Boost</div>
          <div style="color: #aaa;">Lv.${account.upgrades.def}</div>
          <div style="color: #ffd700; margin-top: 10px;">
            Cost: ${(account.upgrades.def + 1) * 100}
          </div>
          <div style="color: #7bed9f; font-size: 14px;">+1 DEF</div>
        </div>
      </div>
      <button id="close-upgrades" style="
        padding: 15px 40px;
        font-size: 18px;
        background: #ff4757;
        border: none;
        color: white;
        border-radius: 10px;
        cursor: pointer;
      ">Close</button>
    `;

    document.body.appendChild(modal);

    // Event listeners
    modal.querySelectorAll('.upgrade-card').forEach(card => {
      card.addEventListener('click', () => {
        const type = card.dataset.type;
        const success = useGameStore.getState().purchaseUpgrade(type);
        if (success) {
          audioManager.playSfx('sfx_ui_click');
          // Refresh modal
          document.body.removeChild(modal);
          this.showUpgradesModal();
        } else {
          audioManager.playSfx('sfx_ui_click', { volume: 0.5, pitch: 0.7 });
          card.style.borderColor = '#ff4757';
          setTimeout(() => {
            card.style.borderColor = '#555';
          }, 200);
        }
      });

      card.addEventListener('mouseover', () => {
        audioManager.playSfx('sfx_ui_hover', { volume: 0.3 });
        card.style.borderColor = '#ffd700';
      });
      card.addEventListener('mouseout', () => {
        card.style.borderColor = '#555';
      });
    });

    document.getElementById('close-upgrades').addEventListener('click', () => {
      audioManager.playSfx('sfx_ui_click');
      document.body.removeChild(modal);
    });
  }
}
