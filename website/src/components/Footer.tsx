import { Zap, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold">CLEER</span>
            </div>
            <p className="text-sm text-gray-500 max-w-xs">
              Computer Lifecycle, Efficiency & Environment Recovery.
              Free, open source, and built on trust.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-gray-300 mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#features" className="hover:text-gray-300">Features</a></li>
              <li><a href="#screenshots" className="hover:text-gray-300">Screenshots</a></li>
              <li><a href="#download" className="hover:text-gray-300">Download</a></li>
              <li><a href="#faq" className="hover:text-gray-300">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-300 mb-3">Links</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <a href="https://github.com/ayyesu/CLEER" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  GitHub
                </a>
              </li>
              <li>
                <a href="https://github.com/ayyesu/CLEER/issues" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Issues
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/[0.06] pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            Copyright © 2026 CLEER. Released under the MIT License.
          </p>
          <p className="text-xs text-gray-600">
            Built with React · TypeScript · Electron
          </p>
        </div>
      </div>
    </footer>
  );
}
