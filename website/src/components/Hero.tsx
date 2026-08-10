import { ArrowRight, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Hero() {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    fetch('/version.json')
      .then((r) => r.json())
      .then((data) => {
        if (data.tag) setVersion(data.tag);
      })
      .catch(() => {});
  }, []);

  return (
    <section className="relative overflow-hidden">
      {/* Subtle grid background */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" aria-hidden="true" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#06B6D4]/[0.07] blur-[120px]" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-24">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#06B6D4]/20 bg-[#06B6D4]/[0.08] px-3 py-1 text-xs text-[#06B6D4]">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            {version ? `${version} — Free & Open Source` : 'Free &amp; Open Source'}
          </div>

          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-gray-50 md:text-6xl">
            Reclaim your disk
            <br />
            space{' '}
            <span className="bg-gradient-to-b from-[#06B6D4] to-[#0891B2] bg-clip-text text-transparent">
              safely
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-400">
            CLEER scans your system for temporary files, caches, logs, and duplicates.
            You choose what to remove — it never deletes anything automatically.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#download"
              className="inline-flex items-center gap-2 rounded-lg bg-[#06B6D4] px-5 py-2.5 text-sm font-medium text-[#08090B] transition-all hover:bg-[#22D3EE]"
            >
              Download Free
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href="https://github.com/ayyesu/CLEER"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] px-5 py-2.5 text-sm text-gray-300 transition-all hover:border-white/[0.15] hover:text-gray-100"
            >
              View on GitHub
            </a>
          </div>

          <div className="mt-10 flex items-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              Windows
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              macOS
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              Linux
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              Free forever
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
