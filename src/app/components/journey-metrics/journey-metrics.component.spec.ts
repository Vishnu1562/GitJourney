import { describe, it, expect, beforeEach } from 'vitest';
import { JourneyMetricsComponent } from './journey-metrics.component';
import { JourneyMetrics } from '../../models/git-journey.model';

describe('JourneyMetricsComponent (TDD Specification)', () => {
  let component: JourneyMetricsComponent;

  beforeEach(() => {
    component = new JourneyMetricsComponent();
  });

  it('should initialize with null metrics gracefully without errors', () => {
    expect(component.metrics).toBeNull();
  });

  it('should format midnight oil index with badge color helper', () => {
    const metrics: JourneyMetrics = {
      totalStations: 50,
      expressJunctions: 4,
      daysSpan: 120,
      midnightOilCount: 15,
      midnightOilPercent: 30,
      topConductors: [
        { name: 'Alice', avatarUrl: '', commitCount: 30 },
        { name: 'Bob', avatarUrl: '', commitCount: 20 }
      ]
    };

    component.metrics = metrics;
    expect(component.getMidnightOilLevel()).toBe('high'); // >= 25% is high
  });

  it('should return low or moderate midnight oil level correctly', () => {
    const lowMetrics: JourneyMetrics = {
      totalStations: 100,
      expressJunctions: 1,
      daysSpan: 10,
      midnightOilCount: 5,
      midnightOilPercent: 5,
      topConductors: []
    };
    component.metrics = lowMetrics;
    expect(component.getMidnightOilLevel()).toBe('low');
  });
});
