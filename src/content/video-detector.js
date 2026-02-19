/**
 * VideoDetector - Detects video elements in the DOM using MutationObserver
 * Tracks processed videos with WeakSet to avoid duplicates
 */
class VideoDetector {
    constructor() {
        this._processedVideos = new WeakSet();
        this._callback = null;
        this._observer = null;
    }

    /**
     * Register callback for when a new video is found
     */
    onVideoFound(callback) {
        this._callback = callback;
    }

    /**
     * Scan existing DOM for video elements
     */
    scan() {
        const videos = document.querySelectorAll('video');
        videos.forEach((video) => {
            if (!this._processedVideos.has(video)) {
                this._processedVideos.add(video);
                if (this._callback) {
                    this._callback(video);
                }
            }
        });
    }

    /**
     * Start observing DOM for dynamically added video elements
     */
    observe() {
        this._observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== Node.ELEMENT_NODE) continue;

                    // Check if the added node itself is a video
                    if (node.tagName === 'VIDEO') {
                        this._processVideo(node);
                    }

                    // Check if the added node contains videos
                    if (node.querySelectorAll) {
                        const videos = node.querySelectorAll('video');
                        videos.forEach((video) => this._processVideo(video));
                    }
                }
            }
        });

        this._observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    /**
     * Process a video element (deduplicated)
     */
    _processVideo(video) {
        if (!this._processedVideos.has(video)) {
            this._processedVideos.add(video);
            if (this._callback) {
                this._callback(video);
            }
        }
    }

    /**
     * Stop observing DOM changes
     */
    disconnect() {
        if (this._observer) {
            this._observer.disconnect();
            this._observer = null;
        }
    }
}

module.exports = { VideoDetector };
