import { Heart } from 'lucide-react';
import { Logo } from './Logo';
import { useRelease } from '../useRelease';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Screenshots', href: '#screenshots' },
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'Download', href: '#download' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: 'https://github.com/ayyesu/CLEER/blob/main/README.md' },
      { label: 'Release Notes', href: 'https://github.com/ayyesu/CLEER/releases' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Security Policy', href: 'https://github.com/ayyesu/CLEER/security/policy' },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'GitHub', href: 'https://github.com/ayyesu/CLEER' },
      { label: 'Issues', href: 'https://github.com/ayyesu/CLEER/issues' },
    ],
  },
];

export function Footer() {
  const release = useRelease();

  return (
    <footer className="border-t border-white/[0.06] py-16">
      <div className="section">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <a href="#" className="mb-4 inline-flex items-center gap-2.5" aria-label="CLEER home">
              <Logo className="h-7 w-7" />
              <span className="text-base font-bold tracking-tight text-white">CLEER</span>
            </a>
            <p className="max-w-xs text-sm leading-relaxed text-gray-500">
              Computer Lifecycle, Efficiency &amp; Environment Recovery. Free disk space reclaimer
              for Windows, macOS, and Linux.
            </p>

          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={`${col.title} links`}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      {...(link.href.startsWith('http')
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                      className="text-sm text-gray-500 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/[0.06] pt-6 md:flex-row md:items-center">
          <div className="text-xs text-gray-600">
            Copyright &copy; 2026 CLEER · v{release.version}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            Made with <Heart className="h-3.5 w-3.5 fill-rose-500/60 text-rose-500/60" aria-hidden="true" />
            and zero telemetry
          </div>
        </div>
      </div>
    </footer>
  );
}
