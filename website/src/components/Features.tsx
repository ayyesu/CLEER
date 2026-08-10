import { Search, Shield, Eye, Copy, Clock, HardDrive } from 'lucide-react';

const FEATURES = [
  {
    icon: Search,
    title: 'Deep System Scan',
    description: 'Worker-thread scanning finds temporary files, caches, logs, dev artifacts, and package manager caches across all three platforms.',
  },
  {
    icon: Shield,
    title: 'Risk Classification',
    description: 'Every item is classified as safe, caution, or dangerous. Dangerous items are never auto-selected.',
  },
  {
    icon: Eye,
    title: 'Read-Only by Design',
    description: 'Nothing is deleted until you confirm. See exactly what will be removed and how much space you will reclaim.',
  },
  {
    icon: Copy,
    title: 'Duplicate Detection',
    description: 'Size-bucket hashing with byte-for-byte verification. Zero false positives. Choose which copy to keep.',
  },
  {
    icon: Clock,
    title: 'Scheduled Scanning',
    description: 'Set up automatic scans. Get notified when reclaimable space is found — without any automatic deletion.',
  },
  {
    icon: HardDrive,
    title: 'Cross-Platform',
    description: 'Native support for Windows, macOS, and Linux with platform-specific rules and exclusions.',
  },
];

export function Features() {
  return (
    <section id="features" className="border-t border-white/[0.06] py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Everything you need
          </h2>
          <p className="mt-3 text-gray-400">
            Powerful scanning with absolute safety.
          </p>
        </div>

        <div className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group bg-[#08090B] p-6 transition-colors hover:bg-white/[0.02]"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#06B6D4]/[0.08] text-[#06B6D4] transition-colors group-hover:bg-[#06B6D4]/[0.12]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mb-2 font-medium text-gray-100">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
