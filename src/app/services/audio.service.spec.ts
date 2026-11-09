import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AudioService } from './audio.service';

describe('AudioService (TDD Specification)', () => {
  let service: AudioService;

  beforeEach(() => {
    // Clear localStorage mock
    localStorage.clear();
    service = new AudioService();
  });

  describe('HF-005: Audio Mute & Preference Persistence', () => {
    it('should default to unmuted (or read from localStorage if present)', () => {
      expect(service.isMuted()).toBe(false);
    });

    it('should toggle mute state and persist in localStorage', () => {
      service.setMuted(true);
      expect(service.isMuted()).toBe(true);
      expect(localStorage.getItem('gitjourney_audio_muted')).toBe('true');

      service.setMuted(false);
      expect(service.isMuted()).toBe(false);
      expect(localStorage.getItem('gitjourney_audio_muted')).toBe('false');
    });

    it('should toggle mute when calling toggleMute()', () => {
      const initial = service.isMuted();
      const updated = service.toggleMute();
      expect(updated).toBe(!initial);
      expect(service.isMuted()).toBe(!initial);
    });
  });

  describe('Procedural Sound Generation (HF-003, HF-004)', () => {
    it('should not throw error when triggering whistle sound', () => {
      expect(() => service.playWhistle()).not.toThrow();
    });

    it('should not throw error when triggering track click sound', () => {
      expect(() => service.playTrackClick()).not.toThrow();
    });

    it('should not throw error when triggering station arrival chime', () => {
      expect(() => service.playStationChime()).not.toThrow();
    });

    it('should not throw error when triggering release milestone fanfare', () => {
      expect(() => service.playFanfare()).not.toThrow();
    });

    it('should silence sounds when muted', () => {
      service.setMuted(true);
      // Calls should safely return without error or playing
      expect(() => service.playWhistle()).not.toThrow();
      expect(() => service.playTrackClick()).not.toThrow();
      expect(() => service.playStationChime()).not.toThrow();
      expect(() => service.playFanfare()).not.toThrow();
    });
  });
});
