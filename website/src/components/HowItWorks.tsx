import { Search, MousePointerClick, Trash2 } from 'lucide-react';

const STEPS = [
  {
    icon: Search,
    step: '01',
    title: 'Scan',
    description:
      'Choose categories and start a scan. CLEER walks your filesystem with worker threads and classifies every finding by risk tier.',
  },
  {
    icon: MousePointerClick,
    step: '02',
    title: 'Review & Select',
    description:
      'Browse results sorted by size. Expand any item to see full details — path, last accessed, risk tier, and why it was flagged.',
  },
  {
    icon: Trash2,
    step: '03',
    title: 'Clean',
    description:
      'Confirm the cleanup. Files move to Trash by default — nothing is permanently deleted without explicit consent.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-white/[0.06] py-24">
      <div className="section">
        <div className="mb-14 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs font-medium text-gray-400">
            How it works
          </div>
          <h2 className="section-heading">Three steps. Full control. Zero surprises.</h2>
          <p className="section-sub">
            The entire workflow is designed around one principle: you stay in charge.
          </p>
        </div>

        <div className="relative grid gap-8 md:grid-cols-3">
          {/* Connector line */}
          <div
            className="absolute left-[16%] right-[16%] top-10 hidden h-px bg-gradient-to-r from-emerald-500/40 via-cyan-500/40 to-emerald-500/40 md:block"
            aria-hidden="true"
          />

          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.step} className="relative">
                <div className="card group p-7 hover:bg-white/[0.03]">
                  <div className="relative mb-6 flex items-center justify-between">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/15 to-cyan-500/10 shadow-lg shadow-emerald-500/10 transition-transform group-hover:scale-105">
                      <Icon className="h-8 w-8 text-emerald-400" aria-hidden="true" />
                    </div>
                    <span className="font-mono text-5xl font-bold text-white/[0.05]">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-500">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
