import { useState } from 'react';
import { Shield, Zap, Eye, HardDrive, ArrowRight, CheckCircle2 } from 'lucide-react';

interface FirstRunProps {
  onComplete: () => void;
}

export default function FirstRun({ onComplete }: FirstRunProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: <Zap className="w-12 h-12 text-violet-400" />,
      title: 'Welcome to CLEER',
      description: 'Computer Lifecycle, Efficiency & Environment Recovery — a cross-platform disk space reclaimer that helps you find and safely remove unnecessary files.',
      details: [
        'Scans your system for temporary files, caches, logs, and duplicates',
        'Shows you exactly what will be removed before any action',
        'Moves files to Trash — never permanently deletes without explicit confirmation',
      ],
    },
    {
      icon: <Eye className="w-12 h-12 text-blue-400" />,
      title: 'Read-Only by Design',
      description: 'CLEER never deletes anything automatically. You always choose what to remove, and every action is logged in the cleanup journal for full transparency.',
      details: [
        'No background deletion — ever',
        'Every scanned item is classified by risk tier',
        'Dangerous items require extra confirmation',
      ],
    },
    {
      icon: <Shield className="w-12 h-12 text-emerald-400" />,
      title: 'Privacy First',
      description: 'CLEER never uploads your data. All scanning happens locally on your machine. We don\'t track what files you have, and we never send file paths or names to any server.',
      details: [
        '100% local processing',
        'No telemetry, no analytics, no tracking',
        'No network calls except for optional update checks',
      ],
    },
    {
      icon: <HardDrive className="w-12 h-12 text-amber-400" />,
      title: 'Permissions',
      description: 'To scan your entire system, CLEER needs appropriate permissions. Without full access, some directories will be skipped — the app will clearly show what was and wasn\'t scanned.',
      details: [
        'macOS: Full Disk Access for complete scanning',
        'Windows: Administrator access for system directories',
        'Linux: Root access for system-wide scanning',
      ],
    },
  ];

  const currentStep = steps[step];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100 flex items-center justify-center p-8">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <CheckCircle2 className="w-8 h-8 text-violet-400 mx-auto mb-2" />
          <div className="flex justify-center gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === step ? 'bg-violet-400' : i < step ? 'bg-violet-400/40' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="bg-[#0d0d14] border border-white/[0.06] rounded-xl p-8">
          <div className="flex justify-center mb-6">{currentStep.icon}</div>
          <h2 className="text-xl font-semibold text-center mb-3">{currentStep.title}</h2>
          <p className="text-gray-400 text-sm text-center mb-6">{currentStep.description}</p>
          <ul className="space-y-3 mb-8">
            {currentStep.details.map((detail, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{detail}</span>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between">
            {step > 0 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
              >
                Back
              </button>
            ) : (
              <div />
            )}
            {step < steps.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-lg text-sm font-medium transition-all shadow-lg shadow-violet-500/25"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onComplete}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg text-sm font-medium transition-all shadow-lg shadow-emerald-500/25"
              >
                Get Started <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
