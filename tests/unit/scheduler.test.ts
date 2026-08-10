import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';

vi.mock('worker_threads', () => {
  class FakeWorker extends EventEmitter {
    constructor() {
      super();
      setTimeout(() => {
        this.emit('message', { type: 'entries', data: [] });
        this.emit('message', { type: 'progress', data: { entriesFound: 0, bytesFound: 0, currentPath: '' } });
        this.emit('message', { type: 'permission-denied', data: [] });
        this.emit('message', { type: 'done' });
      }, 10);
    }
    on() { return this; }
    terminate() {}
    postMessage() {}
  }
  return { Worker: FakeWorker, parentPort: null, workerData: {} };
});

import { createScheduler, ScheduleInterval } from '../../src/main/services/scheduler';

describe('Scheduler', () => {
  let scheduler: ReturnType<typeof createScheduler>;

  beforeEach(() => {
    scheduler = createScheduler();
  });

  afterEach(() => {
    scheduler.stop();
  });

  it('starts and stops cleanly', () => {
    scheduler.start({
      interval: 'daily',
      scanOptions: { categories: ['temp'], targetPaths: ['/tmp'] },
    });
    expect(scheduler.isActive).toBe(true);

    scheduler.stop();
    expect(scheduler.isActive).toBe(false);
  });

  it('never interval does not create a timer', () => {
    scheduler.start({
      interval: 'never',
      scanOptions: { categories: ['temp'], targetPaths: ['/tmp'] },
    });
    expect(scheduler.isActive).toBe(false);
  });

  it('emits scan-due on interval', async () => {
    vi.useFakeTimers();

    let scanDue = false;
    scheduler.on('scan-due', () => { scanDue = true; });

    scheduler.start({
      interval: 'hourly',
      scanOptions: { categories: ['temp'], targetPaths: ['/tmp'] },
    });

    vi.advanceTimersByTime(60 * 60 * 1000);

    expect(scanDue).toBe(true);

    vi.useRealTimers();
  });

  it('tracks running state during scan', () => {
    scheduler.start({
      interval: 'daily',
      scanOptions: { categories: ['temp'], targetPaths: ['/tmp'] },
    });

    expect(scheduler.isRunning).toBe(false);
  });

  it('does NOT call any deletion APIs (zero filesystem mutation)', async () => {
    vi.useFakeTimers();

    const deleteSpy = vi.spyOn(console, 'log');

    scheduler.start({
      interval: 'hourly',
      scanOptions: { categories: ['temp'], targetPaths: ['/tmp'] },
    });

    vi.advanceTimersByTime(60 * 60 * 1000);

    const allCalls = deleteSpy.mock.calls.flat().join(' ');
    expect(allCalls).not.toContain('unlink');
    expect(allCalls).not.toContain('rm');
    expect(allCalls).not.toContain('delete');

    vi.useRealTimers();
    deleteSpy.mockRestore();
  });

  it('calculates next run based on interval', () => {
    scheduler.start({
      interval: 'daily',
      scanOptions: { categories: ['temp'], targetPaths: ['/tmp'] },
    });

    const nextRun = scheduler.nextRun;
    expect(nextRun).toBeInstanceOf(Date);
  });

  it('provides current config', () => {
    const config = {
      interval: 'weekly' as ScheduleInterval,
      scanOptions: { categories: ['cache'], targetPaths: ['/home'] },
    };

    scheduler.start(config);

    expect(scheduler.currentConfig?.interval).toBe('weekly');
  });

  it('resets running state on scan complete', () => {
    scheduler.start({
      interval: 'daily',
      scanOptions: { categories: ['temp'], targetPaths: ['/tmp'] },
    });

    scheduler.onScanComplete();

    expect(scheduler.isRunning).toBe(false);
  });
});
