/**
 * VolumeState - Manages volume state with chrome.storage persistence
 */
class VolumeState {
    constructor() {
        this._volume = 100;
        this._muted = false;
        this._lastVolume = 100;
    }

    /**
     * Initialize state from chrome.storage
     */
    async init() {
        return new Promise((resolve) => {
            chrome.storage.local.get(
                { volume: 100, muted: false, lastVolume: 100 },
                (result) => {
                    this._volume = result.volume;
                    this._muted = result.muted;
                    this._lastVolume = result.lastVolume;
                    resolve();
                }
            );
        });
    }

    /**
     * Get current volume (0-100)
     */
    async getVolume() {
        return this._volume;
    }

    /**
     * Set volume (0-100), saves to chrome.storage
     */
    async setVolume(value) {
        value = Math.round(value);
        value = Math.max(0, Math.min(100, value));
        this._volume = value;
        this._lastVolume = value;
        return new Promise((resolve) => {
            chrome.storage.local.set(
                { volume: value, lastVolume: value },
                () => resolve()
            );
        });
    }

    /**
     * Get muted state
     */
    async getMuted() {
        return this._muted;
    }

    /**
     * Set muted state, remembers last volume for unmute restore
     */
    async setMuted(muted) {
        if (muted) {
            // Remember current volume before muting
            this._lastVolume = this._volume;
            this._muted = true;
            return new Promise((resolve) => {
                chrome.storage.local.set(
                    { muted: true, lastVolume: this._lastVolume },
                    () => resolve()
                );
            });
        } else {
            // Restore last volume when unmuting
            this._muted = false;
            this._volume = this._lastVolume;
            return new Promise((resolve) => {
                chrome.storage.local.set(
                    { muted: false, volume: this._lastVolume },
                    () => resolve()
                );
            });
        }
    }

    /**
     * Get the volume that will be restored when unmuting
     */
    async getLastVolume() {
        return this._lastVolume;
    }
}

module.exports = { VolumeState };
