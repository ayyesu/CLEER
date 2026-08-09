import { EventEmitter } from 'events';
import { Worker } from 'worker_threads';
import { resolve } from 'path';
import type { ScanEntry, ScanOptions } from '@shared/types';

export class ScannerEngine extends EventEmitter {
  private workers: Map<string, Worker> = new Map();

  async start(options: ScanOptions): Promise<void> {
    for (const category of options.categories) {
      const workerPath = resolve(__dirname, '../workers/scanWorker.js');
      const worker = new Worker(workerPath, {
        workerData: { category, targetPaths: options.targetPaths, options },
      });

      worker.on('message', (entries: ScanEntry[]) => {
        this.emit('entries', entries);
      });

      worker.on('error', (err) => {
        this.emit('error', err);
      });

      this.workers.set(category, worker);
    }
  }

  abort(): void {
    for (const worker of this.workers.values()) {
      worker.terminate();
    }
    this.workers.clear();
  }
}

export function createScannerEngine(): ScannerEngine {
  return new ScannerEngine();
}
