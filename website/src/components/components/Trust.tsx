import { Shield, Lock, Code, CheckCircle2 } from 'lucide-react';

const POINTS = [
  {
    icon: Eye,
    title: 'Never Deletes Automatically',
    description: 'CLEER is read-only until you explicitly confirm a cleanup. No background deletion, no silent removal — ever.',
  },
  {
    icon: Lock,
    title: 'Privacy First',
    description: 'All scanning happens locally. No data leaves your machine. No telemetry, no analytics, no tracking.',
  },
  {
    icon: Code,
    title: 'Open Source',
    description: 'Full source code on GitHub. Anyone can audit exactly what CLEER does and how it works.',
  },
  {
    icon: Shield,
    title: 'Safety Guarantees',
    description: 'System paths are hard-excluded. Undo journal records every action. Trash-by-default means nothing is ever truly gone.',
  },
];

export function Trust() {
  return (
    <section id="trust" className="border-t border-white/[0.06] py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Built on trust
          </h2>
          <p className="mt-3 text-gray-400">
            Your data stays yours. Safe, transparent, and respectful of your privacy.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {POINTS.map((point) => {
            const Icon = point.icon;
            return (
              <div
                key={point.title}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/[0.08] text-emerald-400">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mb-2 font-medium text-gray-100">{point.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">
                  {point.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
            <p className="text-sm text-gray-400">
              <strong className="text-gray-200">140 tests</strong> verify safety invariants.
              System paths are excluded at both scan and deletion stages (defense in depth).
              Every filesystem mutation is journaled before execution.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
