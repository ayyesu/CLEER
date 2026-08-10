import { useState } from 'react';

const SCREENSHOTS = [
  {
    id: 'scanner',
    title: 'Scanner View',
    description: 'Select categories and start scanning with live progress',
    gradient: 'from-violet-600/20 to-indigo-600/20',
  },
  {
    id: 'results',
    title: 'Results',
    description: 'Browse findings with risk tiers, sizes, and categories',
    gradient: 'from-emerald-600/20 to-teal-600/20',
  },
  {
    id: 'duplicates',
    title: 'Duplicate Detection',
    description: 'Find and manage duplicate files safely',
    gradient: 'from-amber-600/20 to-orange-600/20',
  },
  {
    id: 'cleanup',
    title: 'Recent Cleanups',
    description: 'Full history of all cleanup actions',
    gradient: 'from-blue-600/20 to-cyan-600/20',
  },
];

export function Screenshots() {
  const [active, setActive] = useState(0);
  const current = SCREENSHOTS[active];

  return (
    <section id="screenshots" className="py-20 px-6 bg-white/[0.01]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">See It In Action</h2>
          <p className="text-gray-400">
            A clean, dark interface designed for clarity and control.
          </p>
        </div>

        {/* Screenshot mockup */}
        <div className="relative rounded-xl border border-white/[0.08] overflow-hidden mb-8">
          <div className={`aspect-video bg-gradient-to-br ${current.gradient} flex items-center justify-center`}>
            <div className="text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.1] border border-white/[0.1] flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-white/80">
                  {current.title[0]}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{current.title}</h3>
              <p className="text-white/60 text-sm max-w-sm">{current.description}</p>
            </div>
          </div>
        </div>

        {/* Thumbnails */}
        <div className="grid grid-cols-4 gap-3">
          {SCREENSHOTS.map((shot, i) => (
            <button
              key={shot.id}
              onClick={() => setActive(i)}
              className={`rounded-lg border p-3 text-left transition-all ${
                i === active
                  ? 'border-violet-500/50 bg-violet-500/10'
                  : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
              }`}
            >
              <div className="text-sm font-medium text-gray-200 mb-1">{shot.title}</div>
              <div className="text-xs text-gray-500">{shot.description}</div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
