import { useState } from 'react';
import { Menu, X, Download } from 'lucide-react';
import { Logo } from './Logo';
import { useRelease } from '../useRelease';

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#screenshots', label: 'Screenshots' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#trust', label: 'Safety' },
  { href: '#faq', label: 'FAQ' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const release = useRelease();

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#08090B]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="#" className="flex items-center gap-2.5" aria-label="CLEER home">
          <Logo />
          <span className="text-lg font-bold tracking-tight text-white">CLEER</span>
          <span
            className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300"
            title={`Current release: ${release.tag}`}
          >
            v{release.version}
          </span>
        </a>

        <nav className="hidden md:block" aria-label="Main navigation">
          <ul className="flex items-center gap-7">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm text-gray-400 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a href="#download" className="btn-primary !px-4 !py-2">
            <Download className="h-4 w-4" aria-hidden="true" />
            Download
          </a>
        </div>

        <button
          className="text-gray-400 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav
          className="border-t border-white/[0.06] bg-[#08090B] px-6 py-4 md:hidden"
          aria-label="Mobile navigation"
        >
          <ul className="space-y-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="block rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-white/[0.04] hover:text-white"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="pt-2">
              <a href="#download" className="btn-primary w-full" onClick={() => setOpen(false)}>
                <Download className="h-4 w-4" aria-hidden="true" />
                Download
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
