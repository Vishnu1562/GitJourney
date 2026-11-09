import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JourneyMetrics } from '../../models/git-journey.model';

@Component({
  selector: 'app-journey-metrics',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (metrics) {
      <div class="metrics-panel animate-fade-in">
        <div class="metrics-grid">
          <!-- Total Stations -->
          <div class="metric-card">
            <div class="card-icon-wrapper station-color">
              <span class="card-icon">🚉</span>
            </div>
            <div class="metric-data">
              <span class="metric-label">TOTAL STATIONS</span>
              <span class="metric-value">{{ metrics.totalStations }}</span>
              <span class="metric-desc">Commits tracked</span>
            </div>
          </div>

          <!-- Express Junctions -->
          <div class="metric-card">
            <div class="card-icon-wrapper express-color">
              <span class="card-icon">⚡</span>
            </div>
            <div class="metric-data">
              <span class="metric-label">EXPRESS JUNCTIONS</span>
              <span class="metric-value">{{ metrics.expressJunctions }}</span>
              <span class="metric-desc">Tagged releases & milestones</span>
            </div>
          </div>

          <!-- Journey Duration -->
          <div class="metric-card">
            <div class="card-icon-wrapper time-color">
              <span class="card-icon">⏳</span>
            </div>
            <div class="metric-data">
              <span class="metric-label">JOURNEY SPAN</span>
              <span class="metric-value">{{ metrics.daysSpan }} <small>days</small></span>
              <span class="metric-desc">From origin to terminus</span>
            </div>
          </div>

          <!-- Midnight Oil Index -->
          <div class="metric-card" [class.highlight-midnight]="getMidnightOilLevel() === 'high'">
            <div class="card-icon-wrapper midnight-color">
              <span class="card-icon">🌙</span>
            </div>
            <div class="metric-data">
              <div class="metric-label-row">
                <span class="metric-label">MIDNIGHT OIL</span>
                <span class="level-pill" [ngClass]="getMidnightOilLevel()">
                  {{ getMidnightOilLevel() | uppercase }}
                </span>
              </div>
              <span class="metric-value">{{ metrics.midnightOilPercent }}%</span>
              <span class="metric-desc">{{ metrics.midnightOilCount }} commits between 12 AM – 5 AM</span>
            </div>
          </div>
        </div>

        <!-- Top Conductors / Authors -->
        @if (metrics.topConductors && metrics.topConductors.length > 0) {
          <div class="conductors-bar">
            <span class="conductors-title">🎖️ LEAD CONDUCTORS:</span>
            <div class="conductors-list">
              @for (conductor of metrics.topConductors; track conductor.name) {
                <div class="conductor-badge">
                  @if (conductor.avatarUrl) {
                    <img [src]="conductor.avatarUrl" [alt]="conductor.name" class="avatar-img" />
                  } @else {
                    <span class="avatar-placeholder">{{ getInitials(conductor.name) }}</span>
                  }
                  <span class="conductor-name">{{ conductor.name }}</span>
                  <span class="commit-pill">{{ conductor.commitCount }} commits</span>
                </div>
              }
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .metrics-panel {
      background: rgba(28, 25, 23, 0.7);
      border: 1px solid rgba(217, 119, 6, 0.2);
      border-radius: 14px;
      padding: 1.25rem 1.5rem;
      backdrop-filter: blur(8px);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
      margin-bottom: 2rem;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 1rem;
    }

    .metric-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: rgba(41, 37, 36, 0.6);
      border: 1px solid rgba(68, 64, 60, 0.5);
      border-radius: 10px;
      padding: 0.9rem 1.1rem;
      transition: all 0.2s ease;
    }

    .metric-card:hover {
      border-color: rgba(245, 158, 11, 0.4);
      transform: translateY(-1px);
    }

    .card-icon-wrapper {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .station-color {
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.3);
      color: #60a5fa;
    }

    .express-color {
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #f59e0b;
    }

    .time-color {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
    }

    .midnight-color {
      background: rgba(168, 85, 247, 0.15);
      border: 1px solid rgba(168, 85, 247, 0.3);
      color: #c084fc;
    }

    .card-icon {
      font-size: 1.35rem;
    }

    .metric-data {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .metric-label-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .metric-label {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #a8a29e;
    }

    .level-pill {
      font-size: 0.6rem;
      font-weight: 800;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
      letter-spacing: 0.05em;
    }

    .level-pill.high {
      background: rgba(239, 68, 68, 0.2);
      color: #fca5a5;
      border: 1px solid rgba(239, 68, 68, 0.4);
    }

    .level-pill.moderate {
      background: rgba(245, 158, 11, 0.2);
      color: #fde047;
      border: 1px solid rgba(245, 158, 11, 0.4);
    }

    .level-pill.low {
      background: rgba(34, 197, 94, 0.2);
      color: #86efac;
      border: 1px solid rgba(34, 197, 94, 0.4);
    }

    .metric-value {
      font-size: 1.45rem;
      font-weight: 800;
      color: #fafaf9;
      font-family: ui-monospace, SFMono-Regular, monospace;
      line-height: 1.2;
      margin: 0.15rem 0;
    }

    .metric-value small {
      font-size: 0.85rem;
      font-weight: 500;
      color: #a8a29e;
    }

    .metric-desc {
      font-size: 0.72rem;
      color: #78716c;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .conductors-bar {
      margin-top: 1.25rem;
      padding-top: 1rem;
      border-top: 1px dashed rgba(87, 83, 78, 0.5);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem;
    }

    .conductors-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: #d6d3d1;
      letter-spacing: 0.06em;
    }

    .conductors-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .conductor-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(28, 25, 23, 0.9);
      border: 1px solid rgba(120, 113, 108, 0.4);
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      font-size: 0.78rem;
    }

    .avatar-img {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      object-fit: cover;
    }

    .avatar-placeholder {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #78716c;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.65rem;
      font-weight: 700;
    }

    .conductor-name {
      color: #e7e5e4;
      font-weight: 600;
    }

    .commit-pill {
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
      font-size: 0.68rem;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
      font-family: ui-monospace, monospace;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .animate-fade-in {
      animation: fadeIn 0.3s ease-out;
    }
  `]
})
export class JourneyMetricsComponent {
  @Input() metrics: JourneyMetrics | null = null;

  getMidnightOilLevel(): 'low' | 'moderate' | 'high' {
    if (!this.metrics) return 'low';
    const pct = this.metrics.midnightOilPercent;
    if (pct >= 25) return 'high';
    if (pct >= 10) return 'moderate';
    return 'low';
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
}
