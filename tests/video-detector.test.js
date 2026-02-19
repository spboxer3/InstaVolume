const { VideoDetector } = require('../src/content/video-detector.js');

describe('VideoDetector', () => {
    let detector;
    let mockCallback;

    beforeEach(() => {
        document.body.innerHTML = '';
        mockCallback = jest.fn();
        detector = new VideoDetector();
    });

    afterEach(() => {
        detector.disconnect();
    });

    describe('detecting existing videos', () => {
        test('should detect video elements already in the DOM', () => {
            const video = document.createElement('video');
            document.body.appendChild(video);

            detector.onVideoFound(mockCallback);
            detector.scan();

            expect(mockCallback).toHaveBeenCalledWith(video);
        });

        test('should detect multiple video elements', () => {
            const video1 = document.createElement('video');
            const video2 = document.createElement('video');
            document.body.appendChild(video1);
            document.body.appendChild(video2);

            detector.onVideoFound(mockCallback);
            detector.scan();

            expect(mockCallback).toHaveBeenCalledTimes(2);
            expect(mockCallback).toHaveBeenCalledWith(video1);
            expect(mockCallback).toHaveBeenCalledWith(video2);
        });

        test('should not detect non-video elements', () => {
            const div = document.createElement('div');
            document.body.appendChild(div);

            detector.onVideoFound(mockCallback);
            detector.scan();

            expect(mockCallback).not.toHaveBeenCalled();
        });
    });

    describe('detecting dynamically added videos', () => {
        test('should detect video elements added after observation starts', (done) => {
            detector.onVideoFound(mockCallback);
            detector.observe();

            const video = document.createElement('video');
            document.body.appendChild(video);

            // MutationObserver is async
            setTimeout(() => {
                expect(mockCallback).toHaveBeenCalledWith(video);
                done();
            }, 50);
        });

        test('should detect nested video elements (inside containers)', (done) => {
            detector.onVideoFound(mockCallback);
            detector.observe();

            const container = document.createElement('div');
            const video = document.createElement('video');
            container.appendChild(video);
            document.body.appendChild(container);

            setTimeout(() => {
                expect(mockCallback).toHaveBeenCalledWith(video);
                done();
            }, 50);
        });
    });

    describe('deduplication', () => {
        test('should not call callback twice for the same video', () => {
            const video = document.createElement('video');
            document.body.appendChild(video);

            detector.onVideoFound(mockCallback);
            detector.scan();
            detector.scan();

            expect(mockCallback).toHaveBeenCalledTimes(1);
        });

        test('should track processed videos and skip them', (done) => {
            const video = document.createElement('video');
            document.body.appendChild(video);

            detector.onVideoFound(mockCallback);
            detector.scan(); // First scan picks up the video
            detector.observe();

            // Re-appending same video shouldn't trigger callback again
            document.body.removeChild(video);
            document.body.appendChild(video);

            setTimeout(() => {
                expect(mockCallback).toHaveBeenCalledTimes(1);
                done();
            }, 50);
        });
    });

    describe('disconnect', () => {
        test('should stop observing after disconnect', (done) => {
            detector.onVideoFound(mockCallback);
            detector.observe();
            detector.disconnect();

            const video = document.createElement('video');
            document.body.appendChild(video);

            setTimeout(() => {
                expect(mockCallback).not.toHaveBeenCalled();
                done();
            }, 50);
        });
    });
});
