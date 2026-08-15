import { ArrowRight, Sparkles, ShieldCheck, Lock, Zap } from 'lucide-react';
import { useRelease } from '../useRelease';
import { WindowsIcon, AppleIcon, LinuxIcon, OS_TILES } from './OsIcons';

function AppWindowMockup() {
  return (
    <div className="relative">
      {/* Glow behind the window */}
      <div
        className="absolute -inset-8 rounded-[32px] bg-gradient-to-br from-emerald-500/25 via-cyan-500/15 to-transparent blur-2xl"
        aria-hidden="true"
      />

      {/* Main app window */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0D0E13] shadow-2xl shadow-black/60">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#12141C] px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
            <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
            <span className="h-3 w-3 rounded-full bg-[#28C840]" />
          </div>
          <div className="mx-auto flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-1 text-[11px] text-gray-500">
            <Lock className="h-3 w-3" aria-hidden="true" />
            cleer.app
          </div>
          <div className="w-14" />
        </div>

        {/* App screenshot */}
        <img
          src="/screenshots/scanner-results.png"
          alt="CLEER scan results — reclaimable disk space grouped by risk tier"
          className="w-full"
          loading="eager"
        />
      </div>

      {/* Floating badge: reclaimed */}
      <div className="absolute -left-6 bottom-10 hidden items-center gap-3 rounded-2xl border border-white/[0.1] bg-[#12141C]/95 px-4 py-3 shadow-xl shadow-black/50 backdrop-blur sm:flex">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
          <ShieldCheck className="h-4.5 w-4.5 h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">8.4 GB reclaimable</div>
          <div className="text-[11px] text-gray-500">found in your caches &amp; temp files</div>
        </div>
      </div>

      {/* Floating badge: risk tiers */}
      <div className="absolute -right-5 top-16 hidden items-center gap-2.5 rounded-2xl border border-white/[0.1] bg-[#12141C]/95 px-4 py-3 shadow-xl shadow-black/50 backdrop-blur sm:flex">
        <div className="flex -space-x-1.5" aria-hidden="true">
          <span className="h-5 w-5 rounded-full border-2 border-[#12141C] bg-emerald-400" />
          <span className="h-5 w-5 rounded-full border-2 border-[#12141C] bg-amber-400" />
          <span className="h-5 w-5 rounded-full border-2 border-[#12141C] bg-rose-400" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">Risk-tiered results</div>
          <div className="text-[11px] text-gray-500">safe · caution · dangerous</div>
        </div>
      </div>
    </div>
  );
}

const PLATFORM_CHIPS = [
  { os: 'windows' as const, Icon: WindowsIcon },
  { os: 'macos' as const, Icon: AppleIcon },
  { os: 'linux' as const, Icon: LinuxIcon },
];

export function Hero() {
  const release = useRelease();

  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.035)_1px,transparent_1px)] bg-[size:56px_56px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-1/2 top-[-120px] h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-emerald-500/[0.12] blur-[130px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-[-160px] top-1/3 h-[420px] w-[420px] rounded-full bg-cyan-500/[0.08] blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-16 md:pt-24">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
          {/* Copy */}
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/[0.08] px-3.5 py-1.5 text-xs font-medium text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {release.tag} — Free
            </div>

            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-white md:text-6xl">
              Reclaim your disk
              <br />
              space{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                safely
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-gray-400">
              CLEER finds temporary files, caches, logs, and duplicates — then lets{' '}
              <span className="font-medium text-gray-200">you</span> decide what to remove.
              Nothing is ever deleted automatically.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="#download" className="btn-primary !px-6 !py-3 text-[15px]">
                Download Free
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>

            </div>

            {/* Platform + trust chips */}
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <span className="flex -space-x-1.5" aria-hidden="true">
                  {PLATFORM_CHIPS.map(({ os, Icon }) => (
                    <span
                      key={os}
                      className={`flex h-6 w-6 items-center justify-center rounded-full ring-1 ${OS_TILES[os]}`}
                    >
                      <Icon className="h-3 w-3" />
                    </span>
                  ))}
                </span>
                Windows · macOS · Linux
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                100% local, zero telemetry
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                Free forever
              </span>
            </div>
          </div>

          {/* App mockup */}
          <AppWindowMockup />
        </div>
      </div>
    </section>
  );
}
