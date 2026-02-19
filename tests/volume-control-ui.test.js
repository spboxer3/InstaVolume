const { VolumeControlUI } = require('../src/content/volume-control-ui.js');

describe('VolumeControlUI', () => {
    let ui;

    beforeEach(() => {
        document.body.innerHTML = '';
        ui = new VolumeControlUI();
    });

    describe('DOM structure creation', () => {
        test('should create a container element', () => {
            const element = ui.createElement();
            expect(element).toBeTruthy();
            expect(element.classList.contains('instavolume-container')).toBe(true);
        });

        test('should contain a speaker button', () => {
            const element = ui.createElement();
            const btn = element.querySelector('.instavolume-speaker-btn');
            expect(btn).toBeTruthy();
        });

        test('should contain a volume slider wrapper', () => {
            const element = ui.createElement();
            const slider = element.querySelector('.instavolume-slider-wrapper');
            expect(slider).toBeTruthy();
        });

        test('should contain an input range slider', () => {
            const element = ui.createElement();
            const input = element.querySelector('input[type="range"]');
            expect(input).toBeTruthy();
            expect(input.min).toBe('0');
            expect(input.max).toBe('100');
            expect(input.step).toBe('1');
        });

        test('slider wrapper should be hidden by default', () => {
            const element = ui.createElement();
            const slider = element.querySelector('.instavolume-slider-wrapper');
            expect(slider.classList.contains('instavolume-slider-visible')).toBe(false);
        });
    });

    describe('hover behavior', () => {
        test('should show slider on mouseenter of container', () => {
            const element = ui.createElement();
            document.body.appendChild(element);

            element.dispatchEvent(new MouseEvent('mouseenter'));
            const slider = element.querySelector('.instavolume-slider-wrapper');
            expect(slider.classList.contains('instavolume-slider-visible')).toBe(true);
        });

        test('should hide slider on mouseleave of container', () => {
            const element = ui.createElement();
            document.body.appendChild(element);

            element.dispatchEvent(new MouseEvent('mouseenter'));
            element.dispatchEvent(new MouseEvent('mouseleave'));
            const slider = element.querySelector('.instavolume-slider-wrapper');
            expect(slider.classList.contains('instavolume-slider-visible')).toBe(false);
        });
    });

    describe('volume change callback', () => {
        test('should call onVolumeChange when slider value changes', () => {
            const callback = jest.fn();
            ui.onVolumeChange(callback);
            const element = ui.createElement();
            document.body.appendChild(element);

            const input = element.querySelector('input[type="range"]');
            input.value = '50';
            input.dispatchEvent(new Event('input'));

            expect(callback).toHaveBeenCalledWith(50);
        });
    });

    describe('mute toggle callback', () => {
        test('should call onMuteToggle when speaker button is clicked', () => {
            const callback = jest.fn();
            ui.onMuteToggle(callback);
            const element = ui.createElement();
            document.body.appendChild(element);

            const btn = element.querySelector('.instavolume-speaker-btn');
            btn.click();

            expect(callback).toHaveBeenCalled();
        });
    });

    describe('speaker icon states', () => {
        test('should show muted icon when volume is 0', () => {
            const element = ui.createElement();
            ui.updateIcon(0, true);
            const svg = element.querySelector('.instavolume-speaker-btn svg');
            expect(svg).toBeTruthy();
            expect(element.getAttribute('data-volume-state')).toBe('muted');
        });

        test('should show low volume icon when volume is between 1 and 33', () => {
            const element = ui.createElement();
            ui.updateIcon(25, false);
            expect(element.getAttribute('data-volume-state')).toBe('low');
        });

        test('should show medium volume icon when volume is between 34 and 66', () => {
            const element = ui.createElement();
            ui.updateIcon(50, false);
            expect(element.getAttribute('data-volume-state')).toBe('medium');
        });

        test('should show high volume icon when volume is above 66', () => {
            const element = ui.createElement();
            ui.updateIcon(80, false);
            expect(element.getAttribute('data-volume-state')).toBe('high');
        });
    });

    describe('setSliderValue', () => {
        test('should update the slider input value', () => {
            const element = ui.createElement();
            ui.setSliderValue(42);
            const input = element.querySelector('input[type="range"]');
            expect(input.value).toBe('42');
        });
    });
});
