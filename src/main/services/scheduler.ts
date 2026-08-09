import { EventEmitter } from 'events';
import type { ScanOptions } from '@shared/types';

export class Scheduler extends EventEmitter {
  private timer: NodeJS.Timeout | null = null;

  start(intervalMs: number, options: ScanOptions): void {
    this.timer = setInterval(() => {
      this.emit('scan-due', options);
    }, intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  get isRunning(): boolean {
    return this.timer !== null;
  }
}

export function createScheduler(): Scheduler {
  return new Scheduler();
}
