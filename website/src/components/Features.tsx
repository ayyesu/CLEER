import { Search, Shield, Eye, Copy, Clock, HardDrive } from 'lucide-react';

const FEATURES = [
  {
    icon: Search,
    title: 'Deep System Scan',
    description:
      'Worker-thread scanning finds temporary files, caches, logs, dev artifacts, and package-manager caches across all three platforms.',
    accent: 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20',
  },
  {
    icon: Shield,
    title: 'Risk Classification',
    description:
      'Every item is classified as safe, caution, or dangerous. Dangerous items are never auto-selected — ever.',
    accent: 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20',
  },
  {
    icon: Eye,
    title: 'Read-Only by Design',
    description:
      'Nothing is deleted until you confirm. See exactly what will be removed and how much space you will reclaim.',
    accent: 'bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20',
  },
  {
    icon: Copy,
    title: 'Duplicate Detection',
    description:
      'Size-bucket hashing with byte-for-byte verification. Zero false positives. You choose which copy to keep.',
    accent: 'bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20',
  },
  {
    icon: Clock,
    title: 'Scheduled Scanning',
    description:
      'Set up automatic scans. Get notified when reclaimable space is found — without any automatic deletion.',
    accent: 'bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20',
  },
  {
    icon: HardDrive,
    title: 'Cross-Platform',
    description:
      'Native support for Windows, macOS, and Linux with platform-specific rules and hard-coded system exclusions.',
    accent: 'bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20',
  },
];

export function Features() {
  return (
    <section id="features" className="border-t border-white/[0.06] py-24">
      <div className="section">
        <div className="mb-14 max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs font-medium text-gray-400">
            Features
          </div>
          <h2 className="section-heading">Everything you need. Nothing you don&apos;t.</h2>
          <p className="section-sub">
            Powerful scanning with absolute safety. Built for people who care what&apos;s on their
            machine.
          </p>
        </div>

        <div className="grid gap-px overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.04] sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group bg-[#08090B] p-7 transition-colors hover:bg-[#0B0C11]"
              >
                <div
                  className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${feature.accent}`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mb-2 font-semibold text-white">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
