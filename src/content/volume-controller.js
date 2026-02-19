/**
 * VolumeController - Main controller that coordinates all modules
 *
 * Key behaviors:
 * - Global volume: all videos share the same volume level
 * - Mute state is persisted and applied to every new video, even after
 *   Instagram's own JS forces muted=true on scroll
 * - Hides Instagram's native mute button and replaces with ours
 */

const { VolumeState } = require('./volume-state.js');
const { VideoDetector } = require('./video-detector.js');
const { VolumeControlUI } = require('./volume-control-ui.js');

class VolumeController {
    constructor() {
        this._videos = new Set();
        this._currentVolume = 100;
        this._muted = false;
        this._volumeState = new VolumeState();
        this._uiInstances = new Map();
        this._muteButtonsHidden = new WeakSet();
    }

    /** Apply volume to a video element (converts 0-100 to 0-1) */
    applyVolumeToVideo(video, volumePercent) {
        video.volume = volumePercent / 100;
    }

    /**
     * Add a video to the tracked set.
     * Applies global volume/mute state immediately AND re-applies on key events,
     * because Instagram forces muted=true on new videos after play starts.
     */
    addVideo(video) {
        if (this._videos.has(video)) return;
        this._videos.add(video);

        // Apply saved state immediately
        this._applyStateToVideo(video);

        // Re-apply on play/loadeddata (Reels & page-switch)
        const reApply = () => this._applyStateToVideo(video);
        video.addEventListener('play', reApply);
        video.addEventListener('loadeddata', reApply);
        video.addEventListener('canplay', reApply);

        // IntersectionObserver: most reliable trigger for Feed scroll.
        // Instagram calls .play() as video enters viewport — often before
        // our play listener is attached. We re-apply with small delays to
        // override Instagram's post-play forced mute.
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    this._applyStateToVideo(video);
                    setTimeout(() => this._applyStateToVideo(video), 80);
                    setTimeout(() => this._applyStateToVideo(video), 250);
                }
            });
        }, { threshold: 0.5 });
        io.observe(video);
    }

    /** Apply stored global state to a single video */
    _applyStateToVideo(video) {
        this.applyVolumeToVideo(video, this._currentVolume);
        video.muted = this._muted;
    }

    /** Set volume on ALL tracked videos (global) */
    setVolumeAll(volumePercent) {
        this._currentVolume = volumePercent;
        this._muted = false;
        this._videos.forEach((v) => {
            this.applyVolumeToVideo(v, volumePercent);
            v.muted = false;
        });
        this._uiInstances.forEach((ui) => {
            ui.setSliderValue(volumePercent);
            ui.updateIcon(volumePercent, false);
        });
    }

    /** Set mute state on ALL tracked videos */
    setMuted(muted) {
        this._muted = muted;
        this._videos.forEach((v) => {
            v.muted = muted;
            if (!muted) this.applyVolumeToVideo(v, this._currentVolume);
        });
        this._uiInstances.forEach((ui) => {
            ui.updateIcon(muted ? 0 : this._currentVolume, muted);
        });
    }

    /**
     * Inject volume control UI.
     * Priority: find native mute btn → hide it + insert ours before it.
     * Fallback: absolute overlay at bottom-right.
     */
    injectUI(video) {
        const container = this._findVideoContainer(video);
        if (!container) return false;
        if (container.querySelector('.instavolume-container')) return true;

        const ui = new VolumeControlUI();
        const el = ui.createElement();

        // Volume change → global
        ui.onVolumeChange((volume) => {
            this._volumeState.setVolume(volume);
            this.setVolumeAll(volume);
        });

        // Mute toggle → global
        ui.onMuteToggle(() => {
            const next = !this._muted;
            this._volumeState.setMuted(next);
            this.setMuted(next);
        });

        // Keep UI in sync if external JS changes video state
        video.addEventListener('volumechange', () => {
            const vol = Math.round(video.volume * 100);
            const muted = video.muted;
            const myUI = this._uiInstances.get(video);
            if (myUI) {
                myUI.setSliderValue(muted ? 0 : vol);
                myUI.updateIcon(vol, muted);
            }
        });

        // Try to replace native mute button
        const nativeBtn = this._findMuteButton(container);
        if (nativeBtn) {
            nativeBtn.style.setProperty('display', 'none', 'important');
            this._muteButtonsHidden.add(nativeBtn);
            nativeBtn.parentNode.insertBefore(el, nativeBtn);
        } else {
            // Fallback: absolute overlay — match Instagram's native button inset
            el.classList.add('instavolume-overlay');
            const pos = window.getComputedStyle(container).position;
            if (pos === 'static') container.style.position = 'relative';
            container.appendChild(el);
        }

        this._uiInstances.set(video, ui);
        return true;
    }

    /** Hide Instagram's native mute button near a video */
    hideSiblingMuteButton(video) {
        const container = this._findVideoContainer(video);
        if (!container) return null;
        const btn = this._findMuteButton(container);
        if (!btn || this._muteButtonsHidden.has(btn)) return null;
        btn.style.setProperty('display', 'none', 'important');
        this._muteButtonsHidden.add(btn);
        return btn;
    }

    /** Find Instagram's audio/mute button using many possible selectors */
    _findMuteButton(container) {
        const selectors = [
            'button[aria-label="Toggle audio"]',
            'button[aria-label="Audio is muted"]',
            'button[aria-label="Audio is playing"]',
            'button[aria-label="切換音訊"]',
            'button[aria-label="音訊已靜音"]',
            'button[aria-label="音訊播放中"]',
            'button[aria-label="Mute"]',
            'button[aria-label="Unmute"]',
            'button[aria-label="靜音"]',
            'button[aria-label="取消靜音"]',
        ];
        for (const sel of selectors) {
            const btn = container.querySelector(sel);
            if (btn) return btn;
        }
        // Broad fallback: any button with audio-related aria-label
        for (const btn of container.querySelectorAll('button[aria-label]')) {
            const label = (btn.getAttribute('aria-label') || '').toLowerCase();
            if (label.includes('audio') || label.includes('mute') || label.includes('sound') ||
                label.includes('音') || label.includes('靜')) {
                return btn;
            }
        }
        return null;
    }

    /** Walk up DOM to find a container element at least as large as the video */
    _findVideoContainer(video) {
        const vr = video.getBoundingClientRect();
        let el = video.parentElement;
        let i = 0;
        while (el && el !== document.body && i++ < 10) {
            const r = el.getBoundingClientRect();
            if (r.width >= vr.width && r.height >= vr.height) return el;
            el = el.parentElement;
        }
        return video.parentElement;
    }

    destroy() {
        this._videos.clear();
        this._uiInstances.clear();
    }
}

module.exports = { VolumeController };
