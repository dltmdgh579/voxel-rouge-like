# Required Audio Files for Voxel Survivor

Place all audio files in their respective folders. All files should be in **MP3 format**.

## BGM (Background Music) - `/audio/bgm/`

| File Name | Description | Mood | Duration |
|-----------|-------------|------|----------|
| `lobby.mp3` | Main menu/lobby music | Calm, adventurous | 2-4 min loop |
| `gameplay_early.mp3` | Day 1-3 gameplay | Peaceful, mysterious | 2-4 min loop |
| `gameplay_mid.mp3` | Day 4-7 gameplay | Tense, building action | 2-4 min loop |
| `gameplay_late.mp3` | Day 8+ gameplay | Intense, epic battle | 2-4 min loop |
| `gameover.mp3` | Game over screen | Melancholic, reflective | 2-3 min |

## SFX (Sound Effects) - `/audio/sfx/`

### Player Combat
| File Name | Description | Length |
|-----------|-------------|--------|
| `attack_1.mp3` | Sword swing variant 1 | ~150ms |
| `attack_2.mp3` | Sword swing variant 2 | ~150ms |
| `attack_3.mp3` | Sword swing variant 3 | ~150ms |
| `player_hit.mp3` | Player takes damage | ~200ms |
| `player_death.mp3` | Player dies | ~1s |
| `player_heal.mp3` | Player heals | ~300ms |

### Player Skills
| File Name | Description | Length |
|-----------|-------------|--------|
| `skill_spin.mp3` | Spin attack activation | ~300ms |
| `skill_dash.mp3` | Dash activation | ~200ms |

### Auto Skills
| File Name | Description | Length |
|-----------|-------------|--------|
| `orbital_hit.mp3` | Orbital hits enemy | ~100ms |
| `fireball_shoot.mp3` | Fireball launch | ~200ms |
| `fireball_explosion.mp3` | Fireball impact | ~400ms |
| `lightning_strike.mp3` | Lightning bolt | ~500ms |
| `poison_tick.mp3` | Poison damage tick | ~100ms |
| `frost_nova.mp3` | Frost nova burst | ~400ms |
| `blade_hit.mp3` | Spinning blade hit | ~100ms |

### Monster
| File Name | Description | Length |
|-----------|-------------|--------|
| `monster_hit.mp3` | Monster takes damage | ~150ms |
| `monster_death.mp3` | Monster dies | ~400ms |
| `monster_spawn.mp3` | Monster spawns | ~300ms |

### UI Sounds
| File Name | Description | Length |
|-----------|-------------|--------|
| `ui_click.mp3` | Button click | ~100ms |
| `ui_hover.mp3` | Button hover | ~80ms |
| `levelup.mp3` | Level up fanfare | ~500ms |
| `choice_select.mp3` | Ability selection confirm | ~200ms |
| `coin_collect.mp3` | Coin pickup | ~150ms |
| `exp_collect.mp3` | Experience pickup | ~200ms |

### Game Events
| File Name | Description | Length |
|-----------|-------------|--------|
| `game_start.mp3` | Game begins | ~300ms |
| `day_change.mp3` | Day advances | ~400ms |
| `warning_low_hp.mp3` | Low HP warning | ~500ms |

---

## Audio Specifications

- **Format**: MP3 (for web compatibility)
- **Sample Rate**: 44.1kHz or 48kHz
- **Bit Rate**: 128-192 kbps (balance between quality and file size)
- **Channels**: Stereo for BGM, Mono for short SFX

## Volume Guidelines

- **BGM**: Mix at -20dB to -15dB (will be adjusted by master volume)
- **SFX**: Mix at -15dB to -10dB (louder than BGM base)
- Ensure consistent loudness across similar sound types

## Free Resources

### BGM
- [OpenGameArt.org](https://opengameart.org/) - Free game music
- [Incompetech.com](https://incompetech.com/) - Kevin MacLeod's royalty-free music
- [Pixabay Music](https://pixabay.com/music/) - Free music library

### SFX
- [Freesound.org](https://freesound.org/) - Large sound effect library
- [Kenney.nl](https://kenney.nl/assets?q=audio) - Game assets including audio
- [ZapSplat](https://www.zapsplat.com/) - Free sound effects

### AI Generation
- [Suno AI](https://suno.ai/) - AI music generation
- [Udio](https://udio.com/) - AI music creation

---

## Priority Order (Essential sounds first)

### High Priority (Game feels empty without these)
1. `attack_1.mp3`, `attack_2.mp3`, `attack_3.mp3`
2. `monster_hit.mp3`, `monster_death.mp3`
3. `player_hit.mp3`
4. `levelup.mp3`
5. `gameplay_early.mp3` (main BGM)

### Medium Priority (Enhances experience)
6. `skill_spin.mp3`, `skill_dash.mp3`
7. `ui_click.mp3`
8. `coin_collect.mp3`, `exp_collect.mp3`
9. `lobby.mp3`
10. `gameover.mp3`

### Lower Priority (Nice to have)
11. All other auto skill sounds
12. `ui_hover.mp3`
13. `day_change.mp3`
14. Additional BGM variations
