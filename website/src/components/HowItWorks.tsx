import { Search, MousePointer, Trash2 } from 'lucide-react';

const STEPS = [
  {
    icon: Search,
    step: '01',
    title: 'Scan',
    description: 'Choose categories and start a scan. CLEER walks your entire filesystem using worker threads and classifies every finding by risk tier.',
  },
  {
    icon: MousePointer,
    step: '02',
    title: 'Review & Select',
    description: 'Browse results sorted by size. Expand any item to see full details — path, last accessed, risk tier, and why it was flagged.',
  },
  {
    icon: Trash2,
    step: '03',
    title: 'Clean',
    description: 'Confirm the cleanup. Files are moved to Trash (not permanently deleted). Every action is logged in the undo journal.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-white/[0.06] py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            How it works
          </h2>
          <p className="mt-3 text-gray-400">Three steps. Full control. Zero surprises.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.step}
                className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
              >
                <span className="absolute right-6 top-6 font-mono text-4xl font-light text-white/[0.04]">
                  {step.step}
                </span>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#06B6D4]/[0.08] text-[#06B6D4]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mb-2 font-medium text-gray-100">{step.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
