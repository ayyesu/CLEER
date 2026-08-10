import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#trust', label: 'Safety' },
  { href: '#download', label: 'Download' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#08090B]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <a href="#" className="flex items-center gap-2.5" aria-label="CLEER home">
          <svg className="h-7 w-7" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="#06B6D4" />
            <path d="M8 22L16 10L24 22H8Z" fill="#08090B" />
            <path d="M12 22H20" stroke="#08090B" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="text-lg font-semibold tracking-tight">CLEER</span>
        </a>

        <nav className="hidden md:block" aria-label="Main navigation">
          <ul className="flex items-center gap-8">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm text-gray-400 transition-colors hover:text-gray-100"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden md:block">
          <a
            href="#download"
            className="inline-flex rounded-lg bg-[#06B6D4] px-4 py-2 text-sm font-medium text-[#08090B] transition-all hover:bg-[#22D3EE]"
          >
            Download
          </a>
        </div>

        <button
          className="md:hidden text-gray-400"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-white/[0.06] bg-[#08090B] px-6 py-4 md:hidden" aria-label="Mobile navigation">
          <ul className="space-y-3">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="block text-sm text-gray-400 hover:text-gray-100"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#download"
                className="inline-flex rounded-lg bg-[#06B6D4] px-4 py-2 text-sm font-medium text-[#08090B]"
                onClick={() => setOpen(false)}
              >
                Download
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
