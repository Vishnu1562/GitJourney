import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StationInspectorComponent } from './station-inspector.component';
import { Station } from '../../models/git-journey.model';

describe('StationInspectorComponent (TDD Specification)', () => {
  let component: StationInspectorComponent;

  const mockStation: Station = {
    id: 'f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1',
    shortSha: 'f6a1b2c',
    message: 'style(ui): Vintage boarding pass ticket modal\n\nPerforated edges and brass styling.',
    summary: 'style(ui): Vintage boarding pass ticket modal',
    authorName: 'Grace Hopper',
    authorEmail: 'grace@example.com',
    authorAvatarUrl: '',
    date: '2026-03-15T03:15:00Z',
    isRelease: true,
    releaseTagName: 'v0.5.0',
    isMidnightOil: true,
    stationType: 'express',
    htmlUrl: 'https://github.com/test/repo/commit/f6a1b2c'
  };

  beforeEach(() => {
    component = new StationInspectorComponent();
  });

  describe('HF-006: Copy Commit SHA to Clipboard', () => {
    it('should copy SHA and set copied state temporarily', async () => {
      // Mock navigator.clipboard
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock
        }
      });

      component.station = mockStation;
      await component.copySha();

      expect(writeTextMock).toHaveBeenCalledWith('f6a1b2c');
      expect(component.copied).toBe(true);
    });
  });

  describe('HF-007: Navigation & Close Emits', () => {
    it('should emit next event when onNext is called', () => {
      let nextEmitted = false;
      component.next.subscribe(() => {
        nextEmitted = true;
      });

      component.hasNext = true;
      component.onNext();
      expect(nextEmitted).toBe(true);
    });

    it('should not emit next event when hasNext is false', () => {
      let nextEmitted = false;
      component.next.subscribe(() => {
        nextEmitted = true;
      });

      component.hasNext = false;
      component.onNext();
      expect(nextEmitted).toBe(false);
    });

    it('should emit prev event when onPrev is called', () => {
      let prevEmitted = false;
      component.prev.subscribe(() => {
        prevEmitted = true;
      });

      component.hasPrev = true;
      component.onPrev();
      expect(prevEmitted).toBe(true);
    });

    it('should emit close event when onClose is called', () => {
      let closeEmitted = false;
      component.close.subscribe(() => {
        closeEmitted = true;
      });

      component.onClose();
      expect(closeEmitted).toBe(true);
    });
  });

  describe('EC-003: Author Initials Fallback', () => {
    it('should compute two-letter initials correctly', () => {
      expect(component.getInitials('Grace Hopper')).toBe('GH');
      expect(component.getInitials('Linus')).toBe('LI');
      expect(component.getInitials('')).toBe('?');
    });
  });
});
