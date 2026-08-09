import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Search, AlertTriangle, CheckCircle2, Loader2,
  FolderOpen, Play, Square, ChevronRight, HardDrive,
  Zap, Shield, X, Filter, BarChart3, Copy, Sparkles,
} from 'lucide-react';
import type {
  ClassifiedScanEntry, CleanupCategory, CleerApi, DuplicateGroup, RiskTier, ScanProgress,
} from '@shared/types';
import { CATEGORY_LABELS, TIER_COLORS } from '@shared/types';
import { formatBytes, formatDate, truncatePath } from './utils';

declare const window: Window & { cleer: CleerApi };

type AppState = 'idle' | 'scanning' | 'results' | 'error';

const ALL_CATEGORIES: CleanupCategory[] = [
  'temp', 'cache', 'log', 'dev-cache', 'dev-artifact',
  'package-manager', 'orphaned-app', 'duplicate',
];

export default function App() {
  const [state, setState] = useState<AppState>('idle');
  const [entries, setEntries] = useState<ClassifiedScanEntry[]>([]);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [selected, setSelected] = useState<Set<CleanupCategory>>(new Set(ALL_CATEGORIES));
  const [selectedTiers, setSelectedTiers] = useState<Set<RiskTier>>(new Set(['safe', 'caution']));
  const [search, setSearch] = useState('');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scanComplete, setScanComplete] = useState(false);
  const [dedupeGroups, setDedupeGroups] = useState<DuplicateGroup[]>([]);
  const [dedupeRunning, setDedupeRunning] = useState(false);
  const [dedupeProgress, setDedupeProgress] = useState<{ processed: number; total: number } | null>(null);
  const [dedupeWasted, setDedupeWasted] = useState(0);

  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cleer = window.cleer;
    if (!cleer) return;

    cleer.scan.onProgress((p: ScanProgress) => setProgress(p));
    cleer.scan.onResultBatch((batch: ClassifiedScanEntry[]) => {
      setEntries((prev) => [...prev, ...batch]);
    });
    cleer.scan.onComplete(() => {
      setScanComplete(true);
      setState('results');
    });
    cleer.scan.onError((e: { message: string }) => {
      setErrorMsg(e.message);
      setState('error');
    });

    cleer.dedupe.onProgress((p: { processed: number; total: number }) => {
      setDedupeProgress(p);
    });
    cleer.dedupe.onComplete((result: { groups: DuplicateGroup[]; totalWasted: number }) => {
      setDedupeGroups(result.groups);
      setDedupeWasted(result.totalWasted);
      setDedupeRunning(false);
      setDedupeProgress(null);
      setEntries((prev) => [...prev]);
    });

    return () => cleer.scan.removeAllListeners();
  }, []);

  const filteredEntries = useMemo(() => {
    let result = entries.filter((e) => selected.has(e.category) && selectedTiers.has(e.riskTier));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) => e.path.toLowerCase().includes(q));
    }
    return result;
  }, [entries, selected, selectedTiers, search]);

  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => b.sizeBytes - a.sizeBytes);
  }, [filteredEntries]);

  const stats = useMemo(() => {
    const totalBytes = entries.reduce((s, e) => s + e.sizeBytes, 0);
    const byTier = { safe: 0, caution: 0, dangerous: 0 } as Record<RiskTier, number>;
    const byCat = {} as Record<CleanupCategory, number>;
    for (const e of entries) {
      byTier[e.riskTier] += e.sizeBytes;
      byCat[e.category] = (byCat[e.category] || 0) + e.sizeBytes;
    }
    return { totalBytes, totalEntries: entries.length, byTier, byCat };
  }, [entries]);

  const rowVirtualizer = useVirtualizer({
    count: sortedEntries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 8,
  });

  const startScan = useCallback(async () => {
    const cleer = window.cleer;
    if (!cleer) return;

    setState('scanning');
    setEntries([]);
    setScanComplete(false);
    setErrorMsg(null);
    setExpandedIdx(null);
    setProgress(null);

    await cleer.scan.start({
      categories: Array.from(selected),
      targetPaths: [process.env.HOME || process.env.USERPROFILE || '/'],
    });
  }, [selected]);

  const abortScan = useCallback(async () => {
    await window.cleer?.scan.abort();
    setState(entries.length > 0 ? 'results' : 'idle');
  }, [entries.length]);

  const startDedupe = useCallback(async () => {
    if (!window.cleer) return;
    setDedupeRunning(true);
    setDedupeGroups([]);
    setDedupeWasted(0);
    await window.cleer.dedupe.start();
  }, []);

  const toggleCategory = (id: CleanupCategory) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleTier = (tier: RiskTier) => {
    setSelectedTiers((prev) => {
      const next = new Set(prev);
      if (next.has(tier)) next.delete(tier); else next.add(tier);
      return next;
    });
  };

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 border-r border-white/[0.06] bg-[#0d0d14] flex flex-col shrink-0">
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">CLEER</h1>
              <p className="text-[11px] text-gray-500 leading-none">Disk Space Recovery</p>
            </div>
          </div>
        </div>

        {/* Scan controls */}
        <div className="p-4 border-b border-white/[0.06]">
          {state === 'scanning' ? (
            <button
              onClick={abortScan}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-lg font-medium text-sm transition-colors"
              aria-label="Abort scan"
            >
              <Square className="w-4 h-4" /> Stop Scan
            </button>
          ) : (
            <button
              onClick={startScan}
              disabled={selected.size === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-medium text-sm transition-all shadow-lg shadow-violet-500/25"
              aria-label="Start scan"
            >
              <Play className="w-4 h-4" /> Start Scan
            </button>
          )}
        </div>

        {/* Tier filters */}
        <div className="p-4 border-b border-white/[0.06]">
          <h3 className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-3">Risk Tiers</h3>
          <div className="space-y-1.5">
            {(['safe', 'caution', 'dangerous'] as RiskTier[]).map((tier) => {
              const colors = TIER_COLORS[tier];
              const active = selectedTiers.has(tier);
              return (
                <button
                  key={tier}
                  onClick={() => toggleTier(tier)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                    active ? `${colors.bg} ${colors.text}` : 'text-gray-500 hover:bg-white/[0.03]'
                  }`}
                  aria-pressed={active}
                  aria-label={`Filter ${tier} tier`}
                >
                  <span className={`w-2 h-2 rounded-full ${active ? colors.dot : 'bg-gray-600'}`} />
                  <span className="capitalize flex-1 text-left">{tier}</span>
                  {stats.byTier[tier] > 0 && (
                    <span className="text-xs opacity-70">{formatBytes(stats.byTier[tier])}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Categories */}
        <div className="p-4 flex-1 overflow-y-auto">
          <h3 className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-3">Categories</h3>
          <div className="space-y-1">
            {ALL_CATEGORIES.map((cat) => {
              const active = selected.has(cat);
              const bytes = stats.byCat[cat] || 0;
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                    active ? 'bg-white/[0.06] text-gray-200' : 'text-gray-500 hover:bg-white/[0.03]'
                  }`}
                  aria-pressed={active}
                  aria-label={`Toggle ${CATEGORY_LABELS[cat]}`}
                >
                  <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[10px] transition-colors ${
                    active ? 'bg-violet-500 border-violet-500 text-white' : 'border-gray-600'
                  }`}>
                    {active && '✓'}
                  </span>
                  <span className="flex-1 text-left">{CATEGORY_LABELS[cat]}</span>
                  {bytes > 0 && (
                    <span className="text-[11px] text-gray-500 tabular-nums">{formatBytes(bytes)}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-white/[0.06] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            {state === 'scanning' && progress && (
              <div className="flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                <span className="text-sm text-gray-400">
                  Scanning… <span className="text-gray-200 font-medium">{progress.entriesFound.toLocaleString()}</span> files found
                </span>
                <span className="text-xs text-gray-600 tabular-nums max-w-48 truncate">
                  {progress.currentPath}
                </span>
              </div>
            )}
            {state === 'results' && scanComplete && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-gray-400">
                  Found <span className="text-gray-200 font-medium">{stats.totalEntries.toLocaleString()}</span> items
                </span>
              </div>
            )}
          </div>

          {(state === 'results' || entries.length > 0) && (
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search paths…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-64 pl-9 pr-8 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                  aria-label="Search file paths"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-hidden">
          {state === 'idle' && entries.length === 0 && <IdleState onStart={startScan} />}
          {state === 'scanning' && entries.length === 0 && <ScanningState progress={progress} />}
          {state === 'error' && <ErrorState message={errorMsg} onRetry={startScan} />}

          {sortedEntries.length > 0 ? (
            <div className="h-full flex flex-col">
              {/* Stats bar */}
              <div className="px-6 py-3 border-b border-white/[0.06] flex items-center gap-6 shrink-0">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-400">
                    Showing <span className="text-gray-200 font-medium">{sortedEntries.length.toLocaleString()}</span> of {entries.length.toLocaleString()} items
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-400">
                    Reclaimable: <span className="text-violet-400 font-medium">{formatBytes(filteredEntries.reduce((s, e) => s + e.sizeBytes, 0))}</span>
                  </span>
                </div>
                {dedupeWasted > 0 && (
                  <div className="flex items-center gap-2 ml-auto mr-4">
                    <Copy className="w-4 h-4 text-amber-400" />
                    <span className="text-sm text-amber-400">
                      {dedupeGroups.length} duplicate groups · {formatBytes(dedupeWasted)} wasted
                    </span>
                  </div>
                )}
                {search && (
                  <span className="text-xs text-gray-500 ml-auto">
                    Filtered by "{search}"
                  </span>
                )}
              </div>

              {/* Dedupe button */}
              <div className="px-6 py-2 border-b border-white/[0.06] shrink-0">
                {dedupeRunning ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                    <span className="text-sm text-gray-400">
                      Finding duplicates… {dedupeProgress ? `${dedupeProgress.processed}/${dedupeProgress.total}` : ''}
                    </span>
                    <div className="flex-1 h-1 bg-white/[0.04] rounded overflow-hidden max-w-xs">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all"
                        style={{ width: dedupeProgress ? `${(dedupeProgress.processed / Math.max(dedupeProgress.total, 1)) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                ) : dedupeGroups.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-gray-400">
                      Found <span className="text-gray-200 font-medium">{dedupeGroups.length}</span> duplicate groups
                    </span>
                    <button
                      onClick={startDedupe}
                      className="text-xs text-violet-400 hover:text-violet-300 underline"
                    >
                      Re-scan
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={startDedupe}
                    disabled={entries.length === 0}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] rounded-lg transition-colors disabled:opacity-40"
                  >
                    <Copy className="w-4 h-4" />
                    Find Duplicates
                  </button>
                )}
              </div>

              {/* Duplicate groups */}
              {dedupeGroups.length > 0 && (
                <div className="border-b border-white/[0.06] shrink-0">
                  <div className="px-6 py-2">
                    <h3 className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Duplicate Groups</h3>
                  </div>
                  <div className="max-h-40 overflow-y-auto px-6 pb-3 space-y-2">
                    {dedupeGroups.slice(0, 10).map((group, i) => (
                      <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-gray-400 font-mono truncate max-w-md">
                            {truncatePath(group.keeper.path)}
                          </span>
                          <span className="text-xs text-amber-400 font-medium shrink-0 ml-2">
                            {group.duplicates.length + 1} copies · {formatBytes(group.wastedBytes)} wasted
                          </span>
                        </div>
                        <div className="space-y-1">
                          {group.duplicates.map((dup, j) => (
                            <div key={j} className="flex items-center gap-2 text-xs text-gray-500">
                              <Copy className="w-3 h-3 shrink-0" />
                              <span className="font-mono truncate">{truncatePath(dup.path)}</span>
                              <span className="ml-auto text-gray-600">{formatBytes(dup.sizeBytes)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {dedupeGroups.length > 10 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{dedupeGroups.length - 10} more groups
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Table */}
              <div className="flex-1 overflow-hidden" role="region" aria-label="Scan results">
                {/* Header */}
                <div className="px-6 py-2 border-b border-white/[0.06] grid grid-cols-[1fr_140px_100px_120px_24px] gap-4 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                  <span>Path</span>
                  <span>Category</span>
                  <span className="text-right">Size</span>
                  <span className="text-right">Modified</span>
                  <span></span>
                </div>

                {/* Virtualized rows */}
                <div ref={parentRef} className="h-[calc(100%-37px)] overflow-auto">
                  <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
                    {rowVirtualizer.getVirtualItems().map((vRow) => {
                      const entry = sortedEntries[vRow.index];
                      const isExpanded = expandedIdx === vRow.index;
                      const tierColors = TIER_COLORS[entry.riskTier];

                      return (
                        <div
                          key={vRow.key}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            transform: `translateY(${vRow.start}px)`,
                          }}
                          className={`border-b border-white/[0.04] ${isExpanded ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'} transition-colors`}
                        >
                          <button
                            onClick={() => setExpandedIdx(isExpanded ? null : vRow.index)}
                            className="w-full px-6 py-3 grid grid-cols-[1fr_140px_100px_120px_24px] gap-4 items-center text-left focus:outline-none focus:bg-white/[0.04]"
                            aria-expanded={isExpanded}
                            aria-label={`${entry.path}, ${formatBytes(entry.sizeBytes)}, ${entry.category}, ${entry.riskTier} risk`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${tierColors.dot}`} />
                              <span className="text-sm text-gray-300 truncate font-mono text-[13px]">
                                {truncatePath(entry.path)}
                              </span>
                            </div>
                            <div>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${tierColors.bg} ${tierColors.text} ${tierColors.border} border`}>
                                {CATEGORY_LABELS[entry.category]}
                              </span>
                            </div>
                            <span className="text-sm text-gray-400 text-right tabular-nums">{formatBytes(entry.sizeBytes)}</span>
                            <span className="text-xs text-gray-500 text-right tabular-nums">{formatDate(entry.lastModified)}</span>
                            <ChevronRight className={`w-4 h-4 text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>

                          {/* Expanded detail */}
                          {isExpanded && (
                            <div className="px-6 pb-4 pl-[52px]">
                              <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 space-y-2">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                  <div>
                                    <span className="text-gray-500 text-xs block">Full Path</span>
                                    <span className="text-gray-300 font-mono text-xs break-all">{entry.path}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 text-xs block">Size</span>
                                    <span className="text-gray-300 font-mono text-xs">{formatBytes(entry.sizeBytes)} ({entry.sizeBytes.toLocaleString()} bytes)</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 text-xs block">Last Accessed</span>
                                    <span className="text-gray-300 text-xs">{formatDate(entry.lastAccessed)}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 text-xs block">Risk Tier</span>
                                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${tierColors.text}`}>
                                      <Shield className="w-3 h-3" />
                                      <span className="capitalize">{entry.riskTier}</span>
                                      {entry.regenerable && <span className="text-gray-500 font-normal">(regenerable)</span>}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : state === 'scanning' && entries.length === 0 ? null : state === 'idle' ? null : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Filter className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No results match your filters</p>
                <p className="text-gray-600 text-xs mt-1">Try adjusting your category or tier selection</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom progress bar */}
        {state === 'scanning' && (
          <div className="h-1 bg-white/[0.04] shrink-0">
            <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 animate-pulse w-full" />
          </div>
        )}
      </main>
    </div>
  );
}

function IdleState({ onStart }: { onStart: () => void }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center mx-auto mb-6">
          <FolderOpen className="w-10 h-10 text-violet-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-200 mb-2">Ready to scan</h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          Select the categories you want to scan, then click Start Scan to find reclaimable disk space on your system.
        </p>
        <button
          onClick={onStart}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-lg font-medium text-sm transition-all shadow-lg shadow-violet-500/25"
        >
          <Play className="w-4 h-4" /> Start First Scan
        </button>
      </div>
    </div>
  );
}

function ScanningState({ progress }: { progress: ScanProgress | null }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-violet-500/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <HardDrive className="w-8 h-8 text-violet-400" />
          </div>
        </div>
        <p className="text-gray-300 text-sm font-medium mb-1">Scanning your system…</p>
        {progress && (
          <p className="text-gray-500 text-xs tabular-nums">
            {progress.entriesFound.toLocaleString()} files · {formatBytes(progress.bytesFound)}
          </p>
        )}
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-8 h-8 text-rose-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-200 mb-2">Scan failed</h2>
        <p className="text-gray-500 text-sm mb-4">{message || 'An unexpected error occurred during the scan.'}</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] rounded-lg text-sm font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
