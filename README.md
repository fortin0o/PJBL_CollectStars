# CollectStars Game

## Overview

**CollectStars** is a simple platformer built with **Phaser 3**. The player moves a character across scrolling ground, collects stars, avoids bombs, and can gain power‑ups (shield, boots, extra life). The game features:
- Multiple levels with increasing difficulty and map progression.
- Power‑up system with visual buffs and timer.
- Sound effects generated via Web Audio API.
- Mobile‑friendly controls.
- Clean UI that scales for desktop and mobile.

**Play the game** by opening this link ](https://fortin0o.github.io/PJBL_CollectStars/)

## Controls

| Action      | Keyboard | Mobile Touch |
|-------------|----------|--------------|
| Move Left   | ← or **A** | Left button |
| Move Right  | → or **D** | Right button |
| Jump        | ↑ or **W** or **Space** | Jump button |

## Project Structure

```text
src/
├─ BootScene.js          # Loads assets and starts MenuScene
├─ MenuScene.js          # Main menu UI
├─ PlayScene.js           # Core gameplay (levels, enemies, power‑ups)
├─ GameOverScene.js      # Shows final score / win state
├─ assets/               # Images, sprite sheets, audio files
└─ index.html            # Entry point for the game
```

## Features Implemented

- **Level progression** with map transition and life reward.
- **Power‑ups**: shield (protects from bomb/enemy), boots (speed boost), heart (extra life).
- **Audio**: generated oscillator sounds with adjustable volume.
- **Responsive UI**: scaled fonts and buttons for better visibility.
- **Asset reversion**: uses original platform texture and no generated enemy sprites.

## Customization

- Add new levels by editing the `levels` array in `PlayScene.js`.
- Create additional power‑up types by adding assets and handling logic in `collectPowerup`.
- Adjust visual style by editing the CSS in `index.html` or the Phaser scene settings.

## License

This project is provided as an educational example. Feel free to modify, extend, and share.
