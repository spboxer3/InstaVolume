const { VolumeState } = require('../src/content/volume-state.js');

describe('VolumeState', () => {
    let volumeState;

    beforeEach(() => {
        clearMockStorage();
        volumeState = new VolumeState();
    });

    describe('initialization', () => {
        test('should have default volume of 100', async () => {
            const volume = await volumeState.getVolume();
            expect(volume).toBe(100);
        });

        test('should have default muted state as false', async () => {
            const muted = await volumeState.getMuted();
            expect(muted).toBe(false);
        });
    });

    describe('setVolume / getVolume', () => {
        test('should save volume value to storage', async () => {
            await volumeState.setVolume(50);
            expect(chrome.storage.local.set).toHaveBeenCalledWith(
                expect.objectContaining({ volume: 50 }),
                expect.any(Function)
            );
        });

        test('should retrieve saved volume from storage', async () => {
            await volumeState.setVolume(75);
            const volume = await volumeState.getVolume();
            expect(volume).toBe(75);
        });

        test('should clamp volume to minimum 0', async () => {
            await volumeState.setVolume(-10);
            const volume = await volumeState.getVolume();
            expect(volume).toBe(0);
        });

        test('should clamp volume to maximum 100', async () => {
            await volumeState.setVolume(150);
            const volume = await volumeState.getVolume();
            expect(volume).toBe(100);
        });

        test('should round volume to integer', async () => {
            await volumeState.setVolume(33.7);
            const volume = await volumeState.getVolume();
            expect(volume).toBe(34);
        });
    });

    describe('mute / unmute', () => {
        test('should save muted state to storage', async () => {
            await volumeState.setMuted(true);
            expect(chrome.storage.local.set).toHaveBeenCalledWith(
                expect.objectContaining({ muted: true }),
                expect.any(Function)
            );
        });

        test('should remember last volume when muting', async () => {
            await volumeState.setVolume(65);
            await volumeState.setMuted(true);
            const lastVolume = await volumeState.getLastVolume();
            expect(lastVolume).toBe(65);
        });

        test('should restore last volume when unmuting', async () => {
            await volumeState.setVolume(65);
            await volumeState.setMuted(true);
            await volumeState.setMuted(false);
            const volume = await volumeState.getVolume();
            expect(volume).toBe(65);
        });

        test('should return muted=true after muting', async () => {
            await volumeState.setMuted(true);
            const muted = await volumeState.getMuted();
            expect(muted).toBe(true);
        });

        test('should return muted=false after unmuting', async () => {
            await volumeState.setMuted(true);
            await volumeState.setMuted(false);
            const muted = await volumeState.getMuted();
            expect(muted).toBe(false);
        });
    });

    describe('load from storage', () => {
        test('should load previously saved state on init', async () => {
            // Pre-populate storage
            chrome.storage.local._data.volume = 42;
            chrome.storage.local._data.muted = false;
            chrome.storage.local._data.lastVolume = 42;

            await volumeState.init();
            const volume = await volumeState.getVolume();
            expect(volume).toBe(42);
        });
    });
});
