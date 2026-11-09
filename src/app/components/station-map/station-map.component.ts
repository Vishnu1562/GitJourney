import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlaybackSpeed, Station } from '../../models/git-journey.model';
import confetti from 'canvas-confetti';

export type StationFilter = 'all' | 'releases' | 'midnight';

@Component({
  selector: 'app-station-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="station-map-container">
      <!-- Controller Header -->
      <div class="map-controls-bar">
        <div class="playback-controls">
          <button
            type="button"
            class="control-btn play-btn"
            (click)="togglePlay()"
            [title]="isPlaying ? 'Pause Train (Space)' : 'Depart & Ride Rails (Space)'"
          >
            @if (isPlaying) {
              <span class="control-icon">⏸</span>
              <span>Halt Train</span>
            } @else {
              <span class="control-icon">🚂</span>
              <span>All Aboard</span>
            }
          </button>

          <button
            type="button"
            class="control-btn step-btn"
            (click)="stepPrev()"
            [disabled]="activeStationIndex <= 0"
            title="Reverse to Previous Station"
          >
            ◀
          </button>

          <button
            type="button"
            class="control-btn step-btn"
            (click)="stepNext()"
            [disabled]="activeStationIndex >= stations.length - 1"
            title="Advance to Next Station"
          >
            ▶
          </button>

          <!-- Speed Multipliers -->
          <div class="speed-toggle-group">
            <button
              type="button"
              class="speed-btn"
              [class.active]="playbackSpeed === 1"
              (click)="setSpeed(1)"
            >
              1x
            </button>
            <button
              type="button"
              class="speed-btn"
              [class.active]="playbackSpeed === 2"
              (click)="setSpeed(2)"
            >
              2x
            </button>
            <button
              type="button"
              class="speed-btn"
              [class.active]="playbackSpeed === 4"
              (click)="setSpeed(4)"
            >
              4x
            </button>
          </div>
        </div>

        <!-- Filter Chips -->
        <div class="filter-group">
          <button
            type="button"
            class="filter-chip"
            [class.active]="currentFilter === 'all'"
            (click)="setFilter('all')"
          >
            All Stations ({{ stations.length }})
          </button>
          <button
            type="button"
            class="filter-chip"
            [class.active]="currentFilter === 'releases'"
            (click)="setFilter('releases')"
          >
            🏷️ Express Releases ({{ countReleases() }})
          </button>
          <button
            type="button"
            class="filter-chip"
            [class.active]="currentFilter === 'midnight'"
            (click)="setFilter('midnight')"
          >
            🌙 Midnight Oil ({{ countMidnight() }})
          </button>
        </div>
      </div>

      <!-- Station Status Ticker -->
      <div class="station-ticker">
        @if (activeStation) {
          <div class="ticker-content">
            <span class="ticker-badge" [ngClass]="activeStation.stationType">
              STATION {{ activeStationIndex + 1 }} OF {{ stations.length }}
            </span>
            <span class="ticker-name">{{ activeStation.summary }}</span>
            <span class="ticker-sha">#{{ activeStation.shortSha }}</span>
            <button
              type="button"
              class="inspect-ticket-chip"
              (click)="onSelectStation(activeStation, activeStationIndex)"
            >
              Inspect Boarding Pass 🎫
            </button>
          </div>
        }
      </div>

      <!-- SVG Railway Track Canvas -->
      <div class="canvas-scroll-wrapper" #scrollContainer>
        <div class="svg-stage" [style.width.px]="canvasWidth">
          <svg
            [attr.viewBox]="'0 0 ' + canvasWidth + ' ' + canvasHeight"
            class="rail-svg"
            preserveAspectRatio="none"
          >
            <defs>
              <!-- Brass metallic gradient for the rails -->
              <linearGradient id="railGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#b45309" />
                <stop offset="50%" stop-color="#f59e0b" />
                <stop offset="100%" stop-color="#d97706" />
              </linearGradient>

              <!-- Completed track glow -->
              <filter id="trackGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            <!-- Base Railroad Bed (Ties / Sleepers) -->
            <path
              [attr.d]="fullTrackPath"
              class="rail-sleepers"
            />

            <!-- Inactive Railroad Tracks (Dark bronze) -->
            <path
              [attr.d]="fullTrackPath"
              class="rail-track-bg"
            />

            <!-- Traveled Railroad Track (Active Neon Gold) -->
            @if (activeTrackPath) {
              <path
                [attr.d]="activeTrackPath"
                class="rail-track-traveled"
                filter="url(#trackGlow)"
              />
            }

            <!-- Station Nodes -->
            @for (st of stationsWithCoords; track st.id; let i = $index) {
              <g
                class="station-node-group"
                [class.active]="i === activeStationIndex"
                [class.is-filtered]="isStationVisible(st)"
                [attr.transform]="'translate(' + st.x + ',' + st.y + ')'"
                (click)="onSelectStation(st, i)"
              >
                <!-- Express Release Glowing Ring -->
                @if (st.isRelease) {
                  <circle
                    r="24"
                    class="release-halo-glow"
                  />
                  <circle
                    r="19"
                    class="release-ring"
                  />
                }

                <!-- Active Station Target Ring -->
                @if (i === activeStationIndex) {
                  <circle
                    r="22"
                    class="active-pulse-ring"
                  />
                }

                <!-- Station Main Dial -->
                <circle
                  [attr.r]="st.stationType === 'origin' || st.stationType === 'terminus' ? 16 : (st.isRelease ? 13 : 9)"
                  class="station-node-body"
                  [ngClass]="st.stationType"
                />

                <!-- Station Inner Dot -->
                <circle
                  [attr.r]="st.isRelease ? 6 : 4"
                  class="station-node-center"
                />

                <!-- Label / Station Badge -->
                <text
                  y="-26"
                  class="station-node-label"
                  text-anchor="middle"
                >
                  @if (st.isRelease) {
                    {{ st.releaseTagName || 'Release' }}
                  } @else if (st.isMidnightOil) {
                    🌙
                  } @else if (st.stationType === 'origin') {
                    Origin
                  } @else if (st.stationType === 'terminus') {
                    Terminus
                  } @else {
                    #{{ st.shortSha }}
                  }
                </text>
              </g>
            }

            <!-- Animated Train Cart -->
            @if (activeStationCoords) {
              <g
                class="train-cart"
                [attr.transform]="'translate(' + activeStationCoords.x + ',' + (activeStationCoords.y - 12) + ')'"
              >
                <!-- Steam Puffs if playing -->
                @if (isPlaying) {
                  <circle cx="-16" cy="-14" r="4" class="steam-puff p1" />
                  <circle cx="-24" cy="-22" r="6" class="steam-puff p2" />
                }

                <!-- Train Silhouette Box -->
                <rect
                  x="-20"
                  y="-18"
                  width="40"
                  height="22"
                  rx="4"
                  class="train-body"
                />
                <!-- Cabin Window -->
                <rect x="-14" y="-14" width="10" height="7" rx="1" class="train-window" />
                <!-- Headlight Beam -->
                <polygon points="20,-10 45,-16 45,-4" class="train-headlight-beam" />
                <!-- Wheels -->
                <circle cx="-11" cy="5" r="4" class="train-wheel" />
                <circle cx="11" cy="5" r="4" class="train-wheel" />
              </g>
            }
          </svg>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .station-map-container {
      background: #141210;
      border: 1px solid rgba(217, 119, 6, 0.25);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 15px 35px -10px rgba(0, 0, 0, 0.7);
      margin-bottom: 2rem;
    }

    .map-controls-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: #1c1917;
      border-bottom: 1px solid rgba(68, 64, 60, 0.5);
    }

    .playback-controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .control-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      border: 1px solid #44403c;
      background: #292524;
      color: #fafaf9;
      padding: 0.45rem 0.85rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .control-btn:hover:not(:disabled) {
      background: #44403c;
      border-color: #f59e0b;
      color: #fbbf24;
    }

    .control-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    .play-btn {
      background: linear-gradient(135deg, #d97706, #b45309);
      border-color: #f59e0b;
      color: #fff;
      padding: 0.5rem 1.1rem;
    }

    .play-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      transform: translateY(-1px);
    }

    .step-btn {
      padding: 0.45rem 0.65rem;
      font-size: 0.8rem;
    }

    .speed-toggle-group {
      display: flex;
      background: #141210;
      border: 1px solid #44403c;
      border-radius: 7px;
      padding: 2px;
      margin-left: 0.4rem;
    }

    .speed-btn {
      background: transparent;
      border: none;
      color: #78716c;
      padding: 0.25rem 0.55rem;
      font-size: 0.72rem;
      font-weight: 700;
      border-radius: 5px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .speed-btn.active {
      background: #d97706;
      color: #fff;
    }

    .filter-group {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }

    .filter-chip {
      background: #292524;
      border: 1px solid #44403c;
      color: #a8a29e;
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }

    .filter-chip:hover {
      border-color: #78716c;
      color: #fafaf9;
    }

    .filter-chip.active {
      background: rgba(217, 119, 6, 0.2);
      border-color: #f59e0b;
      color: #fbbf24;
    }

    .station-ticker {
      background: #171513;
      padding: 0.65rem 1.5rem;
      border-bottom: 1px dashed rgba(68, 64, 60, 0.5);
    }

    .ticker-content {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem;
    }

    .ticker-badge {
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      padding: 0.2rem 0.55rem;
      border-radius: 4px;
      text-transform: uppercase;
      background: #292524;
      color: #d6d3d1;
      border: 1px solid #44403c;
    }

    .ticker-badge.express {
      background: rgba(245, 158, 11, 0.2);
      color: #fbbf24;
      border-color: #f59e0b;
    }

    .ticker-name {
      font-size: 0.95rem;
      font-weight: 700;
      color: #fafaf9;
      font-family: ui-serif, Georgia, serif;
    }

    .ticker-sha {
      font-family: ui-monospace, monospace;
      font-size: 0.8rem;
      color: #a8a29e;
    }

    .inspect-ticket-chip {
      margin-left: auto;
      background: rgba(217, 119, 6, 0.2);
      border: 1px solid rgba(245, 158, 11, 0.5);
      color: #fef3c7;
      padding: 0.3rem 0.75rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s;
    }

    .inspect-ticket-chip:hover {
      background: rgba(217, 119, 6, 0.35);
      border-color: #fbbf24;
      transform: translateY(-1px);
    }

    .canvas-scroll-wrapper {
      width: 100%;
      overflow-x: auto;
      background: radial-gradient(circle at 50% 50%, #1c1917 0%, #0c0a09 100%);
      padding: 2.5rem 1.5rem 3rem;
    }

    .svg-stage {
      margin: 0 auto;
    }

    .rail-svg {
      display: block;
      width: 100%;
      height: 220px;
    }

    .rail-sleepers {
      fill: none;
      stroke: #292524;
      stroke-width: 18;
      stroke-linecap: round;
      stroke-dasharray: 4, 12;
    }

    .rail-track-bg {
      fill: none;
      stroke: #44403c;
      stroke-width: 6;
      stroke-linecap: round;
    }

    .rail-track-traveled {
      fill: none;
      stroke: url(#railGrad);
      stroke-width: 6;
      stroke-linecap: round;
      transition: stroke-dashoffset 0.3s ease;
    }

    .station-node-group {
      cursor: pointer;
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .station-node-group:hover {
      transform: scale(1.15) !important;
    }

    .station-node-body {
      fill: #1c1917;
      stroke: #78716c;
      stroke-width: 3;
      transition: all 0.2s;
    }

    .station-node-group:hover .station-node-body {
      stroke: #f59e0b;
      fill: #292524;
    }

    .station-node-body.origin {
      stroke: #3b82f6;
      stroke-width: 4;
    }

    .station-node-body.terminus {
      stroke: #10b981;
      stroke-width: 4;
    }

    .station-node-body.express {
      stroke: #f59e0b;
      stroke-width: 4;
    }

    .station-node-center {
      fill: #d6d3d1;
      transition: fill 0.2s;
    }

    .station-node-group.active .station-node-center {
      fill: #f59e0b;
    }

    .release-halo-glow {
      fill: rgba(245, 158, 11, 0.12);
      animation: pulseGlow 2s infinite ease-in-out;
    }

    .release-ring {
      fill: none;
      stroke: #f59e0b;
      stroke-width: 1.5;
      stroke-dasharray: 3, 3;
    }

    .active-pulse-ring {
      fill: none;
      stroke: #fbbf24;
      stroke-width: 2.5;
      animation: pulseActive 1.4s infinite ease-out;
    }

    .station-node-label {
      font-size: 11px;
      font-family: ui-monospace, SFMono-Regular, monospace;
      fill: #a8a29e;
      font-weight: 600;
      pointer-events: none;
    }

    .station-node-group.active .station-node-label {
      fill: #fbbf24;
      font-weight: 700;
    }

    /* Train Cart styling */
    .train-cart {
      transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
      pointer-events: none;
    }

    .train-body {
      fill: #d97706;
      stroke: #fef3c7;
      stroke-width: 1.5;
    }

    .train-window {
      fill: #fef08a;
    }

    .train-headlight-beam {
      fill: rgba(254, 240, 138, 0.35);
    }

    .train-wheel {
      fill: #44403c;
      stroke: #a8a29e;
      stroke-width: 1;
    }

    .steam-puff {
      fill: rgba(255, 255, 255, 0.45);
      animation: puff 0.8s infinite ease-out;
    }

    .steam-puff.p2 {
      animation-delay: 0.3s;
    }

    @keyframes puff {
      0% { opacity: 0.7; transform: translate(0, 0) scale(0.6); }
      100% { opacity: 0; transform: translate(-15px, -12px) scale(1.4); }
    }

    @keyframes pulseActive {
      0% { r: 18px; opacity: 1; }
      100% { r: 28px; opacity: 0; }
    }

    @keyframes pulseGlow {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(1.1); }
    }
  `]
})
export class StationMapComponent implements OnChanges, OnDestroy {
  @Input() stations: Station[] = [];
  @Input() activeStationIndex = 0;
  @Input() isPlaying = false;
  @Input() playbackSpeed: PlaybackSpeed = 1;

  @Output() stationSelect = new EventEmitter<Station>();
  @Output() togglePlayEvent = new EventEmitter<void>();
  @Output() speedChange = new EventEmitter<PlaybackSpeed>();
  @Output() journeyComplete = new EventEmitter<void>();
  @Output() stationArrive = new EventEmitter<Station>();

  currentFilter: StationFilter = 'all';

  canvasWidth = 1000;
  canvasHeight = 220;
  fullTrackPath = '';
  activeTrackPath = '';

  stationsWithCoords: (Station & { x: number; y: number })[] = [];

  private timerId: any = null;

  ngOnChanges(): void {
    this.calculateTrackLayout();
    this.updateActivePath();
  }

  ngOnDestroy(): void {
    this.stopPlayback();
  }

  get activeStation(): Station | null {
    if (!this.stations || this.stations.length === 0) return null;
    return this.stations[this.activeStationIndex] || null;
  }

  get activeStationCoords(): { x: number; y: number } | null {
    if (!this.stationsWithCoords || this.stationsWithCoords.length === 0) return null;
    const item = this.stationsWithCoords[this.activeStationIndex];
    return item ? { x: item.x, y: item.y } : null;
  }

  calculateTrackLayout(): void {
    if (!this.stations || this.stations.length === 0) {
      this.stationsWithCoords = [];
      this.fullTrackPath = '';
      this.activeTrackPath = '';
      return;
    }

    const n = this.stations.length;
    const spacing = 80;
    const margin = 80;
    this.canvasWidth = Math.max(900, margin * 2 + (n - 1) * spacing);
    const midY = this.canvasHeight / 2;

    this.stationsWithCoords = this.stations.map((station, i) => {
      const x = n === 1 ? this.canvasWidth / 2 : margin + i * spacing;
      // Gentle sine wave undulation along the route
      const yOffset = Math.sin((i / Math.max(1, n - 1)) * Math.PI * 4) * 28;
      const y = midY + yOffset;
      return {
        ...station,
        x,
        y
      };
    });

    // Build SVG Path
    if (this.stationsWithCoords.length === 1) {
      const single = this.stationsWithCoords[0];
      this.fullTrackPath = `M ${single.x - 30} ${single.y} L ${single.x + 30} ${single.y}`;
    } else {
      let path = `M ${this.stationsWithCoords[0].x} ${this.stationsWithCoords[0].y}`;
      for (let i = 1; i < this.stationsWithCoords.length; i++) {
        const prev = this.stationsWithCoords[i - 1];
        const curr = this.stationsWithCoords[i];
        const cpX = (prev.x + curr.x) / 2;
        path += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
      }
      this.fullTrackPath = path;
    }
  }

  updateActivePath(): void {
    if (!this.stationsWithCoords || this.stationsWithCoords.length === 0) {
      this.activeTrackPath = '';
      return;
    }

    const activeCount = this.activeStationIndex + 1;
    const slice = this.stationsWithCoords.slice(0, activeCount);
    if (slice.length <= 1) {
      this.activeTrackPath = '';
      return;
    }

    let path = `M ${slice[0].x} ${slice[0].y}`;
    for (let i = 1; i < slice.length; i++) {
      const prev = slice[i - 1];
      const curr = slice[i];
      const cpX = (prev.x + curr.x) / 2;
      path += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    this.activeTrackPath = path;
  }

  togglePlay(): void {
    if (this.isPlaying) {
      this.stopPlayback();
    } else {
      this.startPlayback();
    }
    this.togglePlayEvent.emit();
  }

  startPlayback(): void {
    this.stopPlayback();

    // If at terminus, rewind to origin first
    if (this.activeStationIndex >= this.stations.length - 1) {
      this.activeStationIndex = 0;
      this.updateActivePath();
    }

    this.isPlaying = true;
    this.scheduleNextTick();
  }

  stopPlayback(): void {
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private scheduleNextTick(): void {
    if (!this.isPlaying) return;

    // 1x = 1200ms, 2x = 600ms, 4x = 300ms
    const delay = Math.round(1200 / this.playbackSpeed);

    this.timerId = setTimeout(() => {
      if (!this.isPlaying) return;

      if (this.activeStationIndex < this.stations.length - 1) {
        this.activeStationIndex++;
        this.updateActivePath();
        const current = this.stations[this.activeStationIndex];
        this.stationArrive.emit(current);

        if (this.activeStationIndex === this.stations.length - 1) {
          // Terminus reached!
          this.stopPlayback();
          this.triggerConfetti();
          this.journeyComplete.emit();
        } else {
          this.scheduleNextTick();
        }
      } else {
        this.stopPlayback();
      }
    }, delay);
  }

  setSpeed(speed: PlaybackSpeed): void {
    this.playbackSpeed = speed;
    this.speedChange.emit(speed);
    if (this.isPlaying) {
      this.stopPlayback();
      this.startPlayback();
    }
  }

  stepPrev(): void {
    if (this.activeStationIndex > 0) {
      this.activeStationIndex--;
      this.updateActivePath();
      this.stationArrive.emit(this.stations[this.activeStationIndex]);
    }
  }

  stepNext(): void {
    if (this.activeStationIndex < this.stations.length - 1) {
      this.activeStationIndex++;
      this.updateActivePath();
      this.stationArrive.emit(this.stations[this.activeStationIndex]);
      if (this.activeStationIndex === this.stations.length - 1) {
        this.triggerConfetti();
        this.journeyComplete.emit();
      }
    }
  }

  onSelectStation(station: Station, index: number): void {
    this.activeStationIndex = index;
    this.updateActivePath();
    this.stationSelect.emit(station);
    this.stationArrive.emit(station);
  }

  setFilter(filter: StationFilter): void {
    this.currentFilter = filter;
  }

  getVisibleStations(): Station[] {
    if (this.currentFilter === 'releases') {
      return this.stations.filter(s => s.isRelease);
    }
    if (this.currentFilter === 'midnight') {
      return this.stations.filter(s => s.isMidnightOil);
    }
    return this.stations;
  }

  isStationVisible(station: Station): boolean {
    if (this.currentFilter === 'releases') return station.isRelease;
    if (this.currentFilter === 'midnight') return station.isMidnightOil;
    return true;
  }

  countReleases(): number {
    return this.stations.filter(s => s.isRelease).length;
  }

  countMidnight(): number {
    return this.stations.filter(s => s.isMidnightOil).length;
  }

  triggerConfetti(): void {
    try {
      if (typeof window !== 'undefined' && confetti) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#fbbf24', '#d97706', '#10b981', '#3b82f6']
        });
      }
    } catch {
      // Ignore if confetti fails in test env
    }
  }
}
