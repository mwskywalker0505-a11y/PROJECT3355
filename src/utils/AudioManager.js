import { ASSETS } from '../constants';

class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.buffers = {};
        this.sources = {};
        this.gains = {};
        this.isLoaded = false;
    }

    async loadAll() {
        if (this.isLoaded) return;

        const loadPromises = Object.entries(ASSETS).map(async ([key, url]) => {
            if (typeof url !== 'string' || !url.includes('.')) return;
            if (!url.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) return; // Filter Audio Only

            try {
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                const decodedBuffer = await this.ctx.decodeAudioData(arrayBuffer);
                // Store by URL because App.jsx uses ASSETS values (urls) to play
                this.buffers[url] = decodedBuffer;
            } catch (e) {
                console.error(`Audio load failed: ${key} (${url})`, e);
            }
        });

        await Promise.all(loadPromises);
        this.isLoaded = true;
        console.log("Audio Assets Loaded");
    }

    resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    play(key, loop = false, volume = 1.0, onEnded = null) {
        // Resume context if needed (browsers block autoplay)
        this.resume();

        if (!this.buffers[key]) {
            console.warn(`Audio buffer not found: ${key}`);
            return;
        }

        this.stop(key); // Stop previous instance if any

        const source = this.ctx.createBufferSource();
        source.buffer = this.buffers[key];
        source.loop = loop;
        if (onEnded) {
            source.onended = onEnded;
        }

        const gainNode = this.ctx.createGain();
        gainNode.gain.value = volume;

        source.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        source.start(0);

        this.sources[key] = source;
        this.gains[key] = gainNode;
    }

    stop(key) {
        if (this.sources[key]) {
            try {
                this.sources[key].stop();
            } catch (e) { }
            delete this.sources[key];
        }
        delete this.gains[key];
    }

    fadeOut(key, duration = 2.0) {
        const gainNode = this.gains[key];
        if (!gainNode) return;

        const currentTime = this.ctx.currentTime;

        // Cancel any scheduled future changes
        gainNode.gain.cancelScheduledValues(currentTime);

        // Set the value explicitly at the current time to start the ramp smoothly
        gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);

        // Linear ramp to 0
        gainNode.gain.linearRampToValueAtTime(0, currentTime + duration);

        setTimeout(() => {
            this.stop(key);
        }, duration * 1000);
    }
}

export const audioManager = new AudioManager();
