import { describe, it, expect, beforeEach } from 'vitest';
import { RepoInputComponent } from './repo-input.component';

describe('RepoInputComponent (TDD Specification)', () => {
  let component: RepoInputComponent;

  beforeEach(() => {
    component = new RepoInputComponent();
  });

  describe('VR-001, HF-001: Input Submission and Parsing', () => {
    it('should emit loadRepo when a valid owner/repo is submitted', () => {
      let emittedValue: string | null = null;
      component.loadRepo.subscribe((val: string) => {
        emittedValue = val;
      });

      component.repoInput = 'angular/angular';
      component.onSubmit();

      expect(emittedValue).toBe('angular/angular');
      expect(component.errorMessage).toBeNull();
    });

    it('should sanitize full GitHub URLs before emitting', () => {
      let emittedValue: string | null = null;
      component.loadRepo.subscribe((val: string) => {
        emittedValue = val;
      });

      component.repoInput = 'https://github.com/facebook/react';
      component.onSubmit();

      expect(emittedValue).toBe('facebook/react');
      expect(component.errorMessage).toBeNull();
    });

    it('should show error and not emit when format is invalid (NF-001)', () => {
      let emitted = false;
      component.loadRepo.subscribe(() => {
        emitted = true;
      });

      component.repoInput = 'invalid_format_here';
      component.onSubmit();

      expect(emitted).toBe(false);
      expect(component.errorMessage).toContain("owner/repo");
    });
  });

  describe('HF-002: Preset Chips', () => {
    it('should select preset and emit loadRepo', () => {
      let emittedValue: string | null = null;
      component.loadRepo.subscribe((val: string) => {
        emittedValue = val;
      });

      component.selectPreset('vuejs/core');

      expect(component.repoInput).toBe('vuejs/core');
      expect(emittedValue).toBe('vuejs/core');
      expect(component.errorMessage).toBeNull();
    });
  });

  describe('RR-002: Demo Journey Trigger', () => {
    it('should emit loadDemo when demo button is triggered', () => {
      let demoEmitted = false;
      component.loadDemo.subscribe(() => {
        demoEmitted = true;
      });

      component.onTriggerDemo();
      expect(demoEmitted).toBe(true);
      expect(component.errorMessage).toBeNull();
    });
  });
});
