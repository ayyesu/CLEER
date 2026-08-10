import { useState, useEffect } from 'react';
import { Download as DownloadIcon, Terminal, ExternalLink, Monitor, RefreshCw } from 'lucide-react';

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
  const patterns: Record<OS, RegExp> = {
    windows: /CLEER-Setup-.*\.exe$/,
    macos: /CLEER-.*\.dmg$/,
    linux: /CLEER-.*\.AppImage$/,
    unknown: /$/,
  };

  const match = assets.find((a) => patterns[os].test(a.name));
  return match || null;
}

const RELEASES_API = '/version.json';

export function Download() {
  const [detectedOS, setDetectedOS] = useState<OS>('unknown');
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<OS | null>(null);

  useEffect(() => {
    setDetectedOS(detectOS());

    fetch(RELEASES_API)
      .then((r) => r.json())
      .then((data) => {
        setRelease({
          version: data.tag_name?.replace('v', '') || 'unknown',
          tag: data.tag_name || '',
          assets: (data.assets || []).map((a: { name: string; browser_download_url: string }) => ({
            name: a.name,
            url: a.browser_download_url,
          })),
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (os: OS) => {
    if (!release) return;
    const asset = getAssetForOS(release.assets, os);
    if (!asset) return;

    setDownloading(os);

    if (navigator.userAgent.includes('Electron')) {
      try {
        const { ipcRenderer } = window.require('electron');
        await ipcRenderer.invoke('download-file', { url: asset.url, filename: asset.name });
      } catch {
        window.open(asset.url, '_blank');
      }
    } else {
      const a = document.createElement('a');
      a.href = asset.url;
      a.download = asset.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    setDownloading(null);
  };

  const platforms = [
    {
      name: 'Windows',
      icon: '🪟',
      os: 'windows' as OS,
      pkg: { label: 'Chocolatey', cmd: 'choco install cleer' },
    },
    {
      name: 'macOS',
      icon: '🍎',
      os: 'macos' as OS,
      pkg: { label: 'Homebrew', cmd: 'brew install --cask cleer' },
    },
    {
      name: 'Linux',
      icon: '🐧',
      os: 'linux' as OS,
      pkg: { label: 'AUR', cmd: 'yay -S cleer' },
    },
  ];

  const sortedPlatforms =
    detectedOS !== 'unknown'
      ? [...platforms].sort((a, b) => (a.os === detectedOS ? -1 : b.os === detectedOS ? 1 : 0))
      : platforms;

  const detectedAsset = release ? getAssetForOS(release.assets, detectedOS) : null;

  return (
    <section id="download" className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Download CLEER</h2>
          <p className="text-gray-400 mb-2">
            Free for everyone. Choose your preferred install method.
          </p>

          {loading ? (
            <div className="inline-flex items-center gap-2 text-sm text-gray-500">
              <RefreshCw className="w-4 h-4 animate-spin" /> Checking for updates...
            </div>
          ) : release ? (
            <div className="inline-flex items-center gap-3">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-400">
                Latest: v{release.version}
              </span>
              {detectedOS !== 'unknown' && (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full text-xs text-violet-400">
                  <Monitor className="w-3.5 h-3.5" />
                  {detectedOS === 'windows' ? 'Windows' : detectedOS === 'macos' ? 'macOS' : 'Linux'} detected
                </span>
              )}
            </div>
          ) : null}
        </div>

        {detectedOS !== 'unknown' && detectedAsset && (
          <div className="mb-8 p-4 bg-violet-500/5 border border-violet-500/20 rounded-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-medium text-gray-200">
                  Download for {detectedOS === 'windows' ? 'Windows' : detectedOS === 'macos' ? 'macOS' : 'Linux'}
                </p>
                <p className="text-sm text-gray-500">
                  {detectedAsset.name} ({detectedOS === 'windows' ? 'Setup Installer' : detectedOS === 'macos' ? 'Disk Image' : 'AppImage'})
                </p>
              </div>
              <button
                onClick={() => handleDownload(detectedOS)}
                disabled={downloading === detectedOS}
                className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-lg text-sm font-medium transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50"
              >
                {downloading === detectedOS ? 'Downloading...' : 'Download Now'}
              </button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {sortedPlatforms.map((platform) => {
            const isDetected = platform.os === detectedOS;
            const asset = release ? getAssetForOS(release.assets, platform.os) : null;

            return (
              <div
                key={platform.name}
                className={`relative bg-white/[0.02] border rounded-xl p-6 transition-all ${
                  isDetected ? 'border-violet-500/50 ring-1 ring-violet-500/20' : 'border-white/[0.06]'
                }`}
              >
                {isDetected && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-violet-600 rounded-full text-[10px] font-medium text-white uppercase tracking-wider">
                    Recommended
                  </div>
                )}

                <div className="text-center mb-4">
                  <span className="text-3xl">{platform.icon}</span>
                  <h3 className="text-lg font-semibold mt-2">{platform.name}</h3>
                </div>
                <div className="space-y-2">
                  {asset && (
                    <button
                      onClick={() => handleDownload(platform.os)}
                      disabled={downloading === platform.os}
                      className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                        isDetected
                          ? 'bg-violet-600 hover:bg-violet-500 text-white font-medium'
                          : 'bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 border border-white/[0.06]'
                      }`}
                    >
                      <DownloadIcon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 text-left">{asset.name}</span>
                      {downloading === platform.os && <RefreshCw className="w-3 h-3 animate-spin" />}
                    </button>
                  )}
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 border border-white/[0.06]"
                  >
                    <Terminal className="w-4 h-4 shrink-0" />
                    <span className="flex-1">{platform.pkg.label}</span>
                    <code className="text-[10px] opacity-70">{platform.pkg.cmd}</code>
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="w-5 h-5 text-violet-400" />
            <span className="font-medium">Package Managers</span>
          </div>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <code className="text-violet-400">brew install --cask cleer</code>
              <p className="text-gray-500 mt-1">macOS</p>
            </div>
            <div>
              <code className="text-violet-400">choco install cleer</code>
              <p className="text-gray-500 mt-1">Windows</p>
            </div>
            <div>
              <code className="text-violet-400">yay -S cleer</code>
              <p className="text-gray-500 mt-1">Arch Linux</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
