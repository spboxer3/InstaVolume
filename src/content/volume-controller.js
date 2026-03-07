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
const { TimelineUI } = require('./timeline-ui.js');

class VolumeController {
    constructor() {
        this._videos = new Set();
        this._currentVolume = 100;
        this._muted = false;
        this._volumeState = new VolumeState();
        this._uiInstances = new Map();
        this._timelineInstances = new Map();
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
     * Detect video context type by walking the DOM parent chain.
     * - 'post': inside an <article> tag (feed post)
     * - 'story': on /stories/ URL and NOT inside <article>
     * - 'reel': everything else (reels, explore, etc.)
     */
    _detectVideoType(video) {
        let el = video;
        while (el && el !== document.body) {
            if (el.tagName === 'ARTICLE') return 'post';
            el = el.parentElement;
        }
        if (window.location.pathname.startsWith('/stories/')) return 'story';
        return 'reel';
    }

    /**
     * Inject volume control UI.
     * Priority: find native mute btn → hide it + insert ours before it.
     * Fallback: absolute overlay at bottom-right.
     *
     * For Stories, the mute button is NOT inside the video container —
     * it's in the header area. We search the whole story viewer or
     * use SVG aria-label to find it.
     */
    injectUI(video) {
        const container = this._findVideoContainer(video);
        if (!container) return false;
        if (container.querySelector('.instavolume-container')) return true;

        const videoType = this._detectVideoType(video);
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

        // Try to find & replace native mute button
        // For stories: search broader scope (story viewer or document)
        // For posts/reels: search within video container
        const nativeBtn = this._findNativeMuteButton(video, container, videoType);

        if (nativeBtn) {
            nativeBtn.style.setProperty('display', 'none', 'important');
            this._muteButtonsHidden.add(nativeBtn);
            nativeBtn.parentNode.insertBefore(el, nativeBtn);
        } else {
            // Fallback: absolute overlay
            el.classList.add('instavolume-overlay');
            if (videoType === 'story') {
                el.classList.add('instavolume-overlay-story');
            }
            const pos = window.getComputedStyle(container).position;
            if (pos === 'static') container.style.position = 'relative';
            container.appendChild(el);
        }

        this._uiInstances.set(video, ui);

        // Also inject timeline
        this.injectTimeline(video);

        return true;
    }

    /**
     * Inject timeline seekbar as a fixed-position overlay on document.body.
     * Uses getBoundingClientRect() to track the video's position in real-time,
     * so it works regardless of Instagram's DOM nesting or overflow.
     */
    injectTimeline(video) {
        if (this._timelineInstances.has(video)) return true;

        const timeline = new TimelineUI(video);
        const el = timeline.createElement();
        document.body.appendChild(el);

        this._timelineInstances.set(video, timeline);
        return true;
    }

    /** Hide Instagram's native mute button near a video */
    hideSiblingMuteButton(video) {
        const container = this._findVideoContainer(video);
        if (!container) return null;
        const videoType = this._detectVideoType(video);
        const btn = this._findNativeMuteButton(video, container, videoType);
        if (!btn || this._muteButtonsHidden.has(btn)) return null;
        btn.style.setProperty('display', 'none', 'important');
        this._muteButtonsHidden.add(btn);
        return btn;
    }

    /**
     * Find the native mute button.
     * Strategy differs by video type:
     * - Post/Reel: search inside the video container (overlay sibling)
     * - Story: the mute button is in the header/top area, NOT inside
     *   the video container. We search using SVG aria-label in a broader
     *   scope, or walk up from the video to find the story viewer section.
     */
    _findNativeMuteButton(video, container, videoType) {
        // Strategy 1: search container (works for posts & reels)
        const btn = this._findMuteButtonInScope(container);
        if (btn) return btn;

        // Strategy 2 (story): search the overlay sibling of the video
        // Instagram stories: video.nextElementSibling is the overlay div
        const overlay = video.nextElementSibling;
        if (overlay && overlay.tagName === 'DIV') {
            const btn2 = this._findMuteButtonInScope(overlay);
            if (btn2) return btn2;
        }

        // Strategy 3 (story): search broader - walk up several levels
        // Story mute button is typically in a header section above the video
        if (videoType === 'story') {
            // Walk up 5-8 levels from the video to find the story viewer root
            let parent = video;
            for (let i = 0; i < 8 && parent; i++) {
                parent = parent.parentElement;
            }
            if (parent) {
                const btn3 = this._findMuteButtonInScope(parent);
                if (btn3) return btn3;
            }

            // Strategy 4: use SVG aria-label to find the mute icon globally
            // in the story viewer
            const btn4 = this._findMuteButtonBySvg();
            if (btn4) return btn4;
        }

        return null;
    }

    /** Search for mute button within a given scope element */
    _findMuteButtonInScope(scope) {
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
            const btn = scope.querySelector(sel);
            if (btn) return btn;
        }
        // Broad fallback: any button with audio-related aria-label
        for (const btn of scope.querySelectorAll('button[aria-label]')) {
            const label = (btn.getAttribute('aria-label') || '').toLowerCase();
            if (label.includes('audio') || label.includes('mute') || label.includes('sound') ||
                label.includes('音') || label.includes('靜')) {
                return btn;
            }
        }
        return null;
    }

    /**
     * Find mute button via SVG aria-label (for stories).
     * The story mute button often contains an SVG with aria-label like
     * "Audio is muted" inside a [role="button"] or <button> element.
     */
    _findMuteButtonBySvg() {
        const svgLabels = [
            'Audio is muted', 'Audio is playing', 'Audio',
            '音訊已靜音', '音訊播放中', '切換音訊',
            'Ton stummgeschaltet', 'Ton wird abgespielt',
        ];
        for (const label of svgLabels) {
            const svg = document.querySelector(`svg[aria-label="${label}"]`);
            if (!svg) continue;
            // Walk up to find the clickable button parent
            const btn = svg.closest('[role="button"]') || svg.closest('button') || svg.closest('[type="button"]');
            if (btn) return btn;
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
        this._timelineInstances.forEach((t) => t.destroy());
        this._timelineInstances.clear();
    }
}

module.exports = { VolumeController };
