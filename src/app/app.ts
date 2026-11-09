import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GitApiService } from './services/git-api.service';
import { AudioService } from './services/audio.service';
import { JourneyMetrics, PlaybackSpeed, Station } from './models/git-journey.model';
import { RepoInputComponent } from './components/repo-input/repo-input.component';
import { JourneyMetricsComponent } from './components/journey-metrics/journey-metrics.component';
import { StationMapComponent } from './components/station-map/station-map.component';
import { StationInspectorComponent } from './components/station-inspector/station-inspector.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RepoInputComponent,
    JourneyMetricsComponent,
    StationMapComponent,
    StationInspectorComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent implements OnInit {
  currentRepo = signal<string>('gitjourney/showcase');
  stations = signal<Station[]>([]);
  metrics = signal<JourneyMetrics | null>(null);
  activeStationIndex = signal<number>(0);
  selectedStation = signal<Station | null>(null);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  rateLimitNotice = signal<string | null>(null);
  audioMuted = signal<boolean>(false);
  isPlaying = signal<boolean>(false);
  playbackSpeed = signal<PlaybackSpeed>(1);

  constructor(
    private gitApi: GitApiService,
    private audioService: AudioService
  ) {}

  ngOnInit(): void {
    this.audioMuted.set(this.audioService.isMuted());
    this.loadDemoShowcase();
  }

  loadDemoShowcase(): void {
    this.isLoading.set(false);
    this.errorMessage.set(null);
    this.rateLimitNotice.set(null);
    this.currentRepo.set('gitjourney/showcase');

    const demo = this.gitApi.getMockDemoJourney();
    this.stations.set(demo);
    this.metrics.set(this.gitApi.computeMetrics(demo));
    this.activeStationIndex.set(0);
  }

  async loadRepo(repoSlug: string): Promise<void> {
    const parsed = this.gitApi.parseRepoInput(repoSlug);
    if (!parsed) {
      this.errorMessage.set("Invalid repository format. Please provide 'owner/repo'.");
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.rateLimitNotice.set(null);
    this.currentRepo.set(`${parsed.owner}/${parsed.repo}`);

    try {
      const fetched = await this.gitApi.fetchJourney(parsed.owner, parsed.repo);
      this.stations.set(fetched);
      this.metrics.set(this.gitApi.computeMetrics(fetched));
      this.activeStationIndex.set(0);
      this.audioService.playWhistle();
    } catch (err: any) {
      if (err.message === 'RATE_LIMIT_EXCEEDED') {
        this.rateLimitNotice.set(
          'GitHub API unauthenticated hourly rate limit (60 requests) reached. Loaded our curated demo showcase!'
        );
        const demo = this.gitApi.getMockDemoJourney();
        this.stations.set(demo);
        this.metrics.set(this.gitApi.computeMetrics(demo));
        this.activeStationIndex.set(0);
      } else {
        this.errorMessage.set(
          `Unable to load '${repoSlug}'. Repository not found or empty. You can still explore our curated route below!`
        );
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleAudio(): void {
    const nextState = this.audioService.toggleMute();
    this.audioMuted.set(nextState);
  }

  onStationSelected(station: Station): void {
    this.selectedStation.set(station);
    this.audioService.playStationChime();
  }

  onCloseInspector(): void {
    this.selectedStation.set(null);
  }

  onNextStation(): void {
    const currentList = this.stations();
    const currIdx = this.activeStationIndex();
    if (currIdx < currentList.length - 1) {
      const nextIdx = currIdx + 1;
      this.activeStationIndex.set(nextIdx);
      this.selectedStation.set(currentList[nextIdx]);
      this.audioService.playTrackClick();
    }
  }

  onPrevStation(): void {
    const currentList = this.stations();
    const currIdx = this.activeStationIndex();
    if (currIdx > 0) {
      const prevIdx = currIdx - 1;
      this.activeStationIndex.set(prevIdx);
      this.selectedStation.set(currentList[prevIdx]);
      this.audioService.playTrackClick();
    }
  }

  onStationArrive(station: Station): void {
    if (station.isRelease) {
      this.audioService.playFanfare();
    } else {
      this.audioService.playTrackClick();
    }
  }

  onJourneyComplete(): void {
    this.audioService.playFanfare();
  }

  onTogglePlay(): void {
    if (!this.isPlaying()) {
      this.audioService.playWhistle();
    }
  }
}
