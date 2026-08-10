import { Download as DownloadIcon, Terminal, ExternalLink } from 'lucide-react';

const RELEASES_URL = 'https://github.com/ayyesu/CLEER/releases/latest';

const PLATFORMS = [
  {
    name: 'Windows',
    icon: '🪟',
    methods: [
      { label: 'Chocolatey', cmd: 'choco install cleer', type: 'pm' },
      { label: 'Direct Download', type: 'download' },
    ],
  },
  {
    name: 'macOS',
    icon: '🍎',
    methods: [
      { label: 'Homebrew', cmd: 'brew install --cask cleer', type: 'pm' },
      { label: 'Direct Download', type: 'download' },
    ],
  },
  {
    name: 'Linux',
    icon: '🐧',
    methods: [
      { label: 'AppImage', type: 'download' },
      { label: 'Arch (AUR)', cmd: 'yay -S cleer', type: 'pm' },
    ],
  },
];

export function Download() {
  return (
    <section id="download" className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Download CLEER</h2>
          <p className="text-gray-400">
            Free for everyone. Choose your preferred install method.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {PLATFORMS.map((platform) => (
            <div
              key={platform.name}
              className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6"
            >
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
                        ? 'bg-violet-600 hover:bg-violet-500 text-white font-medium'
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
          ))}
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
