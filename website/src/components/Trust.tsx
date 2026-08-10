import { Shield, Eye, Lock, Code } from 'lucide-react';

const TRUST_POINTS = [
  {
    icon: <Eye className="w-6 h-6" />,
    title: 'Never Deletes Automatically',
    description:
      'CLEER is read-only until you explicitly confirm a cleanup. No background deletion, no silent removal, ever.',
  },
  {
    icon: <Lock className="w-6 h-6" />,
    title: 'Privacy First',
    description:
      'All scanning happens locally. No data leaves your machine. No telemetry, no analytics, no tracking. No network calls except optional update checks.',
  },
  {
    icon: <Code className="w-6 h-6" />,
    title: 'Open Source',
    description:
      'Full source code is available on GitHub. Anyone can audit exactly what CLEER does and how it works.',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Safety Guarantees',
    description:
      'System paths are hard-excluded. Undo journal records every action. Trash-by-default means nothing is ever truly gone until you empty it.',
  },
];

export function Trust() {
  return (
    <section id="trust" className="py-20 px-6 bg-white/[0.01]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Built on Trust</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Your data stays yours. CLEER is designed from the ground up to be safe,
            transparent, and respectful of your privacy.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {TRUST_POINTS.map((point) => (
            <div
              key={point.title}
              className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6"
            >
              <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                {point.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{point.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {point.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-white/[0.02] border border-white/[0.06] rounded-xl text-center">
          <p className="text-sm text-gray-400">
            <strong className="text-gray-200">140 tests</strong> verify safety
            invariants. System paths are excluded at both scan and deletion stages
            (defense in depth). Every filesystem mutation is journaled before execution.
          </p>
        </div>
      </div>
    </section>
  );
}
