import { Download as DownloadIcon, Terminal, CheckCircle2, Info } from 'lucide-react';
import { useState } from 'react';
import { Asset } from '../version';
import { useRelease } from '../useRelease';
import { OS_TILES, OS_ICONS } from './OsIcons';

type OS = 'windows' | 'macos' | 'linux' | 'unknown';

function detectOS(): OS {
  const ua = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  if (ua.includes('win') || platform.includes('win')) return 'windows';
  if (ua.includes('mac') || platform.includes('mac') || platform.includes('darwin')) return 'macos';
  if (ua.includes('linux') || platform.includes('linux')) return 'linux';
  return 'unknown';
}

function getAssetForOS(os: OS, assets: Asset[]): Asset | null {
  if (os === 'unknown') return null;
  const patterns: Record<Exclude<OS, 'unknown'>, RegExp> = {
    windows: /CLEER-Setup-.*\.exe$/,
    macos: /CLEER-.*\.dmg$/,
    linux: /CLEER-.*\.AppImage$/,
  };

  const match = assets.find((a) => patterns[os].test(a.name));
  return match || null;
}

const PLATFORMS: Array<{
  name: string;
  os: Exclude<OS, 'unknown'>;
  pkg: string;
  note: string;
  file: string;
}> = [
  {
    name: 'Windows',
    os: 'windows',
    pkg: 'choco install cleer',
    note: 'Windows 10 & 11 · x64',
    file: 'CLEER-Setup-.exe',
  },
  {
    name: 'macOS',
    os: 'macos',
    pkg: 'brew install --cask cleer',
    note: 'macOS 12+ · Apple Silicon',
    file: 'CLEER-.dmg',
  },
  {
    name: 'Linux',
    os: 'linux',
    pkg: 'yay -S cleer',
    note: 'Any modern distro · AppImage',
    file: 'CLEER-.AppImage',
  },
];

export function Download() {
  const release = useRelease();
  const [detectedOS] = useState<OS>(detectOS());
  const [downloading, setDownloading] = useState<Exclude<OS, 'unknown'> | null>(null);

  const detectedAsset = getAssetForOS(detectedOS, release.assets);

  const handleDownload = (os: Exclude<OS, 'unknown'>) => {
    const asset = getAssetForOS(os, release.assets);
    if (!asset) return;

    setDownloading(os);

    const a = document.createElement('a');
    a.href = asset.url;
    a.download = asset.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setDownloading(null);
  };

  const sortedPlatforms =
    detectedOS !== 'unknown'
      ? [...PLATFORMS].sort((a, b) => (a.os === detectedOS ? -1 : b.os === detectedOS ? 1 : 0))
      : PLATFORMS;

  const DetectedIcon = detectedOS !== 'unknown' ? OS_ICONS[detectedOS] : null;

  return (
    <section id="download" className="relative border-t border-white/[0.06] py-24">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-emerald-500/[0.08] blur-[120px]"
        aria-hidden="true"
      />

      <div className="section relative">
        <div className="mb-14 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs font-medium text-gray-400">
            Download
          </div>
          <h2 className="section-heading">Free for everyone. Forever.</h2>
          <p className="section-sub">
            Version {release.version} — available now for Windows, macOS, and Linux.
          </p>
        </div>

        {detectedOS !== 'unknown' && detectedAsset && DetectedIcon && (
          <div className="mx-auto mb-8 max-w-3xl rounded-2xl border border-emerald-500/25 bg-gradient-to-r from-emerald-500/[0.1] via-cyan-500/[0.06] to-transparent p-6">
            <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                  <DetectedIcon className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 font-medium text-white">
                    {detectedOS === 'windows'
                      ? 'Windows detected'
                      : detectedOS === 'macos'
                        ? 'macOS detected'
                        : 'Linux detected'}
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                      Ready
                    </span>
                  </div>
                  <div className="mt-0.5 text-sm text-gray-500">{detectedAsset.name}</div>
                </div>
              </div>
              <button
                onClick={() => handleDownload(detectedOS)}
                disabled={downloading === detectedOS}
                className="btn-primary !px-6 !py-3"
              >
                <DownloadIcon className="h-4 w-4" aria-hidden="true" />
                {downloading === detectedOS ? 'Starting…' : 'Download Now'}
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-3">
          {sortedPlatforms.map((platform) => {
            const isDetected = platform.os === detectedOS;
            const asset = getAssetForOS(platform.os, release.assets);
            const Icon = OS_ICONS[platform.os];

            return (
              <div
                key={platform.name}
                className={`card relative overflow-hidden p-6 transition-all ${
                  isDetected ? 'border-emerald-500/30 bg-emerald-500/[0.04]' : 'hover:bg-white/[0.03]'
                }`}
              >
                {isDetected && (
                  <div className="absolute right-4 top-4 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                    Detected
                  </div>
                )}

                <div className="mb-5 flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${OS_TILES[platform.os]}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{platform.name}</div>
                    <div className="text-xs text-gray-500">{platform.note}</div>
                  </div>
                </div>

                {asset && (
                  <button
                    onClick={() => handleDownload(platform.os)}
                    disabled={downloading === platform.os}
                    className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-gray-200 transition-colors hover:bg-emerald-600 hover:text-white disabled:opacity-60"
                  >
                    <DownloadIcon className="h-4 w-4" aria-hidden="true" />
                    {downloading === platform.os ? 'Starting…' : 'Download'}
                  </button>
                )}

                <div className="rounded-xl bg-black/30 px-3 py-2.5">
                  <div className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-600">
                    <Terminal className="h-3 w-3" aria-hidden="true" />
                    Package manager
                  </div>
                  <code className="font-mono text-xs text-emerald-300">{platform.pkg}</code>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-8 flex max-w-3xl items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-gray-500">
            Direct downloads are unsigned binaries, so your OS may show an &quot;untrusted
            developer&quot; warning — this is normal for small independent software. Installing via
            a package manager (Homebrew, Chocolatey, AUR) avoids the warning entirely.
          </p>
        </div>
      </div>
    </section>
  );
}
