import { EventEmitter } from 'events';
import type { ScanOptions } from '@shared/types';

export type ScheduleInterval = 'hourly' | 'daily' | 'weekly' | 'never';

export interface SchedulerConfig {
  interval: ScheduleInterval;
  scanOptions: ScanOptions;
  idleThresholdMs?: number;
}

const INTERVAL_MS: Record<ScheduleInterval, number | null> = {
  hourly: 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  never: null,
};

export class Scheduler extends EventEmitter {
  private timer: NodeJS.Timeout | null = null;
  private config: SchedulerConfig | null = null;
  private lastRun: Date | null = null;
  private running = false;

  start(config: SchedulerConfig): void {
    this.stop();
    this.config = config;

    const intervalMs = INTERVAL_MS[config.interval];
    if (!intervalMs) return;

    this.timer = setInterval(() => {
      this.runScan();
    }, intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.running = false;
  }

  private runScan(): void {
    if (this.running || !this.config) return;

    this.running = true;
    this.lastRun = new Date();
    this.emit('scan-due', this.config.scanOptions);
  }

  onScanComplete(): void {
    this.running = false;
    this.emit('scan-complete');
  }

  get isRunning(): boolean {
    return this.running;
  }

  get isActive(): boolean {
    return this.timer !== null;
  }

  get nextRun(): Date | null {
    if (!this.timer || !this.config) return null;
    const intervalMs = INTERVAL_MS[this.config.interval];
    if (!intervalMs) return null;
    const base = this.lastRun ?? new Date();
    return new Date(base.getTime() + intervalMs);
  }

  get currentConfig(): SchedulerConfig | null {
    return this.config;
  }
}

export function createScheduler(): Scheduler {
  return new Scheduler();
}
