import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'Is CLEER really free?',
    a: 'Yes. CLEER is free. There are no premium features, no subscriptions, and no hidden costs. You get the full application at no charge.',
  },
  {
    q: 'Does CLEER delete files automatically?',
    a: 'Never. CLEER is read-only by design. It scans your system and shows you what it finds, but nothing is deleted until you explicitly confirm. Even scheduled scans only report findings — they never delete.',
  },
  {
    q: 'Can I recover files that were deleted?',
    a: 'Yes. CLEER moves files to your OS Trash/Recycle Bin by default, so you can restore them like any other deleted file. Every action is also logged in the cleanup journal for full transparency.',
  },
  {
    q: 'What makes CLEER different from other disk cleaners?',
    a: 'Three things: (1) It never deletes automatically — you always choose. (2) Every action is journaled and files go to Trash, so you can recover anything. (3) It has zero telemetry — no data ever leaves your machine.',
  },
  {
    q: 'Does CLEER need administrator/root access?',
    a: 'No. CLEER works with standard user permissions. It scans what it can access and clearly shows if any directories were skipped. Running with elevated access allows scanning system directories, but it is optional.',
  },
  {
    q: 'What operating systems are supported?',
    a: 'Windows 10+, macOS 12+, and Linux (any modern distribution). CLEER has platform-specific rules and exclusions for each OS.',
  },
  {
    q: 'Will I get security warnings when installing?',
    a: 'If you install through a package manager (Homebrew, Chocolatey), no warnings appear. If you download directly, your OS may show an "untrusted developer" warning because CLEER is not signed with a commercial certificate. This is normal for small independent software — you can safely proceed.',
  },
  {
    q: 'How does CLEER handle non-English file names?',
    a: 'CLEER fully supports Unicode paths — Chinese, Japanese, Korean, Arabic, accented characters, and emoji all work correctly.',
  },
];

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-white/[0.06] py-24">
      <div className="section max-w-3xl">
        <div className="mb-14 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs font-medium text-gray-400">
            FAQ
          </div>
          <h2 className="section-heading">Frequently asked questions</h2>
          <p className="section-sub">Everything you need to know before you install.</p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => {
            const open = openIdx === i;
            return (
              <div
                key={i}
                className={`card overflow-hidden transition-colors ${
                  open ? 'border-emerald-500/25 bg-white/[0.03]' : 'hover:bg-white/[0.03]'
                }`}
              >
                <button
                  onClick={() => setOpenIdx(open ? null : i)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left"
                  aria-expanded={open}
                >
                  <span className="font-medium text-gray-100">{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-gray-500 transition-transform duration-200 ${
                      open ? 'rotate-180 text-emerald-400' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {open && (
                  <div className="px-5 pb-5 text-sm leading-relaxed text-gray-400">{faq.a}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
