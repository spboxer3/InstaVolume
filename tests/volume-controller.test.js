const { VolumeController } = require('../src/content/volume-controller.js');
const { VolumeState } = require('../src/content/volume-state.js');
const { VideoDetector } = require('../src/content/video-detector.js');
const { VolumeControlUI } = require('../src/content/volume-control-ui.js');

describe('VolumeController', () => {
    let controller;

    beforeEach(() => {
        document.body.innerHTML = '';
        clearMockStorage();
    });

    afterEach(() => {
        if (controller) {
            controller.destroy();
        }
    });

    describe('video volume control', () => {
        test('should set volume on a video element', () => {
            const video = document.createElement('video');
            document.body.appendChild(video);

            controller = new VolumeController();
            controller.applyVolumeToVideo(video, 50);

            expect(video.volume).toBeCloseTo(0.5);
        });

        test('should convert percentage (0-100) to video volume (0-1)', () => {
            const video = document.createElement('video');

            controller = new VolumeController();
            controller.applyVolumeToVideo(video, 75);

            expect(video.volume).toBeCloseTo(0.75);
        });

        test('should set volume 0 correctly', () => {
            const video = document.createElement('video');

            controller = new VolumeController();
            controller.applyVolumeToVideo(video, 0);

            expect(video.volume).toBeCloseTo(0);
        });

        test('should set volume 100 correctly', () => {
            const video = document.createElement('video');

            controller = new VolumeController();
            controller.applyVolumeToVideo(video, 100);

            expect(video.volume).toBeCloseTo(1.0);
        });
    });

    describe('mute / unmute', () => {
        test('should mute video when toggling mute on', () => {
            const video = document.createElement('video');
            document.body.appendChild(video);

            controller = new VolumeController();
            controller.addVideo(video);
            controller.setMuted(true);

            expect(video.muted).toBe(true);
        });

        test('should unmute video when toggling mute off', () => {
            const video = document.createElement('video');
            video.muted = true;
            document.body.appendChild(video);

            controller = new VolumeController();
            controller.addVideo(video);
            controller.setMuted(false);

            expect(video.muted).toBe(false);
        });
    });

    describe('UI injection', () => {
        test('should find and replace Instagram mute button', () => {
            // Create a mock Instagram video container structure
            const container = document.createElement('div');
            const video = document.createElement('video');
            const controlsBar = document.createElement('div');
            const muteButton = document.createElement('button');
            muteButton.setAttribute('aria-label', 'Toggle audio');
            controlsBar.appendChild(muteButton);
            container.appendChild(video);
            container.appendChild(controlsBar);
            document.body.appendChild(container);

            controller = new VolumeController();
            const replaced = controller.injectUI(video);

            expect(replaced).toBe(true);
        });
    });

    describe('multiple videos', () => {
        test('should apply volume to all tracked videos', () => {
            const video1 = document.createElement('video');
            const video2 = document.createElement('video');
            document.body.appendChild(video1);
            document.body.appendChild(video2);

            controller = new VolumeController();
            controller.addVideo(video1);
            controller.addVideo(video2);
            controller.setVolumeAll(60);

            expect(video1.volume).toBeCloseTo(0.6);
            expect(video2.volume).toBeCloseTo(0.6);
        });

        test('should apply mute state to all tracked videos', () => {
            const video1 = document.createElement('video');
            const video2 = document.createElement('video');
            document.body.appendChild(video1);
            document.body.appendChild(video2);

            controller = new VolumeController();
            controller.addVideo(video1);
            controller.addVideo(video2);
            controller.setMuted(true);

            expect(video1.muted).toBe(true);
            expect(video2.muted).toBe(true);
        });
    });
});
