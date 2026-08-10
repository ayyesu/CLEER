import { useState, useEffect } from 'react';
import { Download as DownloadIcon, Terminal, ExternalLink, Monitor } from 'lucide-react';

const RELEASES_URL = 'https://github.com/ayyesu/CLEER/releases/latest';

type OS = 'windows' | 'macos' | 'linux' | 'unknown';

function detectOS(): OS {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();

  if (userAgent.includes('win') || platform.includes('win')) return 'windows';
  if (userAgent.includes('mac') || platform.includes('mac') || platform.includes('darwin')) return 'macos';
  if (userAgent.includes('linux') || platform.includes('linux')) return 'linux';
  return 'unknown';
}

interface PlatformConfig {
  name: string;
  icon: string;
  os: OS;
  methods: Array<{
    label: string;
    cmd?: string;
    type: 'pm' | 'download';
  }>;
}

const PLATFORMS: PlatformConfig[] = [
  {
    name: 'Windows',
    icon: '🪟',
    os: 'windows',
    methods: [
      { label: 'Chocolatey', cmd: 'choco install cleer', type: 'pm' },
      { label: 'Direct Download', type: 'download' },
    ],
  },
  {
    name: 'macOS',
    icon: '🍎',
    os: 'macos',
    methods: [
      { label: 'Homebrew', cmd: 'brew install --cask cleer', type: 'pm' },
      { label: 'Direct Download', type: 'download' },
    ],
  },
  {
    name: 'Linux',
    icon: '🐧',
    os: 'linux',
    methods: [
      { label: 'AppImage', type: 'download' },
      { label: 'Arch (AUR)', cmd: 'yay -S cleer', type: 'pm' },
    ],
  },
];

export function Download() {
  const [detectedOS, setDetectedOS] = useState<OS>('unknown');

  useEffect(() => {
    setDetectedOS(detectOS());
  }, []);

  const reorderedPlatforms =
    detectedOS !== 'unknown'
      ? [...PLATFORMS].sort((a, b) => {
          if (a.os === detectedOS) return -1;
          if (b.os === detectedOS) return 1;
          return 0;
        })
      : PLATFORMS;

  return (
    <section id="download" className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Download CLEER</h2>
          <p className="text-gray-400">
            Free for everyone. Choose your preferred install method.
          </p>
          {detectedOS !== 'unknown' && (
            <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-400">
              <Monitor className="w-3.5 h-3.5" />
              Detected: {detectedOS === 'windows' ? 'Windows' : detectedOS === 'macos' ? 'macOS' : 'Linux'}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {reorderedPlatforms.map((platform) => {
            const isDetected = platform.os === detectedOS;

            return (
              <div
                key={platform.name}
                className={`relative bg-white/[0.02] border rounded-xl p-6 transition-all ${
                  isDetected
                    ? 'border-violet-500/50 ring-1 ring-violet-500/20 shadow-lg shadow-violet-500/5'
                    : 'border-white/[0.06]'
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
                  {platform.methods.map((method) => (
                    <a
                      key={method.label}
                      href={
                        method.type === 'download'
                          ? RELEASES_URL
                          : '#'
                      }
                      target={method.type === 'download' ? '_blank' : undefined}
                      rel={method.type === 'download' ? 'noopener noreferrer' : undefined}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        method.type === 'download'
                          ? isDetected
                            ? 'bg-violet-600 hover:bg-violet-500 text-white font-medium shadow-md shadow-violet-500/20'
                            : 'bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 border border-white/[0.06]'
                          : 'bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 border border-white/[0.06]'
                      }`}
                    >
                      <DownloadIcon className="w-4 h-4 shrink-0" />
                      <span className="flex-1">{method.label}</span>
                      {method.type === 'download' && <ExternalLink className="w-3 h-3 opacity-60" />}
                      {method.type === 'pm' && (
                        <code className="text-[10px] opacity-70 hidden sm:inline">{method.cmd}</code>
                      )}
                    </a>
                  ))}
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
