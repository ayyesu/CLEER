import { useState } from 'react';
import { MonitorPlay } from 'lucide-react';

const SHOTS = [
  {
    id: 'results',
    src: '/screenshots/scanner-results.png',
    title: 'Scan Results',
    description: 'Every finding with risk tier, size, and category — sorted by reclaimable space.',
  },
  {
    id: 'duplicates',
    src: '/screenshots/scanner-duplicates.png',
    title: 'Duplicate Detection',
    description: 'Byte-verified duplicate groups with wasted space, so you keep the right copy.',
  },
  {
    id: 'selected',
    src: '/screenshots/scanner-selected.png',
    title: 'Review & Select',
    description: 'Pick exactly what to clean and see the total reclaimable space update live.',
  },
  {
    id: 'confirm',
    src: '/screenshots/scanner-confirm.png',
    title: 'Explicit Confirmation',
    description: 'Every cleanup requires confirmation. Permanent deletion always warns first.',
  },
  {
    id: 'history',
    src: '/screenshots/history.png',
    title: 'Cleanup Journal',
    description: 'Every action is logged. Full transparency for everything you remove.',
  },
  {
    id: 'onboarding',
    src: '/screenshots/first-run.png',
    title: 'Guided Onboarding',
    description: 'A clear, honest walkthrough of how CLEER works before you scan anything.',
  },
];

export function Screenshots() {
  const [active, setActive] = useState(0);
  const current = SHOTS[active];

  return (
    <section id="screenshots" className="border-t border-white/[0.06] py-24">
      <div className="section">
        <div className="mb-14 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs font-medium text-gray-400">
            <MonitorPlay className="h-3.5 w-3.5" aria-hidden="true" />
            Screenshots
          </div>
          <h2 className="section-heading">See it in action</h2>
          <p className="section-sub">
            Real screenshots from the actual application — no mockups, no stock images.
          </p>
        </div>

        {/* Main preview */}
        <div className="relative mx-auto max-w-5xl">
          <div
            className="absolute -inset-6 rounded-[32px] bg-gradient-to-br from-emerald-500/15 to-cyan-500/10 blur-2xl"
            aria-hidden="true"
          />
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0D0E13] shadow-2xl shadow-black/60">
            <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#12141C] px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
                <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
                <span className="h-3 w-3 rounded-full bg-[#28C840]" />
              </div>
              <div className="mx-auto text-[11px] text-gray-500">
                CLEER — {current.title}
              </div>
              <div className="w-14" />
            </div>
            <img
              src={current.src}
              alt={`CLEER ${current.title.toLowerCase()} — ${current.description}`}
              className="w-full"
            />
            <div className="border-t border-white/[0.06] bg-[#12141C] px-6 py-4">
              <div className="text-sm font-semibold text-white">{current.title}</div>
              <div className="mt-0.5 text-xs text-gray-500">{current.description}</div>
            </div>
          </div>
        </div>

        {/* Thumbnails */}
        <div className="mt-8 grid grid-cols-3 gap-3 md:grid-cols-6">
          {SHOTS.map((shot, i) => (
            <button
              key={shot.id}
              onClick={() => setActive(i)}
              className={`group overflow-hidden rounded-xl border text-left transition-all ${
                i === active
                  ? 'border-emerald-500/50 ring-2 ring-emerald-500/30'
                  : 'border-white/[0.07] hover:border-white/[0.15]'
              }`}
              aria-pressed={i === active}
              aria-label={`Show ${shot.title}`}
            >
              <img
                src={shot.src}
                alt=""
                loading="lazy"
                className={`aspect-[16/10] w-full object-cover object-top transition-opacity ${
                  i === active ? 'opacity-100' : 'opacity-50 group-hover:opacity-80'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
