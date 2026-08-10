import { Download as DownloadIcon, Terminal, Package } from 'lucide-react';

const PLATFORMS = [
  {
    name: 'Windows',
    icon: '🪟',
    methods: [
      { label: 'Chocolatey', cmd: 'choco install cleer', primary: true },
      { label: 'Direct Download', cmd: 'CLEER-0.1.0-win.exe', primary: false },
    ],
  },
  {
    name: 'macOS',
    icon: '🍎',
    methods: [
      { label: 'Homebrew', cmd: 'brew install --cask cleer', primary: true },
      { label: 'Direct Download', cmd: 'CLEER-0.1.0-arm64.dmg', primary: false },
    ],
  },
  {
    name: 'Linux',
    icon: '🐧',
    methods: [
      { label: 'AppImage', cmd: 'CLEER-0.1.0-x86_64.AppImage', primary: true },
      { label: 'Arch (AUR)', cmd: 'yay -S cleer', primary: false },
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
                      method.primary
                        ? method.cmd.includes('choco')
                          ? '#'
                          : method.cmd.includes('brew')
                          ? '#'
                          : `https://github.com/ayyesu/CLEER/releases/latest/download/${method.cmd}`
                        : `https://github.com/ayyesu/CLEER/releases/latest/download/${method.cmd}`
                    }
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      method.primary
                        ? 'bg-violet-600 hover:bg-violet-500 text-white font-medium'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 border border-white/[0.06]'
                    }`}
                  >
                    <DownloadIcon className="w-4 h-4 shrink-0" />
                    <span>{method.label}</span>
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
