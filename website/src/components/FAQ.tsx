import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'Is CLEER really free?',
    a: 'Yes. CLEER is free and open source. There are no premium features, no subscriptions, and no hidden costs. You get the full application at no charge.',
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
    a: 'Three things: (1) It never deletes automatically — you always choose. (2) It\'s fully open source — anyone can audit the code. (3) It has zero telemetry — no data ever leaves your machine.',
  },
  {
    q: 'Does CLEER need administrator/root access?',
    a: 'No. CLEER works with standard user permissions. It scans what it can access and clearly shows if any directories were skipped due to permissions. Running with elevated access allows scanning system directories, but it\'s optional.',
  },
  {
    q: 'What operating systems are supported?',
    a: 'Windows 10+, macOS 12+, and Linux (any modern distribution). CLEER has platform-specific rules and exclusions for each OS.',
  },
  {
    q: 'Will I get security warnings when installing?',
    a: 'If you install through a package manager (Homebrew, Chocolatey), no warnings appear. If you download directly, your OS may show an "untrusted developer" warning because CLEER isn\'t signed with a commercial certificate. This is normal for free, open source software — you can safely proceed.',
  },
  {
    q: 'How does CLEER handle non-English file names?',
    a: 'CLEER fully supports Unicode paths — Chinese, Japanese, Korean, Arabic, accented characters, and emoji all work correctly.',
  },
];

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 px-6 bg-white/[0.01]">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
                aria-expanded={openIdx === i}
              >
                <span className="font-medium text-gray-200 pr-4">{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 shrink-0 transition-transform ${
                    openIdx === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIdx === i && (
                <div className="px-5 pb-5 text-sm text-gray-400 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
