import { Search, Shield, Copy, Clock, HardDrive, Eye } from 'lucide-react';

const FEATURES = [
  {
    icon: <Search className="w-6 h-6" />,
    title: 'Deep System Scan',
    description:
      'Scans your entire system using worker threads for speed. Finds temporary files, caches, logs, dev artifacts, and package manager caches across Windows, macOS, and Linux.',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Risk-Based Classification',
    description:
      'Every item is classified as safe, caution, or dangerous. Dangerous items are never auto-selected and require explicit confirmation before removal.',
  },
  {
    icon: <Eye className="w-6 h-6" />,
    title: 'Read-Only by Design',
    description:
      'CLEER never deletes anything automatically. You see exactly what will be removed, why it was flagged, and how much space you\'ll reclaim — before any action.',
  },
  {
    icon: <Copy className="w-6 h-6" />,
    title: 'Duplicate Detection',
    description:
      'Finds duplicate files using size-bucket hashing with byte-for-byte verification. Zero false positives. Choose which copy to keep.',
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: 'Scheduled Scanning',
    description:
      'Set up automatic scans hourly, daily, or weekly. Get notified when reclaimable space is found — without any automatic deletion.',
  },
  {
    icon: <HardDrive className="w-6 h-6" />,
    title: 'Cross-Platform',
    description:
      'Native support for Windows, macOS, and Linux with platform-specific rules. Handles non-ASCII paths, long paths, and network drives correctly.',
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to Reclaim Space
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Powerful scanning with absolute safety. CLEER gives you full control over
            what stays and what goes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 hover:bg-white/[0.04] transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
