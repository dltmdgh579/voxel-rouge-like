// AudioManager - 게임 사운드 시스템
// Web Audio API 기반의 오디오 매니저

export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.bgmGain = null;
    this.sfxGain = null;

    // Volume settings (0 to 1)
    this.masterVolume = 0.7;
    this.bgmVolume = 0.5;
    this.sfxVolume = 0.8;

    // Loaded audio buffers
    this.buffers = {};

    // Currently playing BGM
    this.currentBgm = null;
    this.currentBgmSource = null;

    // Audio file paths
    this.audioPaths = {
      // BGM
      bgm_lobby: 'audio/bgm/lobby.mp3',
      bgm_gameplay_early: 'audio/bgm/gameplay_early.mp3',
      bgm_gameplay_mid: 'audio/bgm/gameplay_mid.mp3',
      bgm_gameplay_late: 'audio/bgm/gameplay_late.mp3',
      bgm_gameover: 'audio/bgm/gameover.mp3',

      // Player SFX
      sfx_attack_1: 'audio/sfx/attack_1.mp3',
      sfx_attack_2: 'audio/sfx/attack_2.mp3',
      sfx_attack_3: 'audio/sfx/attack_3.mp3',
      sfx_player_hit: 'audio/sfx/player_hit.mp3',
      sfx_player_death: 'audio/sfx/player_death.mp3',
      sfx_player_heal: 'audio/sfx/player_heal.mp3',

      // Skill SFX
      sfx_skill_spin: 'audio/sfx/skill_spin.mp3',
      sfx_skill_dash: 'audio/sfx/skill_dash.mp3',

      // Auto Skill SFX
      sfx_orbital_hit: 'audio/sfx/orbital_hit.mp3',
      sfx_fireball_shoot: 'audio/sfx/fireball_shoot.mp3',
      sfx_fireball_explosion: 'audio/sfx/fireball_explosion.mp3',
      sfx_lightning_strike: 'audio/sfx/lightning_strike.mp3',
      sfx_poison_tick: 'audio/sfx/poison_tick.mp3',
      sfx_frost_nova: 'audio/sfx/frost_nova.mp3',
      sfx_blade_hit: 'audio/sfx/blade_hit.mp3',

      // Monster SFX
      sfx_monster_hit: 'audio/sfx/monster_hit.mp3',
      sfx_monster_death: 'audio/sfx/monster_death.mp3',
      sfx_monster_spawn: 'audio/sfx/monster_spawn.mp3',

      // UI SFX
      sfx_ui_click: 'audio/sfx/ui_click.mp3',
      sfx_ui_hover: 'audio/sfx/ui_hover.mp3',
      sfx_levelup: 'audio/sfx/levelup.mp3',
      sfx_choice_select: 'audio/sfx/choice_select.mp3',
      sfx_coin_collect: 'audio/sfx/coin_collect.mp3',
      sfx_exp_collect: 'audio/sfx/exp_collect.mp3',

      // Game Events
      sfx_game_start: 'audio/sfx/game_start.mp3',
      sfx_day_change: 'audio/sfx/day_change.mp3',
      sfx_warning_low_hp: 'audio/sfx/warning_low_hp.mp3',
    };

    // Attack sound rotation
    this.attackSoundIndex = 0;

    // Mute states
    this.isMuted = false;
    this.isBgmMuted = false;
    this.isSfxMuted = false;

    // Initialize on user interaction (required for Web Audio API)
    this.initialized = false;

    // Load settings from localStorage
    this.loadSettings();
  }

  // Initialize audio context (must be called after user interaction)
  async init() {
    if (this.initialized) return;

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Create gain nodes
      this.masterGain = this.audioContext.createGain();
      this.bgmGain = this.audioContext.createGain();
      this.sfxGain = this.audioContext.createGain();

      // Connect gain nodes
      this.bgmGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.audioContext.destination);

      // Apply volume settings
      this.updateVolumes();

      this.initialized = true;
      console.log('AudioManager initialized');

      // Preload essential sounds
      await this.preloadEssentials();

    } catch (error) {
      console.error('Failed to initialize AudioManager:', error);
    }
  }

  // Preload essential sounds
  async preloadEssentials() {
    const essentials = [
      'sfx_attack_1', 'sfx_attack_2', 'sfx_attack_3',
      'sfx_player_hit', 'sfx_monster_hit', 'sfx_monster_death',
      'sfx_ui_click', 'sfx_levelup', 'sfx_exp_collect',
    ];

    await Promise.all(essentials.map(key => this.loadSound(key)));
  }

  // Load a single sound
  async loadSound(key) {
    if (this.buffers[key]) return this.buffers[key];

    const path = this.audioPaths[key];
    if (!path) {
      console.warn(`Audio path not found for: ${key}`);
      return null;
    }

    try {
      const response = await fetch(path);
      if (!response.ok) {
        // File doesn't exist, silently skip
        return null;
      }
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.buffers[key] = audioBuffer;
      return audioBuffer;
    } catch (error) {
      // Silently fail - audio files might not exist
      return null;
    }
  }

  // Play a sound effect
  playSfx(key, options = {}) {
    if (!this.initialized || this.isMuted || this.isSfxMuted) return;

    const buffer = this.buffers[key];
    if (!buffer) {
      // Try to load and play
      this.loadSound(key).then(loadedBuffer => {
        if (loadedBuffer) this.playBuffer(loadedBuffer, this.sfxGain, options);
      });
      return;
    }

    this.playBuffer(buffer, this.sfxGain, options);
  }

  // Play audio buffer
  playBuffer(buffer, gainNode, options = {}) {
    const {
      volume = 1,
      pitch = 1,
      pitchVariation = 0,
      loop = false,
    } = options;

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;

    // Apply pitch variation
    const actualPitch = pitch + (Math.random() - 0.5) * 2 * pitchVariation;
    source.playbackRate.value = actualPitch;

    // Create individual gain for this sound
    const soundGain = this.audioContext.createGain();
    soundGain.gain.value = volume;

    source.connect(soundGain);
    soundGain.connect(gainNode);

    source.start(0);

    return source;
  }

  // Play BGM with crossfade
  async playBgm(key, fadeTime = 1) {
    if (!this.initialized) return;

    // Don't restart same BGM
    if (this.currentBgm === key && this.currentBgmSource) return;

    // Load BGM if not loaded
    let buffer = this.buffers[key];
    if (!buffer) {
      buffer = await this.loadSound(key);
      if (!buffer) return;
    }

    // Fade out current BGM
    if (this.currentBgmSource) {
      this.fadeOutBgm(fadeTime);
    }

    // Start new BGM
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const bgmSourceGain = this.audioContext.createGain();
    bgmSourceGain.gain.value = 0;

    source.connect(bgmSourceGain);
    bgmSourceGain.connect(this.bgmGain);

    source.start(0);

    // Fade in
    if (!this.isBgmMuted && !this.isMuted) {
      bgmSourceGain.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + fadeTime);
    }

    this.currentBgm = key;
    this.currentBgmSource = source;
    this.currentBgmGain = bgmSourceGain;
  }

  // Fade out current BGM
  fadeOutBgm(fadeTime = 1) {
    if (!this.currentBgmGain) return;

    const gain = this.currentBgmGain;
    const source = this.currentBgmSource;

    gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + fadeTime);

    setTimeout(() => {
      source.stop();
      source.disconnect();
    }, fadeTime * 1000);
  }

  // Stop BGM
  stopBgm() {
    if (this.currentBgmSource) {
      this.fadeOutBgm(0.5);
      this.currentBgm = null;
      this.currentBgmSource = null;
      this.currentBgmGain = null;
    }
  }

  // Play attack sound with rotation and variation
  playAttack() {
    const attackSounds = ['sfx_attack_1', 'sfx_attack_2', 'sfx_attack_3'];
    const key = attackSounds[this.attackSoundIndex % attackSounds.length];
    this.attackSoundIndex++;

    this.playSfx(key, {
      volume: 0.8,
      pitchVariation: 0.1,
    });
  }

  // Volume control
  setMasterVolume(value) {
    this.masterVolume = Math.max(0, Math.min(1, value));
    this.updateVolumes();
    this.saveSettings();
  }

  setBgmVolume(value) {
    this.bgmVolume = Math.max(0, Math.min(1, value));
    this.updateVolumes();
    this.saveSettings();
  }

  setSfxVolume(value) {
    this.sfxVolume = Math.max(0, Math.min(1, value));
    this.updateVolumes();
    this.saveSettings();
  }

  updateVolumes() {
    if (!this.initialized) return;

    this.masterGain.gain.value = this.isMuted ? 0 : this.masterVolume;
    this.bgmGain.gain.value = this.isBgmMuted ? 0 : this.bgmVolume;
    this.sfxGain.gain.value = this.isSfxMuted ? 0 : this.sfxVolume;
  }

  // Mute controls
  toggleMute() {
    this.isMuted = !this.isMuted;
    this.updateVolumes();
    this.saveSettings();
    return this.isMuted;
  }

  toggleBgmMute() {
    this.isBgmMuted = !this.isBgmMuted;
    this.updateVolumes();
    this.saveSettings();
    return this.isBgmMuted;
  }

  toggleSfxMute() {
    this.isSfxMuted = !this.isSfxMuted;
    this.updateVolumes();
    this.saveSettings();
    return this.isSfxMuted;
  }

  // Save/Load settings
  saveSettings() {
    try {
      const settings = {
        masterVolume: this.masterVolume,
        bgmVolume: this.bgmVolume,
        sfxVolume: this.sfxVolume,
        isMuted: this.isMuted,
        isBgmMuted: this.isBgmMuted,
        isSfxMuted: this.isSfxMuted,
      };
      localStorage.setItem('voxelSurvivor_audio', JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save audio settings:', e);
    }
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('voxelSurvivor_audio');
      if (saved) {
        const settings = JSON.parse(saved);
        this.masterVolume = settings.masterVolume ?? 0.7;
        this.bgmVolume = settings.bgmVolume ?? 0.5;
        this.sfxVolume = settings.sfxVolume ?? 0.8;
        this.isMuted = settings.isMuted ?? false;
        this.isBgmMuted = settings.isBgmMuted ?? false;
        this.isSfxMuted = settings.isSfxMuted ?? false;
      }
    } catch (e) {
      console.error('Failed to load audio settings:', e);
    }
  }

  // Resume audio context (needed after tab switch)
  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  // Get BGM key based on game day
  getBgmForDay(day) {
    if (day <= 3) return 'bgm_gameplay_early';
    if (day <= 7) return 'bgm_gameplay_mid';
    return 'bgm_gameplay_late';
  }
}

// Singleton instance
export const audioManager = new AudioManager();
