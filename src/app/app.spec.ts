import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppComponent } from './app';
import { GitApiService } from './services/git-api.service';
import { AudioService } from './services/audio.service';

describe('AppComponent Orchestration Integration (TDD Specification)', () => {
  let app: AppComponent;
  let gitApi: GitApiService;
  let audio: AudioService;

  beforeEach(() => {
    localStorage.clear();
    gitApi = new GitApiService();
    audio = new AudioService();
    app = new AppComponent(gitApi, audio);
  });

  describe('ST-001 & RR-002: Initialization and Default Demo Showcase', () => {
    it('should initialize with curated demo showcase data', () => {
      app.ngOnInit();
      expect(app.stations().length).toBeGreaterThanOrEqual(15);
      expect(app.metrics()).not.toBeNull();
      expect(app.currentRepo()).toBe('gitjourney/showcase');
      expect(app.isLoading()).toBe(false);
    });
  });

  describe('HF-005: Audio Mute Orchestration', () => {
    it('should toggle mute and synchronize with AudioService', () => {
      app.ngOnInit();
      const initialMuted = app.audioMuted();
      app.toggleAudio();
      expect(app.audioMuted()).toBe(!initialMuted);
      expect(audio.isMuted()).toBe(!initialMuted);
    });
  });

  describe('HF-003: Station Inspection Orchestration', () => {
    it('should select station for inspection and play chime', () => {
      const playChimeSpy = vi.spyOn(audio, 'playStationChime');
      app.ngOnInit();

      const st = app.stations()[2];
      app.onStationSelected(st);

      expect(app.selectedStation()).toEqual(st);
      expect(playChimeSpy).toHaveBeenCalled();
    });

    it('should close inspector when onCloseInspector is invoked', () => {
      app.ngOnInit();
      app.onStationSelected(app.stations()[0]);
      expect(app.selectedStation()).not.toBeNull();

      app.onCloseInspector();
      expect(app.selectedStation()).toBeNull();
    });
  });

  describe('HF-007: Inspector Modal Prev/Next Navigation', () => {
    it('should navigate to next station from inspector modal', () => {
      app.ngOnInit();
      app.activeStationIndex.set(1);
      app.selectedStation.set(app.stations()[1]);

      app.onNextStation();
      expect(app.activeStationIndex()).toBe(2);
      expect(app.selectedStation()).toEqual(app.stations()[2]);
    });

    it('should navigate to previous station from inspector modal', () => {
      app.ngOnInit();
      app.activeStationIndex.set(2);
      app.selectedStation.set(app.stations()[2]);

      app.onPrevStation();
      expect(app.activeStationIndex()).toBe(1);
      expect(app.selectedStation()).toEqual(app.stations()[1]);
    });
  });

  describe('NF-003: Graceful Rate Limit Handling to Demo Fallback', () => {
    it('should switch seamlessly to demo fallback when rate limit is caught', async () => {
      vi.spyOn(gitApi, 'fetchJourney').mockRejectedValue(new Error('RATE_LIMIT_EXCEEDED'));
      await app.loadRepo('facebook/react');

      expect(app.rateLimitNotice()).toContain('rate limit');
      expect(app.stations().length).toBeGreaterThan(0);
      expect(app.isLoading()).toBe(false);
    });
  });
});
