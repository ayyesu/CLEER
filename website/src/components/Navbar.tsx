import { useState } from 'react';
import { Zap, Menu, X } from 'lucide-react';

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#screenshots', label: 'Screenshots' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#trust', label: 'Safety' },
  { href: '#download', label: 'Download' },
  { href: '#faq', label: 'FAQ' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">CLEER</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <a
          href="#download"
          className="hidden md:inline-flex px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition-colors"
        >
          Download Free
        </a>

        <button
          className="md:hidden text-gray-400"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-[#0d0d14] border-b border-white/[0.06] px-6 py-4 space-y-3">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block text-sm text-gray-400 hover:text-gray-200"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#download"
            className="block px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium text-center"
            onClick={() => setOpen(false)}
          >
            Download Free
          </a>
        </div>
      )}
    </nav>
  );
}
