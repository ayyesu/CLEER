import { useState } from 'react';
import type { CleanupCategory } from '@shared/types';

export default function App() {
  const [scanning, setScanning] = useState(false);

  const categories: { id: CleanupCategory; label: string }[] = [
    { id: 'temp', label: 'Temporary Files' },
    { id: 'cache', label: 'Caches' },
    { id: 'log', label: 'Logs' },
    { id: 'dev-cache', label: 'Dev Caches' },
    { id: 'duplicate', label: 'Duplicates' },
  ];

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
        <div className="space-y-2">
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span>{cat.label}</span>
            </label>
          ))}
        </div>
      </section>

      <button
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
        disabled={scanning}
        onClick={() => setScanning(true)}
      >
        {scanning ? 'Scanning...' : 'Start Scan'}
      </button>
    </div>
  );
}
