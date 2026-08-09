import { useState, useEffect, useCallback } from 'react';
import type {
  ClassifiedScanEntry,
  CleanupCategory,
  CleerApi,
  ScanProgress,
} from '@shared/types';

declare const window: Window & { cleer: CleerApi };

const ALL_CATEGORIES: { id: CleanupCategory; label: string }[] = [
  { id: 'temp', label: 'Temporary Files' },
  { id: 'cache', label: 'Caches' },
  { id: 'log', label: 'Logs' },
  { id: 'dev-cache', label: 'Dev Caches' },
  { id: 'dev-artifact', label: 'Dev Artifacts' },
  { id: 'package-manager', label: 'Package Manager Cache' },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default function App() {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [entries, setEntries] = useState<ClassifiedScanEntry[]>([]);
  const [summary, setSummary] = useState<{ totalEntries: number; totalBytes: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<CleanupCategory>>(new Set(['temp', 'cache']));

  useEffect(() => {
    const cleer = window.cleer;
    if (!cleer) return;

    cleer.scan.onProgress((p: ScanProgress) => setProgress(p));
    cleer.scan.onResultBatch((batch: ClassifiedScanEntry[]) => {
      setEntries((prev) => [...prev, ...batch]);
    });
    cleer.scan.onComplete((s: { totalEntries: number; totalBytes: number }) => {
      setSummary(s);
      setScanning(false);
    });
    cleer.scan.onError((e: { message: string }) => {
      setError(e.message);
      setScanning(false);
    });

    return () => cleer.scan.removeAllListeners();
  }, []);

  const startScan = useCallback(async () => {
    const cleer = window.cleer;
    if (!cleer) return;

    setScanning(true);
    setEntries([]);
    setSummary(null);
    setError(null);

    await cleer.scan.start({
      categories: Array.from(selected),
      targetPaths: [process.env.HOME || process.env.USERPROFILE || '/'],
    });
  }, [selected]);

  const abortScan = useCallback(async () => {
    await window.cleer.scan.abort();
    setScanning(false);
  }, []);

  const toggleCategory = (id: CleanupCategory) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">CLEER</h1>
        <p className="text-gray-400">
          Computer Lifecycle, Efficiency & Environment Recovery
        </p>
      </header>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Scan Categories</h2>
        <div className="grid grid-cols-2 gap-2 max-w-md">
          {ALL_CATEGORIES.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded"
                checked={selected.has(cat.id)}
                onChange={() => toggleCategory(cat.id)}
                disabled={scanning}
              />
              <span>{cat.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="mb-6 flex gap-3">
        <button
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
          disabled={scanning || selected.size === 0}
          onClick={startScan}
        >
          {scanning ? 'Scanning...' : 'Start Scan'}
        </button>
        {scanning && (
          <button
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
            onClick={abortScan}
          >
            Abort
          </button>
        )}
      </section>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-300">
          {error}
        </div>
      )}

      {scanning && progress && (
        <div className="mb-4 p-3 bg-gray-800 rounded">
          <div className="flex justify-between text-sm text-gray-400">
            <span>{progress.entriesFound.toLocaleString()} entries found</span>
            <span>{formatBytes(progress.bytesFound)}</span>
          </div>
          {progress.currentPath && (
            <div className="text-xs text-gray-500 truncate mt-1">
              {progress.currentPath}
            </div>
          )}
          <div className="mt-2 h-1 bg-gray-700 rounded overflow-hidden">
            <div className="h-full bg-blue-500 animate-pulse w-full" />
          </div>
        </div>
      )}

      {summary && (
        <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded">
          <strong>Scan complete:</strong>{' '}
          {summary.totalEntries.toLocaleString()} entries,{' '}
          {formatBytes(summary.totalBytes)} reclaimable
        </div>
      )}

      {entries.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-2">
            Results ({entries.length.toLocaleString()})
          </h2>
          <div className="max-h-96 overflow-y-auto border border-gray-700 rounded">
            <table className="w-full text-sm">
              <thead className="bg-gray-800 sticky top-0">
                <tr>
                  <th className="text-left p-2">Path</th>
                  <th className="text-left p-2">Category</th>
                  <th className="text-left p-2">Risk</th>
                  <th className="text-right p-2">Size</th>
                </tr>
              </thead>
              <tbody>
                {entries.slice(0, 200).map((entry) => (
                  <tr key={entry.path} className="border-t border-gray-800 hover:bg-gray-800/50">
                    <td className="p-2 text-gray-400 truncate max-w-xs">
                      {entry.path}
                    </td>
                    <td className="p-2">
                      <span className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">
                        {entry.category}
                      </span>
                    </td>
                    <td className="p-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        entry.riskTier === 'safe' ? 'bg-green-900 text-green-300' :
                        entry.riskTier === 'caution' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-red-900 text-red-300'
                      }`}>
                        {entry.riskTier}
                      </span>
                    </td>
                    <td className="p-2 text-right text-gray-400">
                      {formatBytes(entry.sizeBytes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {entries.length > 200 && (
              <div className="p-2 text-center text-gray-500 text-xs">
                Showing first 200 of {entries.length.toLocaleString()} entries
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
