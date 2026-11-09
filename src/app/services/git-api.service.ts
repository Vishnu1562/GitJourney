import { Injectable } from '@angular/core';
import { Station, JourneyMetrics, Conductor } from '../models/git-journey.model';

@Injectable({
  providedIn: 'root'
})
export class GitApiService {
  private cache = new Map<string, Station[]>();

  parseRepoInput(input: string): { owner: string; repo: string } | null {
    if (!input || typeof input !== 'string') return null;
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Remove protocol and host if present
    let cleaned = trimmed
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .replace(/^github\.com\//i, '')
      .replace(/\.git$/i, '')
      .replace(/\/+$/, '');

    // Must match owner/repo exactly
    const parts = cleaned.split('/');
    if (parts.length !== 2) return null;

    const [owner, repo] = parts;
    const validSlugRegex = /^[a-zA-Z0-9_.-]+$/;

    if (!validSlugRegex.test(owner) || !validSlugRegex.test(repo)) {
      return null;
    }

    return { owner, repo };
  }

  computeMetrics(stations: Station[]): JourneyMetrics {
    if (!stations || stations.length === 0) {
      return {
        totalStations: 0,
        expressJunctions: 0,
        daysSpan: 0,
        midnightOilCount: 0,
        midnightOilPercent: 0,
        topConductors: []
      };
    }

    const totalStations = stations.length;
    const expressJunctions = stations.filter(s => s.isRelease).length;
    const midnightOilCount = stations.filter(s => s.isMidnightOil).length;
    const midnightOilPercent = Math.round((midnightOilCount / totalStations) * 100);

    // Compute timeline span in days
    let daysSpan = 1;
    if (stations.length > 1) {
      const dates = stations.map(s => new Date(s.date).getTime()).filter(t => !isNaN(t));
      if (dates.length > 1) {
        const minTime = Math.min(...dates);
        const maxTime = Math.max(...dates);
        const diffMs = maxTime - minTime;
        daysSpan = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
      }
    }

    // Aggregate top conductors
    const authorMap = new Map<string, { count: number; avatar: string }>();
    for (const station of stations) {
      const name = station.authorName || 'Anonymous';
      const existing = authorMap.get(name) || { count: 0, avatar: station.authorAvatarUrl || '' };
      existing.count += 1;
      if (!existing.avatar && station.authorAvatarUrl) {
        existing.avatar = station.authorAvatarUrl;
      }
      authorMap.set(name, existing);
    }

    const topConductors: Conductor[] = Array.from(authorMap.entries())
      .map(([name, data]) => ({
        name,
        avatarUrl: data.avatar,
        commitCount: data.count
      }))
      .sort((a, b) => b.commitCount - a.commitCount)
      .slice(0, 5);

    return {
      totalStations,
      expressJunctions,
      daysSpan,
      midnightOilCount,
      midnightOilPercent,
      topConductors
    };
  }

  async fetchJourney(owner: string, repo: string): Promise<Station[]> {
    const cacheKey = `${owner}/${repo}`.toLowerCase();
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const commitsUrl = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=50`;
      const releasesUrl = `https://api.github.com/repos/${owner}/${repo}/releases?per_page=20`;

      const [commitsRes, releasesRes] = await Promise.allSettled([
        fetch(commitsUrl, { headers: { Accept: 'application/vnd.github.v3+json' } }),
        fetch(releasesUrl, { headers: { Accept: 'application/vnd.github.v3+json' } })
      ]);

      if (commitsRes.status !== 'fulfilled' || !commitsRes.value.ok) {
        throw new Error(
          commitsRes.status === 'fulfilled' && commitsRes.value.status === 403
            ? 'RATE_LIMIT_EXCEEDED'
            : 'REPO_NOT_FOUND'
        );
      }

      const commitsData = await commitsRes.value.json();
      let releasesData: any[] = [];
      if (releasesRes.status === 'fulfilled' && releasesRes.value.ok) {
        try {
          releasesData = await releasesRes.value.json();
        } catch {
          releasesData = [];
        }
      }

      // Map releases by commit SHA if available, or tag name
      const releaseTagSet = new Set<string>();
      const releaseBySha = new Map<string, string>();
      if (Array.isArray(releasesData)) {
        for (const rel of releasesData) {
          if (rel.tag_name) releaseTagSet.add(rel.tag_name.toLowerCase());
          if (rel.target_commitish) releaseBySha.set(rel.target_commitish, rel.name || rel.tag_name);
        }
      }

      // Parse commits into stations (chronological order: oldest first)
      const rawCommits = Array.isArray(commitsData) ? [...commitsData].reverse() : [];
      if (rawCommits.length === 0) {
        throw new Error('NO_COMMITS_FOUND');
      }

      const stations: Station[] = rawCommits.map((item: any, index: number) => {
        const sha = item.sha || `sha-${index}`;
        const shortSha = sha.substring(0, 7);
        const commitObj = item.commit || {};
        const authorObj = commitObj.author || {};
        const fullMessage = commitObj.message || 'No commit message';
        const summary = fullMessage.split('\n')[0].substring(0, 75);
        const dateStr = authorObj.date || new Date().toISOString();
        const dateObj = new Date(dateStr);
        const hour = dateObj.getHours();
        const isMidnightOil = hour >= 0 && hour < 5;

        // Determine if this is a release
        const isRelease = releaseBySha.has(sha) ||
          summary.toLowerCase().includes('release') ||
          summary.toLowerCase().includes('v1.') ||
          summary.toLowerCase().includes('v2.') ||
          summary.toLowerCase().includes('bump version');

        const releaseTagName = releaseBySha.get(sha) || (isRelease ? summary.match(/v?\d+\.\d+\.\d+/)?.[0] || 'Release' : undefined);

        let stationType: 'origin' | 'waypoint' | 'express' | 'terminus' = 'waypoint';
        if (index === 0) stationType = 'origin';
        else if (index === rawCommits.length - 1) stationType = 'terminus';
        else if (isRelease) stationType = 'express';

        return {
          id: sha,
          shortSha,
          message: fullMessage,
          summary,
          authorName: authorObj.name || item.author?.login || 'Conductor',
          authorEmail: authorObj.email || '',
          authorAvatarUrl: item.author?.avatar_url || '',
          date: dateStr,
          isRelease,
          releaseTagName,
          isMidnightOil,
          stationType,
          htmlUrl: item.html_url || `https://github.com/${owner}/${repo}/commit/${sha}`
        };
      });

      this.cache.set(cacheKey, stations);
      return stations;
    } catch (err: any) {
      if (err.message === 'RATE_LIMIT_EXCEEDED') {
        throw err;
      }
      throw err;
    }
  }

  getMockDemoJourney(): Station[] {
    const demoData = [
      {
        sha: 'a1b2c3d4e5f6',
        summary: '🎉 Initial commit: The journey begins',
        message: '🎉 Initial commit: The journey begins\n\nScaffolded project repository, established build system, and initialized transit routes.',
        author: 'Ada Lovelace',
        email: 'ada@gitjourney.dev',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
        date: '2026-03-01T09:15:00Z',
        isRelease: false,
        stationType: 'origin' as const
      },
      {
        sha: 'b2c3d4e5f6a1',
        summary: 'feat(engine): Implement SVG dynamic rail track rendering',
        message: 'feat(engine): Implement SVG dynamic rail track rendering\n\nCalculated bezier splines connecting stations with responsive coordinate scaling.',
        author: 'Alan Turing',
        email: 'alan@gitjourney.dev',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        date: '2026-03-03T14:22:00Z',
        isRelease: false,
        stationType: 'waypoint' as const
      },
      {
        sha: 'c3d4e5f6a1b2',
        summary: 'fix(audio): Eliminate Web Audio clicks with exponential ramp',
        message: 'fix(audio): Eliminate Web Audio clicks with exponential ramp\n\nSmooth out audio buffer transitions for procedural train click-clack.',
        author: 'Grace Hopper',
        email: 'grace@gitjourney.dev',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face',
        date: '2026-03-05T01:40:00Z', // Midnight oil!
        isRelease: false,
        stationType: 'waypoint' as const
      },
      {
        sha: 'd4e5f6a1b2c3',
        summary: '🔖 Release v0.1.0: First steam engine test run',
        message: '🔖 Release v0.1.0: First steam engine test run\n\nIncludes SVG track canvas, basic commit parser, and initial milestone chimes.',
        author: 'Ada Lovelace',
        email: 'ada@gitjourney.dev',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
        date: '2026-03-08T18:00:00Z',
        isRelease: true,
        releaseTagName: 'v0.1.0',
        stationType: 'express' as const
      },
      {
        sha: 'e5f6a1b2c3d4',
        summary: 'perf(parser): Offload large JSON commit parsing to Web Worker',
        message: 'perf(parser): Offload large JSON commit parsing to Web Worker\n\nEnsures smooth 60fps animations even when parsing 100+ commits.',
        author: 'Linus Torvalds',
        email: 'linus@gitjourney.dev',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
        date: '2026-03-12T11:05:00Z',
        isRelease: false,
        stationType: 'waypoint' as const
      },
      {
        sha: 'f6a1b2c3d4e5',
        summary: 'style(ui): Vintage boarding pass ticket modal with brass aesthetic',
        message: 'style(ui): Vintage boarding pass ticket modal with brass aesthetic\n\nDesigned tactile ticket inspection view with perforated edge styling and copy-hash button.',
        author: 'Grace Hopper',
        email: 'grace@gitjourney.dev',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face',
        date: '2026-03-15T03:15:00Z', // Midnight oil!
        isRelease: false,
        stationType: 'waypoint' as const
      },
      {
        sha: 'a2b3c4d5e6f7',
        summary: 'feat(audio): Procedural train whistle with dual oscillator detune',
        message: 'feat(audio): Procedural train whistle with dual oscillator detune\n\nCrafted rich vintage train whistle using native Web Audio API oscillators.',
        author: 'Alan Turing',
        email: 'alan@gitjourney.dev',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        date: '2026-03-18T16:45:00Z',
        isRelease: false,
        stationType: 'waypoint' as const
      },
      {
        sha: 'b3c4d5e6f7a2',
        summary: '🔖 Release v0.5.0: The Golden Line Milestone',
        message: '🔖 Release v0.5.0: The Golden Line Milestone\n\nAdded train scrubber playback controls (1x, 2x, 4x) and auto-panning viewport.',
        author: 'Ada Lovelace',
        email: 'ada@gitjourney.dev',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
        date: '2026-03-22T20:10:00Z',
        isRelease: true,
        releaseTagName: 'v0.5.0',
        stationType: 'express' as const
      },
      {
        sha: 'c4d5e6f7a2b3',
        summary: 'fix(a11y): High contrast keyboard navigation along railway line',
        message: 'fix(a11y): High contrast keyboard navigation along railway line\n\nFull keyboard arrow keys support to step through stations without mouse.',
        author: 'Grace Hopper',
        email: 'grace@gitjourney.dev',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face',
        date: '2026-03-25T13:30:00Z',
        isRelease: false,
        stationType: 'waypoint' as const
      },
      {
        sha: 'd5e6f7a2b3c4',
        summary: 'feat(fx): Canvas confetti explosion upon reaching terminus station',
        message: 'feat(fx): Canvas confetti explosion upon reaching terminus station\n\nCelebrate the completion of the railway journey with multi-colored particle physics.',
        author: 'Alan Turing',
        email: 'alan@gitjourney.dev',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        date: '2026-03-28T02:50:00Z', // Midnight oil!
        isRelease: false,
        stationType: 'waypoint' as const
      },
      {
        sha: 'e6f7a2b3c4d5',
        summary: 'test(vitest): Comprehensive flow-first automation test coverage',
        message: 'test(vitest): Comprehensive flow-first automation test coverage\n\nVerified happy flows, negative flows, and rate limit edge cases with 100% green suite.',
        author: 'Linus Torvalds',
        email: 'linus@gitjourney.dev',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
        date: '2026-04-01T15:20:00Z',
        isRelease: false,
        stationType: 'waypoint' as const
      },
      {
        sha: 'f7a2b3c4d5e6',
        summary: '🔖 Release v1.0.0: Grand Central Station Inauguration',
        message: '🔖 Release v1.0.0: Grand Central Station Inauguration\n\nOfficial production release with offline demo fallback, rate limit resilience, and responsive design.',
        author: 'Ada Lovelace',
        email: 'ada@gitjourney.dev',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
        date: '2026-04-05T19:00:00Z',
        isRelease: true,
        releaseTagName: 'v1.0.0',
        stationType: 'express' as const
      },
      {
        sha: '0a1b2c3d4e5f',
        summary: 'docs: Publish interactive showcase and developer portfolio link',
        message: 'docs: Publish interactive showcase and developer portfolio link\n\nDocumented architecture contract, Web Audio graph, and Vitest test suite.',
        author: 'Grace Hopper',
        email: 'grace@gitjourney.dev',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face',
        date: '2026-04-08T11:45:00Z',
        isRelease: false,
        stationType: 'waypoint' as const
      },
      {
        sha: '1b2c3d4e5f6a',
        summary: 'feat(metrics): Midnight oil index and conductor leaderboards',
        message: 'feat(metrics): Midnight oil index and conductor leaderboards\n\nDisplay total stations, express junctions, and late night commit ratios in header bar.',
        author: 'Alan Turing',
        email: 'alan@gitjourney.dev',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        date: '2026-04-12T17:15:00Z',
        isRelease: false,
        stationType: 'waypoint' as const
      },
      {
        sha: '2c3d4e5f6a1b',
        summary: '🚀 Terminus Head: All aboard the GitJourney Express!',
        message: '🚀 Terminus Head: All aboard the GitJourney Express!\n\nCurrent repository head. Fully equipped with audio, visual timeline, and inspector boarding passes.',
        author: 'Ada Lovelace',
        email: 'ada@gitjourney.dev',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
        date: '2026-04-15T12:00:00Z',
        isRelease: false,
        stationType: 'terminus' as const
      }
    ];

    return demoData.map(item => {
      const dateObj = new Date(item.date);
      const hour = dateObj.getHours();
      const isMidnightOil = hour >= 0 && hour < 5;

      return {
        id: item.sha,
        shortSha: item.sha.substring(0, 7),
        message: item.message,
        summary: item.summary,
        authorName: item.author,
        authorEmail: item.email,
        authorAvatarUrl: item.avatar,
        date: item.date,
        isRelease: item.isRelease,
        releaseTagName: (item as any).releaseTagName,
        isMidnightOil,
        stationType: item.stationType,
        htmlUrl: `https://github.com/gitjourney/showcase/commit/${item.sha}`
      };
    });
  }
}
