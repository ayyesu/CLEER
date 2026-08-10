export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-2.5">
            <svg className="h-6 w-6" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <rect width="32" height="32" rx="8" fill="#06B6D4" />
              <path d="M8 22L16 10L24 22H8Z" fill="#08090B" />
              <path d="M12 22H20" stroke="#08090B" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-sm font-medium">CLEER</span>
          </div>

          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap gap-6 text-sm text-gray-500">
              <li><a href="#features" className="hover:text-gray-300">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-gray-300">How It Works</a></li>
              <li><a href="#download" className="hover:text-gray-300">Download</a></li>
              <li><a href="https://github.com/ayyesu/CLEER" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300">GitHub</a></li>
            </ul>
          </nav>
        </div>

        <div className="mt-8 border-t border-white/[0.06] pt-6 text-xs text-gray-600">
          Copyright &copy; 2026 CLEER. Released under the MIT License.
        </div>
      </div>
    </footer>
  );
}
