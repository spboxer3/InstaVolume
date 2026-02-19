/**
 * VolumeControlUI - Creates the volume control UI (speaker icon + vertical slider)
 * Styled to match Instagram's native black/white minimalist design
 */
class VolumeControlUI {
    constructor() {
        this._element = null;
        this._volumeChangeCallback = null;
        this._muteToggleCallback = null;
    }

    /**
     * Register volume change callback
     */
    onVolumeChange(callback) {
        this._volumeChangeCallback = callback;
    }

    /**
     * Register mute toggle callback
     */
    onMuteToggle(callback) {
        this._muteToggleCallback = callback;
    }

    /**
     * Create the complete volume control DOM element
     */
    createElement() {
        const container = document.createElement('div');
        container.className = 'instavolume-container';
        container.setAttribute('data-volume-state', 'high');

        // Speaker button
        const speakerBtn = document.createElement('button');
        speakerBtn.className = 'instavolume-speaker-btn';
        speakerBtn.type = 'button';
        speakerBtn.innerHTML = this._getSpeakerSVG('high');
        speakerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            if (this._muteToggleCallback) {
                this._muteToggleCallback();
            }
        });

        // Slider wrapper
        const sliderWrapper = document.createElement('div');
        sliderWrapper.className = 'instavolume-slider-wrapper';

        // Slider track background
        const sliderTrack = document.createElement('div');
        sliderTrack.className = 'instavolume-slider-track';

        // Range input
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '100';
        slider.step = '1';
        slider.value = '100';
        slider.className = 'instavolume-slider';
        slider.addEventListener('input', (e) => {
            e.stopPropagation();
            const value = parseInt(e.target.value, 10);
            this._updateSliderFill(value);
            if (this._volumeChangeCallback) {
                this._volumeChangeCallback(value);
            }
        });
        slider.addEventListener('click', (e) => e.stopPropagation());
        slider.addEventListener('mousedown', (e) => e.stopPropagation());

        sliderTrack.appendChild(slider);
        sliderWrapper.appendChild(sliderTrack);

        // Hover behavior
        container.addEventListener('mouseenter', () => {
            sliderWrapper.classList.add('instavolume-slider-visible');
        });
        container.addEventListener('mouseleave', () => {
            sliderWrapper.classList.remove('instavolume-slider-visible');
        });

        container.appendChild(sliderWrapper);
        container.appendChild(speakerBtn);

        this._element = container;
        return container;
    }

    /**
     * Update speaker icon based on volume level and mute state
     */
    updateIcon(volume, muted) {
        if (!this._element) return;

        let state;
        if (muted || volume === 0) {
            state = 'muted';
        } else if (volume <= 33) {
            state = 'low';
        } else if (volume <= 66) {
            state = 'medium';
        } else {
            state = 'high';
        }

        this._element.setAttribute('data-volume-state', state);
        const btn = this._element.querySelector('.instavolume-speaker-btn');
        if (btn) {
            btn.innerHTML = this._getSpeakerSVG(state);
        }
    }

    /**
     * Set slider value programmatically
     */
    setSliderValue(value) {
        if (!this._element) return;
        const slider = this._element.querySelector('input[type="range"]');
        if (slider) {
            slider.value = String(value);
            this._updateSliderFill(value);
        }
    }

    /**
     * Update slider fill indicator
     */
    _updateSliderFill(value) {
        if (!this._element) return;
        const slider = this._element.querySelector('.instavolume-slider');
        if (slider) {
            slider.style.setProperty('--fill-percent', `${value}%`);
        }
    }

    /**
     * Get SVG for speaker icon based on volume state
     */
    _getSpeakerSVG(state) {
        const baseColor = 'white';
        switch (state) {
            case 'muted':
                return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${baseColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <line x1="23" y1="9" x2="17" y2="15"></line>
          <line x1="17" y1="9" x2="23" y2="15"></line>
        </svg>`;
            case 'low':
                return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${baseColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>`;
            case 'medium':
                return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${baseColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
        </svg>`;
            case 'high':
            default:
                return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${baseColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
        </svg>`;
        }
    }

    /**
     * Get the element
     */
    getElement() {
        return this._element;
    }
}

module.exports = { VolumeControlUI };
