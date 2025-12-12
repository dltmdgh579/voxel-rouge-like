import { useGameStore } from '../store/gameStore.js';
import { audioManager } from '../game/AudioManager.js';
import { SKILLS, AUTO_SKILLS, PASSIVE_SKILLS, SKILL_UPGRADES, PERMANENT_UPGRADES, UPGRADE_CATEGORIES } from '../utils/constants.js';

export class UIManager {
  constructor(game) {
    this.game = game;
    this.levelUpShown = false; // Flag to prevent re-rendering
    this.settingsOpen = false;
    this.setupEventListeners();
    this.setupPauseMenuListeners();
    this.setupSettingsListeners();
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

  setupPauseMenuListeners() {
    // Resume button
    document.getElementById('resume-btn').addEventListener('click', () => {
      audioManager.playSfx('sfx_ui_click');
      useGameStore.getState().resumeGame();
      this.hidePauseMenu();
    });

    // Settings button
    document.getElementById('settings-btn').addEventListener('click', () => {
      audioManager.playSfx('sfx_ui_click');
      this.toggleSettings();
    });

    // Quit button
    document.getElementById('quit-btn').addEventListener('click', () => {
      audioManager.playSfx('sfx_ui_click');
      this.hidePauseMenu();
      this.hideGameOver();
      useGameStore.getState().endGame();
      // Return to lobby after a brief moment
      setTimeout(() => {
        this.showLobby();
      }, 100);
    });
  }

  setupSettingsListeners() {
    // Master volume
    const masterSlider = document.getElementById('master-volume');
    const masterValue = document.getElementById('master-value');
    masterSlider.value = audioManager.masterVolume * 100;
    masterValue.textContent = Math.round(audioManager.masterVolume * 100) + '%';

    masterSlider.addEventListener('input', (e) => {
      const value = e.target.value / 100;
      audioManager.setMasterVolume(value);
      masterValue.textContent = e.target.value + '%';
    });

    // BGM volume
    const bgmSlider = document.getElementById('bgm-volume');
    const bgmValue = document.getElementById('bgm-value');
    bgmSlider.value = audioManager.bgmVolume * 100;
    bgmValue.textContent = Math.round(audioManager.bgmVolume * 100) + '%';

    bgmSlider.addEventListener('input', (e) => {
      const value = e.target.value / 100;
      audioManager.setBgmVolume(value);
      bgmValue.textContent = e.target.value + '%';
    });

    // SFX volume
    const sfxSlider = document.getElementById('sfx-volume');
    const sfxValue = document.getElementById('sfx-value');
    sfxSlider.value = audioManager.sfxVolume * 100;
    sfxValue.textContent = Math.round(audioManager.sfxVolume * 100) + '%';

    sfxSlider.addEventListener('input', (e) => {
      const value = e.target.value / 100;
      audioManager.setSfxVolume(value);
      sfxValue.textContent = e.target.value + '%';
    });

    // Mute all button
    const muteBtn = document.getElementById('mute-all-btn');
    this.updateMuteButton(muteBtn);

    muteBtn.addEventListener('click', () => {
      audioManager.playSfx('sfx_ui_click');
      audioManager.toggleMute();
      this.updateMuteButton(muteBtn);
    });
  }

  updateMuteButton(btn) {
    if (audioManager.isMuted) {
      btn.textContent = 'Unmute';
      btn.classList.add('muted');
    } else {
      btn.textContent = 'Mute';
      btn.classList.remove('muted');
    }
  }

  toggleSettings() {
    this.settingsOpen = !this.settingsOpen;
    const panel = document.getElementById('settings-panel');
    if (this.settingsOpen) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  }

  togglePauseMenu() {
    const pauseMenu = document.getElementById('pause-menu');
    const isPaused = useGameStore.getState().isPaused;

    if (isPaused) {
      this.showPauseMenu();
    } else {
      this.hidePauseMenu();
    }
  }

  showPauseMenu() {
    const state = useGameStore.getState();
    const { run } = state;

    // Update pause menu stats
    document.getElementById('pause-day').textContent = run.day;
    document.getElementById('pause-level').textContent = run.level;
    document.getElementById('pause-hp').textContent = `${Math.ceil(run.stats.hp)}/${run.stats.maxHp}`;
    document.getElementById('pause-kills').textContent = run.kills;
    document.getElementById('pause-coins').textContent = run.coinsEarned;

    // Update skills list
    this.updatePauseSkillsList(run);

    // Show pause menu
    document.getElementById('pause-menu').classList.add('active');

    // Close settings panel if open
    this.settingsOpen = false;
    document.getElementById('settings-panel').classList.remove('active');
  }

  updatePauseSkillsList(run) {
    const container = document.getElementById('pause-skills-list');
    const allSkills = [];

    // Collect auto skills
    run.autoSkills.forEach(id => {
      const skill = AUTO_SKILLS[id];
      if (skill) {
        allSkills.push({ ...skill, type: 'autoSkill' });
      }
    });

    // Collect passive skills
    run.passives.forEach(id => {
      const skill = PASSIVE_SKILLS[id];
      if (skill) {
        allSkills.push({ ...skill, type: 'passive' });
      }
    });

    // Collect upgrades
    Object.keys(run.skillUpgrades).forEach(id => {
      if (run.skillUpgrades[id]) {
        const upgrade = SKILL_UPGRADES[id];
        if (upgrade) {
          allSkills.push({ ...upgrade, type: 'upgrade' });
        }
      }
    });

    if (allSkills.length === 0) {
      container.innerHTML = '<div class="pause-no-skills">No skills acquired yet</div>';
      return;
    }

    container.innerHTML = allSkills.map(skill => `
      <div class="pause-skill-item ${skill.type}" title="${skill.desc}">
        <span class="skill-icon">${skill.icon}</span>
        <span>${skill.name}</span>
      </div>
    `).join('');
  }

  hidePauseMenu() {
    document.getElementById('pause-menu').classList.remove('active');
    this.settingsOpen = false;
    document.getElementById('settings-panel').classList.remove('active');
  }

  // Show skill acquisition notification
  showSkillNotification(choice) {
    const container = document.getElementById('skill-notification');

    const notif = document.createElement('div');
    notif.className = 'skill-notif';
    notif.innerHTML = `
      <div class="skill-notif-icon">${choice.icon || '✨'}</div>
      <div class="skill-notif-content">
        <div class="skill-notif-label">${choice.category || choice.type}</div>
        <div class="skill-notif-name">${choice.name}</div>
        <div class="skill-notif-desc">${choice.desc || ''}</div>
      </div>
    `;

    container.appendChild(notif);

    // Remove after animation
    setTimeout(() => {
      if (notif.parentNode) {
        notif.parentNode.removeChild(notif);
      }
    }, 3000);
  }

  // Update active skills display at bottom left
  updateActiveSkillsDisplay() {
    const state = useGameStore.getState();
    const { run } = state;
    const container = document.getElementById('active-skills-display');

    if (state.gameState !== 'playing' && state.gameState !== 'paused') {
      container.style.display = 'none';
      return;
    }

    const allSkills = [];

    // Collect auto skills
    run.autoSkills.forEach(id => {
      const skill = AUTO_SKILLS[id];
      if (skill) {
        allSkills.push({ ...skill, type: 'autoSkill' });
      }
    });

    // Collect passive skills
    run.passives.forEach(id => {
      const skill = PASSIVE_SKILLS[id];
      if (skill) {
        allSkills.push({ ...skill, type: 'passive' });
      }
    });

    // Collect upgrades
    Object.keys(run.skillUpgrades).forEach(id => {
      if (run.skillUpgrades[id]) {
        const upgrade = SKILL_UPGRADES[id];
        if (upgrade) {
          allSkills.push({ ...upgrade, type: 'upgrade' });
        }
      }
    });

    if (allSkills.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'flex';

    // Group skills into rows of 5
    const rows = [];
    for (let i = 0; i < allSkills.length; i += 5) {
      rows.push(allSkills.slice(i, i + 5));
    }

    container.innerHTML = rows.map(row => `
      <div class="active-skill-row">
        ${row.map(skill => `
          <div class="active-skill-icon ${skill.type}" title="${skill.name}: ${skill.desc}">
            ${skill.icon}
          </div>
        `).join('')}
      </div>
    `).join('');
  }

  update() {
    const state = useGameStore.getState();

    if (state.gameState === 'lobby') {
      this.updateLobby(state);
    } else if (state.gameState === 'playing' || state.gameState === 'levelup' || state.gameState === 'paused') {
      this.updateHUD(state);
      this.updateSkillsHUD(state);
      this.updateActiveSkillsDisplay();
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

          // Show skill notification (only for skills, not stat boosts)
          if (choice.type !== 'stat') {
            this.showSkillNotification(choice);
          }
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
    this.currentUpgradeCategory = 'Stats';
    this.renderUpgradesModal();
  }

  renderUpgradesModal() {
    // Remove existing modal if any
    const existingModal = document.getElementById('upgrades-modal');
    if (existingModal) {
      document.body.removeChild(existingModal);
    }

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
      background: rgba(10, 10, 20, 0.95);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 30px;
      z-index: 300;
      overflow-y: auto;
    `;

    // Get upgrades for current category
    const categoryUpgrades = Object.values(PERMANENT_UPGRADES)
      .filter(u => u.category === this.currentUpgradeCategory);

    modal.innerHTML = `
      <div style="max-width: 1200px; width: 100%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="color: #ffd700; font-size: 36px; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
            🏪 UPGRADE SHOP
          </h2>
          <div style="display: flex; align-items: center; gap: 15px;">
            <div style="color: #ffd700; font-size: 24px; background: rgba(255,215,0,0.15); padding: 10px 20px; border-radius: 10px; border: 2px solid #ffd700;">
              💰 ${account.coins.toLocaleString()}
            </div>
            <button id="close-upgrades" style="
              padding: 12px 25px;
              font-size: 16px;
              background: linear-gradient(to bottom, #e74c3c, #c0392b);
              border: 3px solid #a93226;
              color: white;
              border-radius: 8px;
              cursor: pointer;
              font-weight: bold;
              box-shadow: 0 4px 0 #7b241c;
            ">✕ Close</button>
          </div>
        </div>

        <!-- Category Tabs -->
        <div style="display: flex; gap: 8px; margin-bottom: 25px; flex-wrap: wrap;">
          ${UPGRADE_CATEGORIES.map(cat => `
            <button class="category-tab" data-category="${cat}" style="
              padding: 10px 18px;
              font-size: 14px;
              background: ${this.currentUpgradeCategory === cat ? 'linear-gradient(to bottom, #3498db, #2980b9)' : 'rgba(255,255,255,0.1)'};
              border: 2px solid ${this.currentUpgradeCategory === cat ? '#5dade2' : '#555'};
              color: white;
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.2s;
              font-weight: ${this.currentUpgradeCategory === cat ? 'bold' : 'normal'};
            ">${cat}</button>
          `).join('')}
        </div>

        <!-- Upgrades Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
          ${categoryUpgrades.map(upgrade => {
            const currentLevel = account.upgrades[upgrade.id] || 0;
            const maxed = currentLevel >= upgrade.maxLevel;
            const cost = maxed ? 0 : Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
            const canAfford = account.coins >= cost;

            return `
              <div class="upgrade-card" data-id="${upgrade.id}" style="
                background: linear-gradient(180deg, ${maxed ? '#1a3a1a' : '#2d3a4a'} 0%, ${maxed ? '#0d1f0d' : '#1e2832'} 100%);
                border: 3px solid ${maxed ? '#2ed573' : (canAfford ? '#4a5568' : '#3a3a4a')};
                border-radius: 12px;
                padding: 20px;
                cursor: ${maxed ? 'default' : 'pointer'};
                transition: all 0.2s;
                position: relative;
                overflow: hidden;
                ${maxed ? '' : 'box-shadow: 0 4px 0 #1a1a2e;'}
              ">
                ${maxed ? `
                  <div style="position: absolute; top: 10px; right: 10px; background: #2ed573; color: #1a1a2e; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: bold;">
                    MAX
                  </div>
                ` : ''}

                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 12px;">
                  <div style="
                    width: 50px;
                    height: 50px;
                    background: rgba(0,0,0,0.3);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 28px;
                  ">${upgrade.icon}</div>
                  <div>
                    <div style="color: white; font-size: 16px; font-weight: bold;">${upgrade.name}</div>
                    <div style="color: #7bed9f; font-size: 12px;">Lv. ${currentLevel} / ${upgrade.maxLevel}</div>
                  </div>
                </div>

                <div style="color: #a0aab4; font-size: 13px; margin-bottom: 12px; min-height: 36px;">
                  ${upgrade.desc}
                </div>

                <!-- Level Progress Bar -->
                <div style="background: rgba(0,0,0,0.4); height: 6px; border-radius: 3px; margin-bottom: 12px; overflow: hidden;">
                  <div style="
                    width: ${(currentLevel / upgrade.maxLevel) * 100}%;
                    height: 100%;
                    background: linear-gradient(to right, #2ed573, #7bed9f);
                    border-radius: 3px;
                  "></div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center;">
                  ${maxed ? `
                    <div style="color: #2ed573; font-size: 14px; font-weight: bold;">✓ Fully Upgraded</div>
                  ` : `
                    <div style="color: ${canAfford ? '#ffd700' : '#ff6b6b'}; font-size: 16px; font-weight: bold;">
                      💰 ${cost.toLocaleString()}
                    </div>
                    <div style="
                      background: ${canAfford ? 'linear-gradient(to bottom, #2ed573, #26ab5f)' : 'rgba(255,255,255,0.1)'};
                      color: ${canAfford ? 'white' : '#666'};
                      padding: 6px 14px;
                      border-radius: 6px;
                      font-size: 12px;
                      font-weight: bold;
                    ">${canAfford ? 'BUY' : 'Need more'}</div>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Stats Summary -->
        <div style="margin-top: 30px; padding: 20px; background: rgba(0,0,0,0.4); border-radius: 12px; border: 2px solid #4a5568;">
          <h3 style="color: #74b9ff; font-size: 18px; margin-bottom: 15px;">📊 Current Bonuses</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 20px;">
            ${this.getStatsSummary(account.upgrades)}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners for category tabs
    modal.querySelectorAll('.category-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        audioManager.playSfx('sfx_ui_click');
        this.currentUpgradeCategory = tab.dataset.category;
        this.renderUpgradesModal();
      });

      tab.addEventListener('mouseenter', () => {
        if (this.currentUpgradeCategory !== tab.dataset.category) {
          tab.style.background = 'rgba(255,255,255,0.2)';
        }
      });
      tab.addEventListener('mouseleave', () => {
        if (this.currentUpgradeCategory !== tab.dataset.category) {
          tab.style.background = 'rgba(255,255,255,0.1)';
        }
      });
    });

    // Event listeners for upgrade cards
    modal.querySelectorAll('.upgrade-card').forEach(card => {
      const upgradeId = card.dataset.id;
      const upgrade = PERMANENT_UPGRADES[upgradeId];
      const currentLevel = account.upgrades[upgradeId] || 0;
      const maxed = currentLevel >= upgrade.maxLevel;

      if (!maxed) {
        card.addEventListener('click', () => {
          const success = useGameStore.getState().purchaseUpgrade(upgradeId);
          if (success) {
            audioManager.playSfx('sfx_ui_click');
            this.renderUpgradesModal();
          } else {
            audioManager.playSfx('sfx_ui_click', { volume: 0.5, pitch: 0.7 });
            card.style.borderColor = '#ff4757';
            card.style.transform = 'scale(0.98)';
            setTimeout(() => {
              card.style.borderColor = '#4a5568';
              card.style.transform = '';
            }, 200);
          }
        });

        card.addEventListener('mouseenter', () => {
          audioManager.playSfx('sfx_ui_hover', { volume: 0.3 });
          card.style.transform = 'translateY(-3px)';
          card.style.borderColor = '#ffd700';
          card.style.boxShadow = '0 6px 0 #1a1a2e, 0 8px 20px rgba(255, 215, 0, 0.2)';
        });

        card.addEventListener('mouseleave', () => {
          card.style.transform = '';
          card.style.borderColor = '#4a5568';
          card.style.boxShadow = '0 4px 0 #1a1a2e';
        });
      }
    });

    document.getElementById('close-upgrades').addEventListener('click', () => {
      audioManager.playSfx('sfx_ui_click');
      document.body.removeChild(modal);
    });
  }

  getStatsSummary(upgrades) {
    const stats = [];

    const addStat = (icon, name, value, suffix = '') => {
      if (value > 0 || value === true) {
        stats.push(`
          <div style="background: rgba(255,255,255,0.05); padding: 8px 15px; border-radius: 6px; display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px;">${icon}</span>
            <span style="color: #a0aab4;">${name}:</span>
            <span style="color: #7bed9f; font-weight: bold;">${typeof value === 'boolean' ? '✓' : ('+' + value + suffix)}</span>
          </div>
        `);
      }
    };

    // Calculate total bonuses
    let hpBonus = 0, atkBonus = 0, defBonus = 0, spdBonus = 0, critBonus = 0;
    let coinBonus = 0, expBonus = 0;

    Object.keys(upgrades).forEach(id => {
      const level = upgrades[id] || 0;
      const upgrade = PERMANENT_UPGRADES[id];
      if (!upgrade || level === 0) return;

      const effect = upgrade.effect;
      if (effect.hp) hpBonus += effect.hp * level;
      if (effect.atk) atkBonus += effect.atk * level;
      if (effect.def) defBonus += effect.def * level;
      if (effect.spd) spdBonus += Math.round(effect.spd * level * 100);
      if (effect.crit) critBonus += Math.round(effect.crit * level * 100);
      if (effect.coinBonus) coinBonus += Math.round(effect.coinBonus * level * 100);
      if (effect.expBonus) expBonus += Math.round(effect.expBonus * level * 100);
    });

    addStat('❤️', 'HP', hpBonus);
    addStat('⚔️', 'ATK', atkBonus);
    addStat('🛡️', 'DEF', defBonus);
    addStat('👟', 'Speed', spdBonus, '%');
    addStat('🎯', 'Crit', critBonus, '%');
    addStat('🧲', 'Coins', coinBonus, '%');
    addStat('📚', 'EXP', expBonus, '%');

    if (stats.length === 0) {
      return '<div style="color: #666;">No upgrades purchased yet</div>';
    }

    return stats.join('');
  }
}
