import { Shield, Lock, ScrollText, Eye, CheckCircle2, GitBranch } from 'lucide-react';

const POINTS = [
  {
    icon: Eye,
    title: 'Never Deletes Automatically',
    description:
      'CLEER is read-only until you explicitly confirm a cleanup. No background deletion, no silent removal — ever.',
  },
  {
    icon: Lock,
    title: 'Privacy First',
    description:
      'All scanning happens locally. No data leaves your machine. No telemetry, no analytics, no tracking.',
  },
  {
    icon: ScrollText,
    title: 'Full Transparency',
    description:
      'Every scan result and every cleanup action is recorded in an easy-to-read journal, so you always know exactly what happened on your machine.',
  },
  {
    icon: Shield,
    title: 'Safety Guarantees',
    description:
      'System paths are hard-excluded at both scan and deletion stages. Every mutation is journaled before execution.',
  },
];

export function Trust() {
  return (
    <section id="trust" className="border-t border-white/[0.06] py-24">
      <div className="section">
        <div className="mb-14 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs font-medium text-gray-400">
            Safety &amp; trust
          </div>
          <h2 className="section-heading">Built on trust</h2>
          <p className="section-sub">
            Your data stays yours. Safe, transparent, and respectful of your privacy.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {POINTS.map((point) => {
            const Icon = point.icon;
            return (
              <div
                key={point.title}
                className="card group p-7 hover:bg-white/[0.03]"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 transition-colors group-hover:bg-emerald-500/20">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mb-2 font-semibold text-white">{point.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{point.description}</p>
              </div>
            );
          })}
        </div>

        {/* Guarantee panel */}
        <div className="mt-8 overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.06] via-transparent to-cyan-500/[0.06] p-8">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
                <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Verified by tests, not promises
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400">
                  140+ automated tests verify safety invariants. System paths are excluded at both
                  scan and deletion stages (defense in depth), and every filesystem mutation is
                  journaled before it happens.
                </p>
              </div>
            </div>
            <a
              href="https://github.com/ayyesu/CLEER/actions"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              <GitBranch className="h-4 w-4" aria-hidden="true" />
              View CI status
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
