import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-repo-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="repo-input-card">
      <div class="header-badge">
        <span class="badge-icon">🚂</span>
        <span class="badge-text">CENTRAL STATION DISPATCH</span>
      </div>

      <h1 class="title">Turn Any GitHub Repo Into an Interactive Transit Map</h1>
      <p class="subtitle">
        Enter a public repository to trace its releases, midnight coding sprees, and commit milestones along an animated vintage rail line.
      </p>

      <form (ngSubmit)="onSubmit()" class="search-form">
        <div class="input-wrapper" [class.has-error]="errorMessage">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            [(ngModel)]="repoInput"
            name="repoInput"
            placeholder="e.g. angular/angular or github.com/owner/repo"
            class="repo-text-input"
            [disabled]="loading"
            autocomplete="off"
            spellcheck="false"
          />
          <button
            type="submit"
            class="submit-btn"
            [disabled]="loading || !repoInput.trim()"
          >
            @if (loading) {
              <span class="spinner"></span>
              <span>Charting Track...</span>
            } @else {
              <span>All Aboard</span>
              <span class="arrow-icon">➔</span>
            }
          </button>
        </div>
      </form>

      @if (errorMessage) {
        <div class="error-banner animate-fade-in">
          <span class="error-icon">⚠️</span>
          <span>{{ errorMessage }}</span>
        </div>
      }

      <div class="presets-section">
        <span class="preset-label">POPULAR EXPRESS ROUTES:</span>
        <div class="chips-container">
          @for (preset of presets; track preset) {
            <button
              type="button"
              class="preset-chip"
              (click)="selectPreset(preset)"
              [disabled]="loading"
            >
              <span class="chip-dot"></span>
              {{ preset }}
            </button>
          }
          <button
            type="button"
            class="demo-chip"
            (click)="onTriggerDemo()"
            [disabled]="loading"
          >
            <span class="chip-star">✨</span>
            Curated GitJourney Showcase
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .repo-input-card {
      background: linear-gradient(135deg, rgba(28, 25, 23, 0.95), rgba(41, 37, 36, 0.95));
      border: 1px solid rgba(217, 119, 6, 0.25);
      border-radius: 16px;
      padding: 2.25rem 2rem;
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.6), 0 0 25px rgba(217, 119, 6, 0.1);
      backdrop-filter: blur(12px);
      color: #fafaf9;
      position: relative;
      overflow: hidden;
    }

    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(217, 119, 6, 0.15);
      border: 1px solid rgba(217, 119, 6, 0.4);
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: #f59e0b;
      margin-bottom: 1.25rem;
    }

    .title {
      font-size: 2.1rem;
      font-weight: 800;
      line-height: 1.2;
      margin: 0 0 0.75rem 0;
      background: linear-gradient(to right, #fef3c7, #f59e0b, #d97706);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
      letter-spacing: -0.02em;
    }

    .subtitle {
      font-size: 1rem;
      color: #a8a29e;
      margin: 0 0 1.75rem 0;
      line-height: 1.6;
      max-width: 680px;
    }

    .search-form {
      margin-bottom: 1.5rem;
    }

    .input-wrapper {
      display: flex;
      align-items: center;
      background: #1c1917;
      border: 2px solid #44403c;
      border-radius: 12px;
      padding: 0.35rem 0.5rem 0.35rem 1rem;
      transition: all 0.2s ease;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4);
    }

    .input-wrapper:focus-within {
      border-color: #f59e0b;
      box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.15), inset 0 2px 4px rgba(0, 0, 0, 0.4);
    }

    .input-wrapper.has-error {
      border-color: #ef4444;
      box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.15);
    }

    .search-icon {
      font-size: 1.1rem;
      margin-right: 0.75rem;
      opacity: 0.6;
    }

    .repo-text-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: #fafaf9;
      font-size: 1.05rem;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      padding: 0.6rem 0;
    }

    .repo-text-input::placeholder {
      color: #78716c;
      font-family: inherit;
    }

    .submit-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: linear-gradient(135deg, #d97706, #b45309);
      color: #fff;
      border: 1px solid #f59e0b;
      border-radius: 9px;
      padding: 0.75rem 1.4rem;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(180, 83, 9, 0.35);
    }

    .submit-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(245, 158, 11, 0.45);
    }

    .submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .arrow-icon {
      font-size: 1.1rem;
      transition: transform 0.2s ease;
    }

    .submit-btn:hover .arrow-icon {
      transform: translateX(3px);
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
    }

    .presets-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .preset-label {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: #78716c;
    }

    .chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
    }

    .preset-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(41, 37, 36, 0.8);
      border: 1px solid #44403c;
      color: #d6d3d1;
      padding: 0.4rem 0.85rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-family: ui-monospace, SFMono-Regular, monospace;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .preset-chip:hover:not(:disabled) {
      background: rgba(68, 64, 60, 0.8);
      border-color: #f59e0b;
      color: #fbbf24;
      transform: translateY(-1px);
    }

    .chip-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #f59e0b;
    }

    .demo-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: linear-gradient(135deg, rgba(217, 119, 6, 0.2), rgba(180, 83, 9, 0.2));
      border: 1px solid rgba(245, 158, 11, 0.4);
      color: #fef3c7;
      padding: 0.4rem 0.9rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .demo-chip:hover:not(:disabled) {
      background: linear-gradient(135deg, rgba(217, 119, 6, 0.35), rgba(180, 83, 9, 0.35));
      border-color: #fbbf24;
      transform: translateY(-1px);
    }

    .spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: #fff;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .animate-fade-in {
      animation: fadeIn 0.25s ease-out;
    }
  `]
})
export class RepoInputComponent {
  repoInput = '';
  errorMessage: string | null = null;

  @Input() loading = false;
  @Output() loadRepo = new EventEmitter<string>();
  @Output() loadDemo = new EventEmitter<void>();

  presets: string[] = [
    'angular/angular',
    'facebook/react',
    'vuejs/core',
    'twbs/bootstrap',
    'torvalds/linux'
  ];

  onSubmit(): void {
    const cleaned = this.cleanRepoString(this.repoInput);
    if (!cleaned) {
      this.errorMessage = "Please enter in 'owner/repo' format (e.g., angular/angular) or a valid GitHub repository URL.";
      return;
    }

    this.errorMessage = null;
    this.loadRepo.emit(cleaned);
  }

  selectPreset(preset: string): void {
    this.repoInput = preset;
    this.errorMessage = null;
    this.loadRepo.emit(preset);
  }

  onTriggerDemo(): void {
    this.errorMessage = null;
    this.loadDemo.emit();
  }

  private cleanRepoString(input: string): string | null {
    if (!input || typeof input !== 'string') return null;
    const trimmed = input.trim();
    if (!trimmed) return null;

    let str = trimmed
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .replace(/^github\.com\//i, '')
      .replace(/\.git$/i, '')
      .replace(/\/+$/, '');

    const parts = str.split('/');
    if (parts.length !== 2) return null;

    const [owner, repo] = parts;
    if (!/^[a-zA-Z0-9_.-]+$/.test(owner) || !/^[a-zA-Z0-9_.-]+$/.test(repo)) {
      return null;
    }

    return `${owner}/${repo}`;
  }
}
