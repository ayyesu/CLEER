import { Download as DownloadIcon, Terminal, Monitor, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

type OS = 'windows' | 'macos' | 'linux' | 'unknown';

interface ReleaseInfo {
  version: string;
  tag: string;
  assets: Array<{ name: string; url: string }>;
}

function detectOS(): OS {
  const ua = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  if (ua.includes('win') || platform.includes('win')) return 'windows';
  if (ua.includes('mac') || platform.includes('mac') || platform.includes('darwin')) return 'macos';
  if (ua.includes('linux') || platform.includes('linux')) return 'linux';
  return 'unknown';
}

function getAssetForOS(assets: Array<{ name: string; url: string }>, os: OS): { name: string; url: string } | null {
  const patterns: Record<string, RegExp> = {
    windows: /CLEER-Setup-.*\.exe$/,
    macos: /CLEER-.*\.dmg$/,
    linux: /CLEER-.*\.AppImage$/,
  };

  const pattern = patterns[os];
  if (!pattern) return null;

  const match = assets?.find((a) => pattern.test(a.name));
  return match || null;
}

const PLATFORMS = [
  { name: 'Windows', icon: '🪟', os: 'windows' as OS, pkg: 'choco install cleer' },
  { name: 'macOS', icon: '🍎', os: 'macos' as OS, pkg: 'brew install --cask cleer' },
  { name: 'Linux', icon: '🐧', os: 'linux' as OS, pkg: 'yay -S cleer' },
];

export function Download() {
  const [detectedOS] = useState<OS>(detectOS());
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<OS | null>(null);

  useEffect(() => {
    fetch('/version.json')
      .then((r) => r.json())
      .then((data) => setRelease(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const detectedAsset = release ? getAssetForOS(release.assets, detectedOS) : null;

  const handleDownload = (os: OS) => {
    const asset = release ? getAssetForOS(release.assets, os) : null;
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

  const sortedPlatforms = detectedOS !== 'unknown'
    ? [...PLATFORMS].sort((a, b) => (a.os === detectedOS ? -1 : b.os === detectedOS ? 1 : 0))
    : PLATFORMS;

  return (
    <section id="download" className="border-t border-white/[0.06] py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Download CLEER
          </h2>
          <p className="mt-3 text-gray-400">
            Free for everyone.{' '}
            {loading ? (
              <span className="inline-flex items-center gap-1.5 text-gray-500">
                <RefreshCw className="h-3 w-3 animate-spin" aria-hidden="true" /> Checking version…
              </span>
            ) : release ? (
              <>Version {release.version}</>
            ) : null}
          </p>
          {detectedOS !== 'unknown' && (
            <div className="mt-3 inline-flex items-center gap-2 text-sm text-[#06B6D4]">
              <Monitor className="h-3.5 w-3.5" aria-hidden="true" />
              {detectedOS === 'windows' ? 'Windows' : detectedOS === 'macos' ? 'macOS' : 'Linux'} detected
            </div>
          )}
        </div>

        {detectedOS !== 'unknown' && detectedAsset && (
          <div className="mb-8 rounded-2xl border border-[#06B6D4]/20 bg-[#06B6D4]/[0.04] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-gray-100">
                  Download for {detectedOS === 'windows' ? 'Windows' : detectedOS === 'macos' ? 'macOS' : 'Linux'}
                </p>
                <p className="text-sm text-gray-500">{detectedAsset.name}</p>
              </div>
              <button
                onClick={() => handleDownload(detectedOS)}
                disabled={downloading === detectedOS}
                className="inline-flex items-center gap-2 rounded-lg bg-[#06B6D4] px-5 py-2.5 text-sm font-medium text-[#08090B] transition-all hover:bg-[#22D3EE] disabled:opacity-50"
              >
                <DownloadIcon className="h-4 w-4" aria-hidden="true" />
                {downloading === detectedOS ? 'Downloading…' : 'Download Now'}
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          {sortedPlatforms.map((platform) => {
            const isDetected = platform.os === detectedOS;
            const asset = release ? getAssetForOS(release.assets, platform.os) : null;

            return (
              <div
                key={platform.name}
                className={`rounded-2xl border p-5 transition-all ${
                  isDetected
                    ? 'border-[#06B6D4]/30 bg-[#06B6D4]/[0.04]'
                    : 'border-white/[0.06] bg-white/[0.02]'
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="text-xl" aria-hidden="true">{platform.icon}</span>
                    <span className="font-medium">{platform.name}</span>
                  </span>
                  {isDetected && (
                    <span className="rounded-full bg-[#06B6D4]/[0.1] px-2 py-0.5 text-[10px] font-medium text-[#06B6D4] uppercase tracking-wider">
                      Detected
                    </span>
                  )}
                </div>

                {asset && (
                  <button
                    onClick={() => handleDownload(platform.os)}
                    className="mb-2 flex w-full items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-white/[0.08]"
                  >
                    <DownloadIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate text-left">{asset.name}</span>
                  </button>
                )}

                <div className="flex items-center gap-2 rounded-lg bg-white/[0.02] px-3 py-2 text-xs text-gray-500">
                  <Terminal className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <code>{platform.pkg}</code>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
