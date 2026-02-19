# 🔊 InstaVolume

> Instagram 網頁版音量控制 Chrome 擴充功能 — 讓你在電腦上也能精準控制音量。

Instagram 網頁版目前只提供靜音/取消靜音的簡單開關，無法調整音量大小。**InstaVolume** 直接在影片播放器介面中整合一個原生風格的音量滑桿，支援 **Reels** 和 **Feed** 動態牆影片，提供更完整的觀看體驗。

![InstaVolume Screenshot](screenshot.png)

## ✨ 主要功能

- 🎚️ **精準音量控制** — 滑鼠移到喇叭圖示即展開垂直滑桿，支援 0-100% 音量微調。
- 🔇 **智慧靜音切換** — 點擊切換靜音，取消靜音時自動恢復先前的音量設定。
- 🔄 **全域音量同步** — 調整任一影片的音量，所有影片（包含新載入的）都會立刻同步，無需重複調整。
- 💾 **自動記憶設定** — 即使關閉分頁或重新整理，也會記住你上次的音量偏好。
- 🎨 **原生設計風格** — 使用 Instagram 專屬的模糊背景特效與圖示風格，與原介面無縫融合。
- 📱 **完整支援** — 同時適用於首頁動態牆 (Feed) 與 Reels 短影音播放器。

## 🚀 快速開始

### 開發者安裝

1. 下載專案：
   ```bash
   git clone https://github.com/yourusername/instavolume.git
   cd instavolume
   ```

2. 安裝依賴並建置：
   ```bash
   npm install
   npm run build
   ```

3. 載入至 Chrome：
   - 開啟 `chrome://extensions`
   - 開啟右上角的 **開發人員模式**
   - 點擊 **載入未封裝項目**
   - 選擇專案資料夾內的 `dist/chrome` 目錄。

## 🛠️ 使用說明

1. 打開 [Instagram](https://www.instagram.com)。
2. 瀏覽你的動態牆或 Reels。
3. 你會看到 **InstaVolume** 的喇叭圖示（取代了原生的靜音按鈕）。
4. **滑鼠移入** 圖示 → 顯示音量滑桿。
5. **拖曳滑桿** → 調整音量。
6. **點擊圖示** → 切換靜音。

## 🏗️ 開發相關

### 專案結構
```
instavolume/
├── src/
│   ├── content/           # 核心邏輯 (Volume Controller, State, UI)
│   ├── images/            # 圖示檔案
│   └── manifest.json      # 擴充功能設定檔 (Manifest V3)
├── tests/                 # Jest 單元測試
└── extension.config.cjs   # 建置設定
```

### 常用指令
- `npm run dev` — 啟動開發伺服器（即時熱重載擴充功能）
- `npm test` — 執行測試套件（包含 44+ 個單元測試）
- `npm run build` — 編譯正式發布版本

## 📄 授權

MIT License
