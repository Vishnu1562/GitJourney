import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private audioCtx: AudioContext | null = null;
  private muted = false;
  private readonly STORAGE_KEY = 'gitjourney_audio_muted';

  constructor() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        this.muted = stored === 'true';
      }
    } catch {
      this.muted = false;
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  setMuted(isMuted: boolean): void {
    this.muted = isMuted;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, String(isMuted));
      }
    } catch {
      // Ignored if storage is unavailable
    }
  }

  toggleMute(): boolean {
    const nextState = !this.muted;
    this.setMuted(nextState);
    return nextState;
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    return this.audioCtx;
  }

  playTrackClick(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Click 1 (primary strike)
      this.createClickImpulse(ctx, now, 0.08);

      // Clack 2 (secondary wheel bounce ~70ms later)
      this.createClickImpulse(ctx, now + 0.07, 0.04);
    } catch {
      // Audio playback safely ignored if interrupted
    }
  }

  private createClickImpulse(ctx: AudioContext, startTime: number, volume: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, startTime);
    osc.frequency.exponentialRampToValueAtTime(45, startTime + 0.035);

    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.04);
  }

  playStationChime(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Warm railway station two-tone bell (E5 -> B5)
      this.playChimeTone(ctx, 659.25, now, 0.12, 0.45);
      this.playChimeTone(ctx, 987.77, now + 0.15, 0.1, 0.55);
    } catch {
      // Safely ignore
    }
  }

  private playChimeTone(ctx: AudioContext, freq: number, startTime: number, volume: number, duration: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  playWhistle(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const duration = 0.8;

      // Authentic dual-pitch steam whistle: D5 (587Hz) and F#5 (740Hz)
      const freqs = [587.33, 739.99];

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        // Subtle pitch bend upwards like steam pressure building
        osc.frequency.setValueAtTime(freq * 0.98, now);
        osc.frequency.linearRampToValueAtTime(freq, now + 0.1);
        osc.frequency.setValueAtTime(freq, now + duration - 0.15);
        osc.frequency.linearRampToValueAtTime(freq * 0.97, now + duration);

        // Low-pass filter to give it a warm, brassy acoustic whistle body
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400 + idx * 200, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
      });
    } catch {
      // Safely ignore
    }
  }

  playFanfare(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Triumphant chord arpeggio: C5 -> E5 -> G5 -> C6
      const notes = [523.25, 659.25, 783.99, 1046.5];
      const spacing = 0.08;

      notes.forEach((freq, index) => {
        const noteStart = now + index * spacing;
        const noteDuration = 0.5 + index * 0.1;
        this.playChimeTone(ctx, freq, noteStart, 0.09, noteDuration);
      });
    } catch {
      // Safely ignore
    }
  }
}
