/**
 * TimelineUI - Seekable timeline bar for video/reels
 *
 * Uses position:fixed + getBoundingClientRect() to overlay the timeline
 * at the bottom of the video. This approach is completely independent of
 * Instagram's DOM nesting, overflow, or stacking context.
 */
class TimelineUI {
    constructor(video) {
        this._video = video;
        this._element = null;
        this._progressFill = null;
        this._thumb = null;
        this._timeLabel = null;
        this._bar = null;
        this._isDragging = false;
        this._animFrameId = null;
        this._visible = false;
    }

    createElement() {
        const wrapper = document.createElement('div');
        wrapper.className = 'instavolume-timeline';

        const bar = document.createElement('div');
        bar.className = 'instavolume-timeline-bar';

        const fill = document.createElement('div');
        fill.className = 'instavolume-timeline-fill';

        const thumb = document.createElement('div');
        thumb.className = 'instavolume-timeline-thumb';

        bar.appendChild(fill);
        bar.appendChild(thumb);
        wrapper.appendChild(bar);

        this._element = wrapper;
        this._progressFill = fill;
        this._thumb = thumb;
        this._bar = bar;

        this._attachSeekEvents(bar);
        this._observeVisibility();
        this._startUpdating();

        return wrapper;
    }

    /** Show/hide based on whether the video is on screen */
    _observeVisibility() {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                this._visible = entry.isIntersecting;
                if (this._element) {
                    this._element.style.display = this._visible ? '' : 'none';
                }
            });
        }, { threshold: 0.3 });
        io.observe(this._video);
    }

    _attachSeekEvents(bar) {
        const seek = (e) => {
            const rect = bar.getBoundingClientRect();
            let ratio = (e.clientX - rect.left) / rect.width;
            ratio = Math.max(0, Math.min(1, ratio));
            if (this._video.duration && isFinite(this._video.duration)) {
                this._video.currentTime = ratio * this._video.duration;
            }
        };

        bar.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this._isDragging = true;
            seek(e);
        });

        document.addEventListener('mousemove', (e) => {
            if (!this._isDragging) return;
            e.preventDefault();
            seek(e);
        });

        document.addEventListener('mouseup', () => {
            this._isDragging = false;
        });

        bar.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
        });
    }

    _startUpdating() {
        const tick = () => {
            if (this._visible) {
                this._updatePosition();
                this._updateProgress();
            }
            this._animFrameId = requestAnimationFrame(tick);
        };
        this._animFrameId = requestAnimationFrame(tick);
    }

    /** Reposition the fixed element to sit at the bottom of the video */
    _updatePosition() {
        const rect = this._video.getBoundingClientRect();
        const el = this._element;
        if (!el || rect.width === 0) return;

        el.style.left = rect.left + 'px';
        el.style.width = rect.width + 'px';
        el.style.bottom = (window.innerHeight - rect.bottom) + 'px';

    }

    _updateProgress() {
        const v = this._video;
        if (!v || !isFinite(v.duration) || v.duration === 0) return;

        const ratio = v.currentTime / v.duration;
        const pct = (ratio * 100).toFixed(2);
        this._progressFill.style.width = pct + '%';
        this._thumb.style.left = pct + '%';
    }

    destroy() {
        if (this._animFrameId) {
            cancelAnimationFrame(this._animFrameId);
            this._animFrameId = null;
        }
        if (this._element && this._element.parentNode) {
            this._element.parentNode.removeChild(this._element);
        }
    }

    getElement() {
        return this._element;
    }
}

module.exports = { TimelineUI };
