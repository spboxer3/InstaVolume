# 🔊 InstaVolume

> A Chrome extension that adds a sleek, native-feeling volume control slider to Instagram's web interface.

Instagram's web player lacks precise volume control, offering only a mute/unmute toggle. **InstaVolume** solves this by seamlessly integrating a vertical volume slider directly into the video player, allowing you to fine-tune audio levels for both **Reels** and **Feed** videos.

![InstaVolume Screenshot](screenshot.png)

## ✨ Features

- 🎚️ **Vertical Volume Slider** — Hover over the speaker icon to reveal a precise 0-100% volume slider.
- 🔇 **Smart Mute/Unmute** — Click to toggle mute. Unmuting restores your previous volume level.
- 🔄 **Global Volume Sync** — Adjust volume on one video, and it instantly applies to *all* videos. New videos inherit the global volume automatically.
- 💾 **Auto-Save** — Your volume preference is remembered even after you close the tab or reload the page.
- 🎨 **Native Instagram Design** — Styled with Instagram's own specific blur effects and iconography to look completely built-in.
- 📱 **Feed & Reels Support** — Works perfectly on both the scrolling Feed and the immersive Reels player.

## 🚀 Installation

### From Source (Developer Mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/instavolume.git
   cd instavolume
   ```

2. Install dependencies and build:
   ```bash
   npm install
   npm run build
   ```

3. Load into Chrome:
   - Open `chrome://extensions`
   - Enable **Developer mode** (top right toggle)
   - Click **Load unpacked**
   - Select the `dist/chrome` folder inside the project directory.

## 🛠️ Usage

1. Open [Instagram](https://www.instagram.com).
2. Browse your Feed or Reels.
3. You'll see the **InstaVolume** speaker icon (replacing the native mute button).
4. **Hover** over it to show the slider.
5. **Drag** to adjust volume.
6. **Click** to toggle mute.

## 🏗️ Development

### Project Structure
```
instavolume/
├── src/
│   ├── content/           # Core logic (Volume Controller, State, UI)
│   ├── images/            # Icons
│   └── manifest.json      # Extension configuration
├── tests/                 # Jest unit tests
└── extension.config.cjs   # Build config
```

### Commands
- `npm run dev` — Start dev server (auto-reloads extension)
- `npm test` — Run the test suite (44+ unit tests)
- `npm run build` — Compile for production

## 📄 License

MIT License
