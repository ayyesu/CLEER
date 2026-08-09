import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Search, AlertTriangle, CheckCircle2, Loader2,
  FolderOpen, Play, Square, ChevronRight, HardDrive,
  Zap, Shield, X, Filter, BarChart3, Copy, Sparkles, History,
} from 'lucide-react';
import type {
  ClassifiedScanEntry, CleanupCategory, CleerApi, DuplicateGroup, RiskTier, ScanProgress, UndoJournalEntry,
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
  const [activeView, setActiveView] = useState<'scan' | 'history'>('scan');
  const [journalEntries, setJournalEntries] = useState<UndoJournalEntry[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [deletionMode, setDeletionMode] = useState<'trash' | 'permanent'>('trash');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deletionRunning, setDeletionRunning] = useState(false);
  const [deletionProgress, setDeletionProgress] = useState(0);
  const [deletionTotal, setDeletionTotal] = useState(0);
  const [deletionResults, setDeletionResults] = useState<{ totalSucceeded: number; totalFailed: number; bytesReclaimed: number } | null>(null);

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
      window.cleer.journal.read().then((entries: UndoJournalEntry[]) => setJournalEntries(entries));
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

  const togglePathSelection = (path: string, entryRiskTier: RiskTier) => {
    if (entryRiskTier === 'dangerous') return;
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path); else next.add(path);
      return next;
    });
  };

  const selectedEntries = filteredEntries.filter((e) => selectedPaths.has(e.path));
  const selectedBytes = selectedEntries.reduce((s, e) => s + e.sizeBytes, 0);
  const selectedByTier = { safe: 0, caution: 0, dangerous: 0 } as Record<RiskTier, number>;
  selectedEntries.forEach((e) => { selectedByTier[e.riskTier] += e.sizeBytes; });

  const hasDangerousSelected = selectedEntries.some((e) => e.riskTier === 'dangerous');

  const startDeletion = useCallback(async () => {
    if (!window.cleer || selectedEntries.length === 0) return;
    setDeletionRunning(true);
    setDeletionProgress(0);
    setDeletionTotal(selectedEntries.length);
    setDeletionResults(null);

    const paths = selectedEntries.map((e) => e.path);
    const result = await window.cleer.clean.execute(paths, { mode: deletionMode });

    setDeletionResults({
      totalSucceeded: result.totalSucceeded,
      totalFailed: result.totalFailed,
      bytesReclaimed: result.bytesReclaimed,
    });
    setDeletionRunning(false);
    setDeletionProgress(result.totalSucceeded);
    setSelectedPaths(new Set());
    setShowConfirmModal(false);
    window.cleer.journal.read().then((entries: UndoJournalEntry[]) => setJournalEntries(entries));
  }, [selectedEntries, deletionMode]);

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

        {/* Bottom nav */}
        <div className="p-3 border-t border-white/[0.06] space-y-1">
          <button
            onClick={() => setActiveView('scan')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
              activeView === 'scan' ? 'bg-white/[0.06] text-gray-200' : 'text-gray-500 hover:bg-white/[0.03]'
            }`}
            aria-pressed={activeView === 'scan'}
          >
            <Zap className="w-4 h-4" />
            <span>Scanner</span>
          </button>
          <button
            onClick={() => {
              setActiveView('history');
              window.cleer.journal.read().then((entries: UndoJournalEntry[]) => setJournalEntries(entries));
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
              activeView === 'history' ? 'bg-white/[0.06] text-gray-200' : 'text-gray-500 hover:bg-white/[0.03]'
            }`}
            aria-pressed={activeView === 'history'}
          >
            <History className="w-4 h-4" />
            <span>Recent Cleanups</span>
            {journalEntries.length > 0 && (
              <span className="ml-auto text-[11px] text-gray-500">{journalEntries.length}</span>
            )}
          </button>
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
             {state === 'results' && scanComplete && activeView === 'scan' && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-gray-400">
                  Found <span className="text-gray-200 font-medium">{stats.totalEntries.toLocaleString()}</span> items
                </span>
              </div>
            )}
            {activeView === 'history' && (
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">
                  <span className="text-gray-200 font-medium">{journalEntries.length}</span> journal entries
                </span>
              </div>
            )}
          </div>

          {activeView === 'scan' && (state === 'results' || entries.length > 0) && (
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
          {activeView === 'history' ? (
            <HistoryView entries={journalEntries} />
          ) : (
            <>
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
                <div className="px-6 py-2 border-b border-white/[0.06] grid grid-cols-[24px_1fr_140px_100px_120px_24px] gap-4 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                  <span></span>
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
                            className="w-full px-6 py-3 grid grid-cols-[24px_1fr_140px_100px_120px_24px] gap-4 items-center text-left focus:outline-none focus:bg-white/[0.04]"
                            aria-expanded={isExpanded}
                            aria-label={`${entry.path}, ${formatBytes(entry.sizeBytes)}, ${entry.category}, ${entry.riskTier} risk`}
                          >
                            <div className="flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={selectedPaths.has(entry.path)}
                                onChange={() => togglePathSelection(entry.path, entry.riskTier)}
                                disabled={entry.riskTier === 'dangerous'}
                                className="w-3.5 h-3.5 rounded border-gray-600 bg-transparent text-violet-500 focus:ring-violet-500/30 focus:ring-offset-0 disabled:opacity-30 cursor-pointer"
                                aria-label={`Select ${truncatePath(entry.path)}`}
                              />
                            </div>
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
          </>
          )}
        </div>

        {/* Selection summary bar */}
        {activeView === 'scan' && selectedPaths.size > 0 && (
          <div className="border-t border-white/[0.06] bg-[#0d0d14] px-6 py-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-300">
                  <span className="font-medium text-white">{selectedPaths.size}</span> items selected
                </span>
                <span className="text-sm text-violet-400 font-medium">{formatBytes(selectedBytes)}</span>
                {selectedByTier.safe > 0 && <span className="text-xs text-emerald-400">safe: {formatBytes(selectedByTier.safe)}</span>}
                {selectedByTier.caution > 0 && <span className="text-xs text-amber-400">caution: {formatBytes(selectedByTier.caution)}</span>}
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={deletionMode}
                  onChange={(e) => setDeletionMode(e.target.value as 'trash' | 'permanent')}
                  className="text-xs bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1 text-gray-300 focus:outline-none focus:border-violet-500/50"
                  aria-label="Deletion mode"
                >
                  <option value="trash">Move to Trash</option>
                  <option value="permanent">Delete Permanently</option>
                </select>
                <button
                  onClick={() => { setDeletionResults(null); setShowConfirmModal(true); }}
                  className="px-4 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-violet-500/20"
                >
                  Clean Selected
                </button>
                <button
                  onClick={() => setSelectedPaths(new Set())}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Deletion progress bar */}
        {deletionRunning && (
          <div className="h-1 bg-white/[0.04] shrink-0">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all"
              style={{ width: `${deletionTotal > 0 ? (deletionProgress / deletionTotal) * 100 : 0}%` }}
            />
          </div>
        )}

        {/* Bottom progress bar */}
        {state === 'scanning' && (
          <div className="h-1 bg-white/[0.04] shrink-0">
            <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 animate-pulse w-full" />
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <ConfirmModal
          entries={selectedEntries}
          mode={deletionMode}
          hasDangerous={hasDangerousSelected}
          onConfirm={startDeletion}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}

      {/* Deletion Results */}
      {deletionResults && !showConfirmModal && (
        <DeletionResultsModal
          results={deletionResults}
          onDismiss={() => setDeletionResults(null)}
        />
      )}
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

function HistoryView({ entries }: { entries: UndoJournalEntry[] }) {
  const grouped = entries.reduce<Record<string, UndoJournalEntry[]>>((acc, entry) => {
    const key = entry.batchId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  const batches = Object.entries(grouped).sort(([a], [b]) => {
    const aTime = grouped[a][0]?.deletedAt?.getTime() ?? 0;
    const bTime = grouped[b][0]?.deletedAt?.getTime() ?? 0;
    return bTime - aTime;
  });

  if (entries.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
            <History className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-400 text-sm">No cleanup history yet</p>
          <p className="text-gray-600 text-xs mt-1">Items you clean will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <h2 className="text-lg font-semibold text-gray-200 mb-4">Recent Cleanups</h2>
      <div className="space-y-3">
        {batches.map(([batchId, batchEntries]) => {
          const batchTime = batchEntries[0]?.deletedAt;
          const completed = batchEntries.filter((e) => e.status === 'completed').length;
          const failed = batchEntries.filter((e) => e.status === 'failed').length;
          const totalBytes = batchEntries
            .filter((e) => e.status === 'completed')
            .reduce((s, e) => s + e.sizeBytes, 0);

          return (
            <div key={batchId} className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-gray-300">
                    {completed} deleted
                  </span>
                  {failed > 0 && (
                    <span className="text-sm text-rose-400">{failed} failed</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-violet-400 font-medium">{formatBytes(totalBytes)}</span>
                  <span className="text-xs text-gray-500">
                    {batchTime ? new Date(batchTime).toLocaleString() : ''}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                {batchEntries.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="flex items-center gap-2 text-xs">
                    {entry.status === 'completed' ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                    )}
                    <span className="text-gray-400 font-mono truncate flex-1">{truncatePath(entry.path)}</span>
                    <span className="text-gray-600">{formatBytes(entry.sizeBytes)}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      entry.mode === 'trash' ? 'bg-blue-500/10 text-blue-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {entry.mode}
                    </span>
                  </div>
                ))}
                {batchEntries.length > 5 && (
                  <p className="text-xs text-gray-500 pl-5">+{batchEntries.length - 5} more items</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConfirmModal({
  entries,
  mode,
  hasDangerous,
  onConfirm,
  onCancel,
}: {
  entries: ClassifiedScanEntry[];
  mode: string;
  hasDangerous: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const totalBytes = entries.reduce((s, e) => s + e.sizeBytes, 0);
  const needsExtraConfirm = hasDangerous || mode === 'permanent';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Confirm deletion">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <h3 className="text-lg font-semibold text-gray-200 mb-2">Confirm Cleanup</h3>

        <div className="bg-white/[0.03] rounded-lg p-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Items to delete</span>
            <span className="text-gray-200 font-medium">{entries.length}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-400">Space to reclaim</span>
            <span className="text-violet-400 font-medium">{formatBytes(totalBytes)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-400">Method</span>
            <span className={mode === 'trash' ? 'text-blue-400' : 'text-rose-400'}>
              {mode === 'trash' ? 'Move to Trash' : 'Permanent Delete'}
            </span>
          </div>
        </div>

        {needsExtraConfirm && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                {hasDangerous && <p className="text-amber-300">Some items are marked as <strong>dangerous</strong>.</p>}
                {mode === 'permanent' && <p className="text-amber-300">Permanent deletion <strong>cannot be undone</strong>.</p>}
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 mb-4">
          Items will be logged in the cleanup journal for recovery.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg ${
              mode === 'permanent'
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'
                : 'bg-violet-600 hover:bg-violet-500 shadow-violet-500/20'
            }`}
          >
            {mode === 'permanent' ? 'Delete Permanently' : 'Move to Trash'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeletionResultsModal({
  results,
  onDismiss,
}: {
  results: { totalSucceeded: number; totalFailed: number; bytesReclaimed: number };
  onDismiss: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Deletion results">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <div className="text-center mb-4">
          {results.totalFailed === 0 ? (
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            </div>
          )}
          <h3 className="text-lg font-semibold text-gray-200">
            {results.totalFailed === 0 ? 'Cleanup Complete' : 'Cleanup Finished with Errors'}
          </h3>
        </div>

        <div className="space-y-2 mb-5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Deleted</span>
            <span className="text-emerald-400 font-medium">{results.totalSucceeded} items</span>
          </div>
          {results.totalFailed > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Failed</span>
              <span className="text-rose-400 font-medium">{results.totalFailed} items</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Space reclaimed</span>
            <span className="text-violet-400 font-medium">{formatBytes(results.bytesReclaimed)}</span>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="w-full py-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] rounded-lg text-sm font-medium transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}
