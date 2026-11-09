import { describe, it, expect, beforeEach } from 'vitest';
import { GitApiService } from './git-api.service';
import { Station } from '../models/git-journey.model';

describe('GitApiService (TDD Specification)', () => {
  let service: GitApiService;

  beforeEach(() => {
    service = new GitApiService();
  });

  describe('VR-001 & VR-002: Repository Input Validation and Parsing', () => {
    it('should parse valid owner/repo strings', () => {
      const result = service.parseRepoInput('angular/angular');
      expect(result).toEqual({ owner: 'angular', repo: 'angular' });
    });

    it('should parse full github.com URLs', () => {
      const result = service.parseRepoInput('https://github.com/facebook/react');
      expect(result).toEqual({ owner: 'facebook', repo: 'react' });
    });

    it('should handle trailing slashes and www', () => {
      const result = service.parseRepoInput('https://www.github.com/vuejs/core/');
      expect(result).toEqual({ owner: 'vuejs', repo: 'core' });
    });

    it('should return null for invalid formats (NF-001)', () => {
      expect(service.parseRepoInput('justaword')).toBeNull();
      expect(service.parseRepoInput('a/b/c/d')).toBeNull();
      expect(service.parseRepoInput('https://gitlab.com/owner/repo')).toBeNull();
      expect(service.parseRepoInput('')).toBeNull();
      expect(service.parseRepoInput('   ')).toBeNull();
    });
  });

  describe('Journey Metrics Computation', () => {
    it('should correctly calculate metrics for multiple commits (HF-001)', () => {
      const sampleStations: Station[] = [
        {
          id: '111',
          shortSha: '1111111',
          message: 'Initial commit',
          summary: 'Initial commit',
          authorName: 'Alice',
          authorEmail: 'alice@example.com',
          authorAvatarUrl: '',
          date: '2026-01-01T10:00:00Z',
          isRelease: false,
          isMidnightOil: false,
          stationType: 'origin',
          htmlUrl: 'https://github.com/test/repo/commit/111'
        },
        {
          id: '222',
          shortSha: '2222222',
          message: 'Midnight hacking session',
          summary: 'Midnight hacking session',
          authorName: 'Bob',
          authorEmail: 'bob@example.com',
          authorAvatarUrl: '',
          date: '2026-01-02T02:30:00Z',
          isRelease: false,
          isMidnightOil: true,
          stationType: 'waypoint',
          htmlUrl: 'https://github.com/test/repo/commit/222'
        },
        {
          id: '333',
          shortSha: '3332221',
          message: 'Release v1.0.0',
          summary: 'Release v1.0.0',
          authorName: 'Alice',
          authorEmail: 'alice@example.com',
          authorAvatarUrl: '',
          date: '2026-01-05T12:00:00Z',
          isRelease: true,
          releaseTagName: 'v1.0.0',
          isMidnightOil: false,
          stationType: 'terminus',
          htmlUrl: 'https://github.com/test/repo/commit/333'
        }
      ];

      const metrics = service.computeMetrics(sampleStations);
      expect(metrics.totalStations).toBe(3);
      expect(metrics.expressJunctions).toBe(1);
      expect(metrics.daysSpan).toBe(4);
      expect(metrics.midnightOilCount).toBe(1);
      expect(metrics.midnightOilPercent).toBe(33);
      expect(metrics.topConductors.length).toBe(2);
      expect(metrics.topConductors[0].name).toBe('Alice');
      expect(metrics.topConductors[0].commitCount).toBe(2);
    });

    it('should handle single commit without division by zero (EC-001)', () => {
      const singleStation: Station[] = [
        {
          id: '111',
          shortSha: '1111111',
          message: 'Initial commit',
          summary: 'Initial commit',
          authorName: 'Lone Wolf',
          authorEmail: 'wolf@example.com',
          authorAvatarUrl: '',
          date: '2026-01-01T10:00:00Z',
          isRelease: false,
          isMidnightOil: false,
          stationType: 'origin',
          htmlUrl: 'https://github.com/test/repo/commit/111'
        }
      ];

      const metrics = service.computeMetrics(singleStation);
      expect(metrics.totalStations).toBe(1);
      expect(metrics.daysSpan).toBe(1);
      expect(metrics.midnightOilPercent).toBe(0);
      expect(metrics.topConductors[0].name).toBe('Lone Wolf');
      expect(metrics.topConductors[0].commitCount).toBe(1);
    });
  });

  describe('Curated Demo Dataset (RR-002, NF-003)', () => {
    it('should provide a rich mock dataset with at least 15 stations and releases', () => {
      const demoStations = service.getMockDemoJourney();
      expect(demoStations.length).toBeGreaterThanOrEqual(15);
      const origin = demoStations.find(s => s.stationType === 'origin');
      const terminus = demoStations.find(s => s.stationType === 'terminus');
      const express = demoStations.filter(s => s.isRelease);
      const midnight = demoStations.filter(s => s.isMidnightOil);

      expect(origin).toBeDefined();
      expect(terminus).toBeDefined();
      expect(express.length).toBeGreaterThanOrEqual(2);
      expect(midnight.length).toBeGreaterThanOrEqual(1);
    });
  });
});
