import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { StationMapComponent } from './station-map.component';
import { Station } from '../../models/git-journey.model';

describe('StationMapComponent (TDD Specification)', () => {
  let component: StationMapComponent;

  const sampleStations: Station[] = [
    {
      id: 'sha-0',
      shortSha: 'sha0000',
      message: 'Origin commit',
      summary: 'Origin commit',
      authorName: 'Ada',
      authorEmail: 'ada@example.com',
      authorAvatarUrl: '',
      date: '2026-01-01T10:00:00Z',
      isRelease: false,
      isMidnightOil: false,
      stationType: 'origin',
      htmlUrl: 'https://github.com/test'
    },
    {
      id: 'sha-1',
      shortSha: 'sha1111',
      message: 'Midpoint feature',
      summary: 'Midpoint feature',
      authorName: 'Alan',
      authorEmail: 'alan@example.com',
      authorAvatarUrl: '',
      date: '2026-01-02T10:00:00Z',
      isRelease: false,
      isMidnightOil: true,
      stationType: 'waypoint',
      htmlUrl: 'https://github.com/test'
    },
    {
      id: 'sha-2',
      shortSha: 'sha2222',
      message: 'Release v1.0.0',
      summary: 'Release v1.0.0',
      authorName: 'Grace',
      authorEmail: 'grace@example.com',
      authorAvatarUrl: '',
      date: '2026-01-03T10:00:00Z',
      isRelease: true,
      releaseTagName: 'v1.0.0',
      isMidnightOil: false,
      stationType: 'terminus',
      htmlUrl: 'https://github.com/test'
    }
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    component = new StationMapComponent();
    component.stations = sampleStations;
    component.ngOnChanges();
  });

  afterEach(() => {
    component.stopPlayback();
    vi.useRealTimers();
  });

  describe('HF-003: Station Selection', () => {
    it('should select station and emit stationSelect event', () => {
      let selectedStation: Station | null = null;
      component.stationSelect.subscribe((s: Station) => {
        selectedStation = s;
      });

      component.onSelectStation(sampleStations[1], 1);
      expect(component.activeStationIndex).toBe(1);
      expect(selectedStation).toEqual(sampleStations[1]);
    });
  });

  describe('HF-004 & EC-004: Journey Playback and Scrubber Engine', () => {
    it('should advance station on play intervals', () => {
      component.activeStationIndex = 0;
      component.startPlayback();
      expect(component.isPlaying).toBe(true);

      // Advance 1x speed (1200ms)
      vi.advanceTimersByTime(1200);
      expect(component.activeStationIndex).toBe(1);

      vi.advanceTimersByTime(1200);
      expect(component.activeStationIndex).toBe(2);

      // Once reached end, it stops playing
      expect(component.isPlaying).toBe(false);
    });

    it('should respect 2x and 4x playback speed toggles', () => {
      component.setSpeed(2);
      expect(component.playbackSpeed).toBe(2);
      component.activeStationIndex = 0;
      component.startPlayback();

      // At 2x speed, interval is 600ms
      vi.advanceTimersByTime(600);
      expect(component.activeStationIndex).toBe(1);
    });

    it('should rewind to origin when reaching terminus and playing again', () => {
      component.activeStationIndex = 2; // At terminus
      component.startPlayback();
      // Should reset to 0 and begin
      expect(component.activeStationIndex).toBe(0);
      expect(component.isPlaying).toBe(true);
    });

    it('should toggle playback between play and pause', () => {
      component.activeStationIndex = 0;
      component.togglePlay();
      expect(component.isPlaying).toBe(true);

      component.togglePlay();
      expect(component.isPlaying).toBe(false);
    });
  });

  describe('EC-001: Single Commit Edge Case', () => {
    it('should calculate valid track layout without NaN for single commit', () => {
      component.stations = [sampleStations[0]];
      component.ngOnChanges();

      expect(component.stationsWithCoords.length).toBe(1);
      expect(isNaN(component.stationsWithCoords[0].x!)).toBe(false);
      expect(isNaN(component.stationsWithCoords[0].y!)).toBe(false);
    });
  });

  describe('Filters: All, Releases Only, Midnight Only', () => {
    it('should filter stations by release', () => {
      component.setFilter('releases');
      expect(component.currentFilter).toBe('releases');
      const filtered = component.getVisibleStations();
      expect(filtered.length).toBe(1);
      expect(filtered[0].isRelease).toBe(true);
    });

    it('should filter stations by midnight oil', () => {
      component.setFilter('midnight');
      const filtered = component.getVisibleStations();
      expect(filtered.length).toBe(1);
      expect(filtered[0].isMidnightOil).toBe(true);
    });
  });
});
