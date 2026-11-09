export interface Station {
  id: string; // Commit SHA
  shortSha: string;
  message: string;
  summary: string;
  authorName: string;
  authorEmail: string;
  authorAvatarUrl: string;
  date: string; // ISO format
  isRelease: boolean;
  releaseTagName?: string;
  isMidnightOil: boolean;
  stationType: 'origin' | 'waypoint' | 'express' | 'terminus';
  x?: number;
  y?: number;
  htmlUrl: string;
}

export interface Conductor {
  name: string;
  avatarUrl: string;
  commitCount: number;
}

export interface JourneyMetrics {
  totalStations: number;
  expressJunctions: number;
  daysSpan: number;
  midnightOilCount: number;
  midnightOilPercent: number;
  topConductors: Conductor[];
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
}

export type PlaybackSpeed = 1 | 2 | 4;
