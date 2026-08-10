import { EventEmitter } from 'events';
import { Worker } from 'worker_threads';
import { resolve } from 'path';
import type {
  ClassifiedScanEntry,
  RuleDefinition,
  ScanOptions,
  ScanProgress,
} from '@shared/types';
import { createRiskTierEngine } from './riskTierEngine';

export class ScannerEngine extends EventEmitter {
  private workers: Map<string, Worker> = new Map();
  private rules: RuleDefinition[] = [];
  private active = false;
  private _permissionDeniedPaths: string[] = [];

  setRules(rules: RuleDefinition[]): void {
    this.rules = rules;
  }

  async start(options: ScanOptions): Promise<void> {
    this.active = true;
    const classifier = createRiskTierEngine(this.rules);

    this._permissionDeniedPaths = [];

    for (const category of options.categories) {
      const workerPath = resolve(__dirname, '../workers/scanWorker.js');
      const worker = new Worker(workerPath, {
        workerData: { category, targetPaths: options.targetPaths, options },
      });

      worker.on('message', (msg: { type: string; data?: unknown }) => {
        if (!this.active) return;

        switch (msg.type) {
          case 'entries': {
            const entries = msg.data as ClassifiedScanEntry[];
            const classified = entries.map((e) => classifier.classify(e));
            this.emit('entries', classified);
            break;
          }
          case 'progress': {
            const progress = msg.data as ScanProgress;
            this.emit('progress', progress);
            break;
          }
          case 'permission-denied': {
            const paths = msg.data as string[];
            this._permissionDeniedPaths.push(...paths);
            break;
          }
          case 'done': {
            this.emit('worker-done', category);
            break;
          }
          case 'error': {
            this.emit('error', new Error(msg.data as string));
            break;
          }
        }
      });

      worker.on('error', (err) => {
        this.emit('error', err);
      });

      this.workers.set(category, worker);
    }
  }

  abort(): void {
    this.active = false;
    for (const worker of this.workers.values()) {
      worker.terminate();
    }
    this.workers.clear();
  }

  get isActive(): boolean {
    return this.active;
  }

  get permissionDeniedPaths(): string[] {
    return [...this._permissionDeniedPaths];
  }
}

export function createScannerEngine(): ScannerEngine {
  return new ScannerEngine();
}
