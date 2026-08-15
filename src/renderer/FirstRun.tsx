import { useState } from 'react';
import { Shield, Zap, Eye, HardDrive, ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import iconUrl from './icon.png';

interface FirstRunProps {
  onComplete: () => void;
}

export default function FirstRun({ onComplete }: FirstRunProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: <Zap className="w-10 h-10 text-emerald-400" />,
      title: 'Welcome to CLEER',
      description: 'Computer Lifecycle, Efficiency & Environment Recovery — a cross-platform disk space reclaimer that helps you find and safely remove unnecessary files.',
      details: [
        'Scans your system for temporary files, caches, logs, and duplicates',
        'Shows you exactly what will be removed before any action',
        'Moves files to Trash — never permanently deletes without explicit confirmation',
      ],
    },
    {
      icon: <Eye className="w-10 h-10 text-blue-400" />,
      title: 'Read-Only by Design',
      description: 'CLEER never deletes anything automatically. You always choose what to remove, and every action is logged in the cleanup journal for full transparency.',
      details: [
        'No background deletion — ever',
        'Every scanned item is classified by risk tier',
        'Dangerous items require extra confirmation',
      ],
    },
    {
      icon: <Shield className="w-10 h-10 text-emerald-400" />,
      title: 'Privacy First',
      description: 'CLEER never uploads your data. All scanning happens locally on your machine. We don\'t track what files you have, and we never send file paths or names to any server.',
      details: [
        '100% local processing',
        'No telemetry, no analytics, no tracking',
        'No network calls except for optional update checks',
      ],
    },
    {
      icon: <HardDrive className="w-10 h-10 text-amber-400" />,
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
    <div className="min-h-screen bg-[#07070c] text-gray-100 flex items-center justify-center p-8 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[720px] h-[420px] rounded-full bg-emerald-500/[0.07] blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[420px] h-[320px] rounded-full bg-cyan-500/[0.06] blur-[120px]" />
      </div>

      <div className="relative w-full max-w-xl">
        {/* Brand */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <img
            src={iconUrl}
            alt="CLEER"
            className="w-12 h-12 rounded-[13px] ring-1 ring-white/10 shadow-lg shadow-black/40"
          />
          <div className="text-left">
            <div className="text-lg font-bold tracking-tight leading-none">CLEER</div>
            <div className="text-[11px] text-gray-500 mt-1 leading-none">Free space. More life.</div>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-gradient-to-r from-emerald-500 to-cyan-500' : i < step ? 'w-4 bg-emerald-400/40' : 'w-4 bg-white/10'
              }`}
            />
          ))}
        </div>

        <div className="bg-[#0b0b14] border border-white/[0.07] rounded-3xl p-8 shadow-2xl shadow-black/40">
          <div className="relative">
            {/* Step badge */}
            <div className="flex justify-between items-center mb-6">
              <span className="text-[11px] uppercase tracking-[0.16em] text-gray-600 font-semibold">
                Step {step + 1} of {steps.length}
              </span>
              <span className="text-[11px] text-gray-600 font-mono">0{step + 1}</span>
            </div>

            <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto mb-6 shadow-inner">
              {currentStep.icon}
            </div>

            <h2 className="text-xl font-bold tracking-tight text-center mb-3">{currentStep.title}</h2>
            <p className="text-gray-400 text-sm text-center leading-relaxed mb-7">{currentStep.description}</p>

            <ul className="space-y-3 bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 mb-8">
              {currentStep.details.map((detail, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{detail}</span>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between">
              {step > 0 ? (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2.5 text-sm text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Back
                </button>
              ) : (
                <div />
              )}
              {step < steps.length - 1 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 rounded-xl text-sm font-medium transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.99]"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={onComplete}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl text-sm font-medium transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.99]"
                >
                  Get Started <CheckCircle2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Trust footer */}
        <div className="mt-8 flex items-center justify-center gap-6 text-[11px] text-gray-600">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-500/70" /> Nothing leaves your machine
          </span>
          <span className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-emerald-500/70" /> Read-only by design
          </span>
        </div>
      </div>
    </div>
  );
}
