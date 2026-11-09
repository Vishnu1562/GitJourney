import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Station } from '../../models/git-journey.model';

@Component({
  selector: 'app-station-inspector',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (station) {
      <div class="modal-backdrop" (click)="onBackdropClick($event)">
        <div class="ticket-container animate-ticket-in" (click)="$event.stopPropagation()">
          <!-- Perforated top stub -->
          <div class="ticket-header">
            <div class="ticket-watermark">
              <span class="watermark-icon">🎫</span>
              <span class="watermark-text">TRANSIT AUTHORITY OF REPOSITORY WAYPOINTS</span>
            </div>
            <button type="button" class="close-x-btn" (click)="onClose()" title="Close Ticket">
              ✕
            </button>
          </div>

          <!-- Main ticket body -->
          <div class="ticket-body">
            <!-- Badges Bar -->
            <div class="badges-row">
              <span class="station-type-badge" [ngClass]="station.stationType">
                {{ getStationTypeLabel() }}
              </span>

              @if (station.isRelease) {
                <span class="release-pill">
                  🏷️ {{ station.releaseTagName || 'RELEASE TAG' }}
                </span>
              }

              @if (station.isMidnightOil) {
                <span class="midnight-pill">
                  🌙 MIDNIGHT OIL (12AM - 5AM)
                </span>
              }
            </div>

            <!-- Station Title -->
            <h2 class="station-summary">{{ station.summary }}</h2>

            <!-- Station Metadata Grid -->
            <div class="station-meta-grid">
              <!-- Conductor -->
              <div class="meta-item">
                <span class="meta-label">STATION MASTER / AUTHOR</span>
                <div class="conductor-row">
                  @if (station.authorAvatarUrl) {
                    <img [src]="station.authorAvatarUrl" [alt]="station.authorName" class="author-avatar" />
                  } @else {
                    <span class="author-placeholder">{{ getInitials(station.authorName) }}</span>
                  }
                  <div class="author-details">
                    <span class="author-name">{{ station.authorName }}</span>
                    @if (station.authorEmail) {
                      <span class="author-email">{{ station.authorEmail }}</span>
                    }
                  </div>
                </div>
              </div>

              <!-- Departure Date -->
              <div class="meta-item">
                <span class="meta-label">DEPARTURE TIMESTAMP</span>
                <div class="timestamp-row">
                  <span class="calendar-icon">📅</span>
                  <div class="timestamp-details">
                    <span class="date-text">{{ formatDate(station.date) }}</span>
                    <span class="time-text">{{ formatTime(station.date) }}</span>
                  </div>
                </div>
              </div>

              <!-- Ticket ID / SHA -->
              <div class="meta-item">
                <span class="meta-label">TICKET REFERENCE / COMMIT SHA</span>
                <div class="sha-box">
                  <span class="sha-code">{{ station.shortSha }}</span>
                  <button type="button" class="copy-btn" (click)="copySha()">
                    @if (copied) {
                      <span class="copied-indicator">✓ Copied!</span>
                    } @else {
                      <span>📋 Copy</span>
                    }
                  </button>
                </div>
              </div>

              <!-- External Action -->
              <div class="meta-item">
                <span class="meta-label">ORIGINAL DISPATCH</span>
                <a
                  [href]="station.htmlUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="github-link-btn"
                >
                  <span>Inspect on GitHub</span>
                  <span class="link-arrow">↗</span>
                </a>
              </div>
            </div>

            <!-- Full Message Accordion / Scroll -->
            @if (station.message && station.message !== station.summary) {
              <div class="full-message-section">
                <span class="section-title">LOGBOOK ENTRY:</span>
                <pre class="logbook-text">{{ station.message }}</pre>
              </div>
            }
          </div>

          <!-- Perforated Tear Line -->
          <div class="ticket-perforation">
            <span class="punch-hole left"></span>
            <div class="dashed-line"></div>
            <span class="punch-hole right"></span>
          </div>

          <!-- Footer Ticket Stub Navigation -->
          <div class="ticket-footer">
            <div class="nav-buttons">
              <button
                type="button"
                class="nav-btn"
                [disabled]="!hasPrev"
                (click)="onPrev()"
              >
                ← Previous Station
              </button>

              <button
                type="button"
                class="nav-btn"
                [disabled]="!hasNext"
                (click)="onNext()"
              >
                Next Station →
              </button>
            </div>

            <button type="button" class="dismiss-btn" (click)="onClose()">
              Stamp & Close Ticket
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(12, 10, 9, 0.85);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      z-index: 1000;
    }

    .ticket-container {
      background: #fdfbf7;
      color: #292524;
      width: 100%;
      max-width: 640px;
      border-radius: 16px;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(180, 83, 9, 0.3);
      position: relative;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    .ticket-header {
      background: #78350f;
      color: #fef3c7;
      padding: 0.85rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #92400e;
    }

    .ticket-watermark {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.1em;
    }

    .close-x-btn {
      background: rgba(0, 0, 0, 0.2);
      border: none;
      color: #fef3c7;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .close-x-btn:hover {
      background: rgba(0, 0, 0, 0.4);
      transform: scale(1.05);
    }

    .ticket-body {
      padding: 1.75rem 2rem 1.25rem;
      max-height: 70vh;
      overflow-y: auto;
    }

    .badges-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .station-type-badge {
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      padding: 0.25rem 0.65rem;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .station-type-badge.origin {
      background: #dbeafe;
      color: #1e40af;
      border: 1px solid #bfdbfe;
    }

    .station-type-badge.express {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
    }

    .station-type-badge.terminus {
      background: #dcfce7;
      color: #166534;
      border: 1px solid #bbf7d0;
    }

    .station-type-badge.waypoint {
      background: #f5f5f4;
      color: #57534e;
      border: 1px solid #e7e5e4;
    }

    .release-pill {
      background: #fef08a;
      color: #854d0e;
      border: 1px solid #fde047;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.25rem 0.65rem;
      border-radius: 4px;
    }

    .midnight-pill {
      background: #f3e8ff;
      color: #6b21a8;
      border: 1px solid #e9d5ff;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.25rem 0.65rem;
      border-radius: 4px;
    }

    .station-summary {
      font-size: 1.4rem;
      font-weight: 800;
      color: #1c1917;
      line-height: 1.35;
      margin: 0 0 1.25rem 0;
      font-family: ui-serif, Georgia, serif;
    }

    .station-meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem 1.5rem;
      margin-bottom: 1.25rem;
    }

    @media (max-width: 500px) {
      .station-meta-grid {
        grid-template-columns: 1fr;
      }
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .meta-label {
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: #78716c;
    }

    .conductor-row {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .author-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
      border: 1px solid #d6d3d1;
    }

    .author-placeholder {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #d6d3d1;
      color: #44403c;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.85rem;
    }

    .author-details {
      display: flex;
      flex-direction: column;
    }

    .author-name {
      font-size: 0.95rem;
      font-weight: 700;
      color: #292524;
    }

    .author-email {
      font-size: 0.72rem;
      color: #78716c;
    }

    .timestamp-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .calendar-icon {
      font-size: 1.1rem;
    }

    .timestamp-details {
      display: flex;
      flex-direction: column;
    }

    .date-text {
      font-size: 0.9rem;
      font-weight: 700;
      color: #292524;
    }

    .time-text {
      font-size: 0.75rem;
      color: #78716c;
      font-family: ui-monospace, monospace;
    }

    .sha-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #f5f5f4;
      border: 1px solid #e7e5e4;
      padding: 0.3rem 0.6rem;
      border-radius: 6px;
      width: fit-content;
    }

    .sha-code {
      font-family: ui-monospace, monospace;
      font-size: 0.88rem;
      font-weight: 700;
      color: #b45309;
    }

    .copy-btn {
      background: transparent;
      border: none;
      color: #57534e;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      transition: background 0.15s;
    }

    .copy-btn:hover {
      background: #e7e5e4;
    }

    .copied-indicator {
      color: #15803d;
      font-weight: 700;
    }

    .github-link-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: #292524;
      color: #fafaf9;
      padding: 0.45rem 0.85rem;
      border-radius: 6px;
      font-size: 0.82rem;
      font-weight: 600;
      text-decoration: none;
      width: fit-content;
      transition: background 0.15s;
    }

    .github-link-btn:hover {
      background: #44403c;
    }

    .link-arrow {
      font-size: 0.9rem;
    }

    .full-message-section {
      margin-top: 1rem;
      padding: 0.85rem 1rem;
      background: #f5f5f4;
      border-left: 3px solid #b45309;
      border-radius: 0 6px 6px 0;
    }

    .section-title {
      display: block;
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: #78716c;
      margin-bottom: 0.4rem;
    }

    .logbook-text {
      font-family: ui-monospace, monospace;
      font-size: 0.8rem;
      color: #44403c;
      white-space: pre-wrap;
      word-break: break-word;
      margin: 0;
      max-height: 120px;
      overflow-y: auto;
    }

    .ticket-perforation {
      position: relative;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
    }

    .punch-hole {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 24px;
      height: 24px;
      background: rgba(12, 10, 9, 0.85);
      border-radius: 50%;
    }

    .punch-hole.left {
      left: -12px;
    }

    .punch-hole.right {
      right: -12px;
    }

    .dashed-line {
      width: 90%;
      border-bottom: 2px dashed #d6d3d1;
    }

    .ticket-footer {
      padding: 1rem 2rem 1.5rem;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      background: #f5f5f4;
      border-top: 1px solid #e7e5e4;
    }

    .nav-buttons {
      display: flex;
      gap: 0.6rem;
    }

    .nav-btn {
      background: #fff;
      border: 1px solid #d6d3d1;
      color: #44403c;
      padding: 0.5rem 0.9rem;
      border-radius: 6px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }

    .nav-btn:hover:not(:disabled) {
      border-color: #b45309;
      color: #b45309;
      background: #fffbeb;
    }

    .nav-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .dismiss-btn {
      background: #b45309;
      color: #fff;
      border: none;
      padding: 0.55rem 1.1rem;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s;
    }

    .dismiss-btn:hover {
      background: #92400e;
    }

    @keyframes ticketIn {
      from {
        opacity: 0;
        transform: scale(0.94) translateY(12px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    .animate-ticket-in {
      animation: ticketIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
  `]
})
export class StationInspectorComponent {
  @Input() station: Station | null = null;
  @Input() hasNext = false;
  @Input() hasPrev = false;

  @Output() close = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
  @Output() prev = new EventEmitter<void>();

  copied = false;

  @HostListener('window:keydown.escape')
  onEscape(): void {
    this.onClose();
  }

  onBackdropClick(event: MouseEvent): void {
    this.onClose();
  }

  onClose(): void {
    this.close.emit();
  }

  onNext(): void {
    if (this.hasNext) {
      this.next.emit();
    }
  }

  onPrev(): void {
    if (this.hasPrev) {
      this.prev.emit();
    }
  }

  async copySha(): Promise<void> {
    if (!this.station) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(this.station.shortSha);
        this.copied = true;
        setTimeout(() => {
          this.copied = false;
        }, 2000);
      }
    } catch {
      // Ignore clipboard write failure
    }
  }

  getStationTypeLabel(): string {
    if (!this.station) return 'STATION';
    switch (this.station.stationType) {
      case 'origin': return 'ORIGIN TERMINAL';
      case 'terminus': return 'TERMINUS HEAD';
      case 'express': return 'EXPRESS JUNCTION';
      default: return 'WAYPOINT STATION';
    }
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  formatDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }

  formatTime(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  }
}
