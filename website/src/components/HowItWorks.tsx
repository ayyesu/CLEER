import { Search, MousePointer, Trash2 } from 'lucide-react';

const STEPS = [
  {
    icon: <Search className="w-6 h-6" />,
    step: '01',
    title: 'Scan',
    description:
      'Choose categories and start a scan. CLEER walks your entire filesystem using worker threads, classifies every finding by risk tier, and shows live progress.',
  },
  {
    icon: <MousePointer className="w-6 h-6" />,
    step: '02',
    title: 'Review & Select',
    description:
      'Browse results sorted by size. Expand any item to see full details — path, last accessed, risk tier, why it was flagged. Select what you want to remove.',
  },
  {
    icon: <Trash2 className="w-6 h-6" />,
    step: '03',
    title: 'Clean',
    description:
      'Confirm the cleanup. Files are moved to Trash (not permanently deleted). Every action is logged in the undo journal for full transparency.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-gray-400">Three steps. Full control. Zero surprises.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((step) => (
            <div key={step.step} className="relative">
              <div className="text-6xl font-bold text-white/[0.03] absolute -top-4 -left-2">
                {step.step}
              </div>
              <div className="relative">
                <div className="w-12 h-12 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4">
                  {step.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
