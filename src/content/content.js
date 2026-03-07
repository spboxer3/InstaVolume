/**
 * InstaVolume - Content Script Entry Point
 *
 * Global volume strategy:
 * - All detected videos share the same volume level
 * - New videos instantly inherit the current global volume
 * - Instagram's native mute button is hidden; ours is inserted in its place
 */

const { VolumeState } = require('./volume-state.js');
const { VideoDetector } = require('./video-detector.js');
const { VolumeController } = require('./volume-controller.js');

(async function main() {
    const volumeState = new VolumeState();
    await volumeState.init();

    const savedVolume = await volumeState.getVolume();
    const savedMuted = await volumeState.getMuted();

    // Single shared controller — all videos use the same volume
    const controller = new VolumeController();
    controller._currentVolume = savedVolume;
    controller._muted = savedMuted;
    controller._volumeState = volumeState;

    const detector = new VideoDetector();

    detector.onVideoFound((video) => {
        // addVideo already applies current global volume
        controller.addVideo(video);

        // Try to inject UI + hide native mute button (retries until controls appear)
        injectWithRetry(controller, video, savedVolume, savedMuted);

        // Also retry hiding native mute button separately (it may appear later)
        hideNativeMuteWithRetry(controller, video);

        // Inject timeline seekbar (retries until container appears)
        injectTimelineWithRetry(controller, video);
    });

    detector.scan();
    detector.observe();
})();

/**
 * Inject volume UI with retries.
 * Instagram's player controls render lazily, so we retry until they appear.
 */
function injectWithRetry(controller, video, volume, muted, attempt = 0) {
    const MAX = 20;
    const DELAY = 300;

    if (attempt >= MAX) return;

    // Skip if already injected
    const container = controller._findVideoContainer(video);
    if (container && container.querySelector('.instavolume-container')) return;

    const injected = controller.injectUI(video);
    if (injected) {
        const ui = controller._uiInstances.get(video);
        if (ui) {
            ui.setSliderValue(volume);
            ui.updateIcon(volume, muted);
        }
        return;
    }

    setTimeout(() => injectWithRetry(controller, video, volume, muted, attempt + 1), DELAY);
}

/**
 * Inject timeline seekbar with retries.
 */
function injectTimelineWithRetry(controller, video, attempt = 0) {
    const MAX = 20;
    const DELAY = 300;

    if (attempt >= MAX) return;
    if (controller._timelineInstances.has(video)) return;

    const injected = controller.injectTimeline(video);
    if (injected) return;

    setTimeout(() => injectTimelineWithRetry(controller, video, attempt + 1), DELAY);
}

/**
 * Hide Instagram's native mute button with retries.
 */
function hideNativeMuteWithRetry(controller, video, attempt = 0) {
    const MAX = 20;
    const DELAY = 300;

    if (attempt >= MAX) return;

    const hidden = controller.hideSiblingMuteButton(video);
    if (!hidden) {
        setTimeout(() => hideNativeMuteWithRetry(controller, video, attempt + 1), DELAY);
    }
}
