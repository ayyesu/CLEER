import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import FirstRun from './FirstRun';
import {
  Search, AlertTriangle, CheckCircle2, Loader2,
  FolderOpen, Play, Square, ChevronRight, HardDrive,
  Shield, X, BarChart3, Copy, Sparkles, History, Clock,
  Trash2, RotateCcw, Filter, Gauge, Layers, Lock, ScanLine,
} from 'lucide-react';
import type {
  ClassifiedScanEntry, CleanupCategory, CleerApiWindow, DuplicateGroup, PermissionStatus, RiskTier, ScanProgress, UndoJournalEntry,
} from '@shared/types';
import { CATEGORY_LABELS, TIER_COLORS } from '@shared/types';
import { formatBytes, formatDate, truncatePath } from './utils';
import iconUrl from './icon.png';

declare const window: Window & CleerApiWindow;

type AppState = 'idle' | 'scanning' | 'results' | 'error';

const ALL_CATEGORIES: CleanupCategory[] = [
  'temp', 'cache', 'log', 'dev-cache', 'dev-artifact',
  'package-manager', 'orphaned-app', 'duplicate',
];

const TIER_META: Record<RiskTier, { label: string; description: string }> = {
  safe: { label: 'Safe', description: 'Regenerable, always safe to remove' },
  caution: { label: 'Caution', description: 'Review before removing' },
  dangerous: { label: 'Dangerous', description: 'Never auto-selected' },
};

export default function App() {
  const [showFirstRun, setShowFirstRun] = useState(() => {
    return localStorage.getItem('cleer.firstRunComplete') !== 'true';
  });
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
  const [schedulerEnabled, setSchedulerEnabled] = useState(false);
  const [schedulerInterval, setSchedulerInterval] = useState<'hourly' | 'daily' | 'weekly'>('daily');
  const [journalEntries, setJournalEntries] = useState<UndoJournalEntry[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null);
  const [scanPermissionDenied, setScanPermissionDenied] = useState<string[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [deletionMode, setDeletionMode] = useState<'trash' | 'permanent'>('trash');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deletionRunning, setDeletionRunning] = useState(false);
  const [deletionProgress, setDeletionProgress] = useState(0);
  const [deletionTotal, setDeletionTotal] = useState(0);
  const [deletionResults, setDeletionResults] = useState<{ totalSucceeded: number; totalFailed: number; bytesReclaimed: number } | null>(null);

  const parentRef = useRef<HTMLDivElement>(null);
  const [homeDir, setHomeDir] = useState('/');

  useEffect(() => {
    const cleer = window.cleer;
    if (!cleer) return;

    cleer.system.getHomeDir().then(setHomeDir);

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

    cleer.permissions.getStatus().then((status: PermissionStatus) => {
      setPermissionStatus(status);
    });

    cleer.scan.onPermissionDenied((paths: string[]) => {
      setScanPermissionDenied(paths);
    });

    cleer.dedupe.onProgress((p: { processed: number; total: number }) => {
      setDedupeProgress(p);
    });
    cleer.dedupe.onComplete((result: { groups: DuplicateGroup[]; totalWasted: number }) => {
      setDedupeRunning(false);
      setDedupeProgress(null);
      setDedupeGroups(result?.groups ?? []);
      setDedupeWasted(result?.totalWasted ?? 0);
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

  const tierDistribution = useMemo(() => {
    const total = Math.max(stats.totalBytes, 1);
    return (['safe', 'caution', 'dangerous'] as RiskTier[]).map((tier) => ({
      tier,
      bytes: stats.byTier[tier],
      pct: (stats.byTier[tier] / total) * 100,
    }));
  }, [stats]);

  const rowVirtualizer = useVirtualizer({
    count: sortedEntries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
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
    setDedupeGroups([]);
    setDedupeWasted(0);

    await cleer.scan.start({
      categories: Array.from(selected),
      targetPaths: [homeDir || '/'],
    });
  }, [selected, homeDir]);

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

  if (showFirstRun) {
    return (
      <FirstRun
        onComplete={() => {
          localStorage.setItem('cleer.firstRunComplete', 'true');
          setShowFirstRun(false);
        }}
      />
    );
  }

  const showResults = activeView === 'scan' && sortedEntries.length > 0;
  const reclaimableBytes = filteredEntries.reduce((s, e) => s + e.sizeBytes, 0);

  return (
    <div className="flex h-screen bg-[#07070c] text-gray-100 overflow-hidden">
      {/* ======= Sidebar ======= */}
      <aside className="w-[276px] border-r border-white/[0.06] bg-[#0a0a12] flex flex-col shrink-0">
        {/* Brand */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <img
              src={iconUrl}
              alt="CLEER"
              className="w-10 h-10 rounded-[11px] ring-1 ring-white/10 shadow-lg shadow-black/40"
            />
            <div>
              <h1 className="text-[17px] font-bold tracking-tight leading-none">CLEER</h1>
              <p className="text-[11px] text-gray-500 mt-1 leading-none">Free space. More life.</p>
            </div>
          </div>
        </div>

        {/* Primary action */}
        <div className="px-4 pb-4">
          {state === 'scanning' ? (
            <button
              onClick={abortScan}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-xl font-medium text-sm transition-all hover:border-rose-500/50"
              aria-label="Abort scan"
            >
              <Square className="w-4 h-4" /> Stop Scan
            </button>
          ) : (
            <button
              onClick={startScan}
              disabled={selected.size === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-medium text-sm transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 active:scale-[0.99]"
              aria-label="Start scan"
            >
              <Play className="w-4 h-4" /> Start Scan
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-6">
          {/* Risk tiers */}
          <section>
            <h3 className="text-[10px] uppercase tracking-[0.14em] text-gray-600 font-semibold mb-2.5">
              Risk Tiers
            </h3>
            <div className="space-y-1">
              {(['safe', 'caution', 'dangerous'] as RiskTier[]).map((tier) => {
                const colors = TIER_COLORS[tier];
                const active = selectedTiers.has(tier);
                return (
                  <button
                    key={tier}
                    onClick={() => toggleTier(tier)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all ${
                      active ? 'bg-white/[0.05] text-gray-200' : 'text-gray-500 hover:bg-white/[0.03]'
                    }`}
                    aria-pressed={active}
                    aria-label={`Filter ${tier} tier`}
                    title={TIER_META[tier].description}
                  >
                    <span className={`w-2 h-2 rounded-full ${active ? colors.dot : 'bg-gray-700'}`} />
                    <span className="capitalize flex-1 text-left font-medium">{tier}</span>
                    {stats.byTier[tier] > 0 && (
                      <span className="text-[11px] text-gray-500 tabular-nums">{formatBytes(stats.byTier[tier])}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Categories */}
          <section>
            <h3 className="text-[10px] uppercase tracking-[0.14em] text-gray-600 font-semibold mb-2.5">
              Categories
            </h3>
            <div className="space-y-0.5">
              {ALL_CATEGORIES.map((cat) => {
                const active = selected.has(cat);
                const bytes = stats.byCat[cat] || 0;
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`w-full flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] transition-all ${
                      active ? 'text-gray-200' : 'text-gray-500 hover:bg-white/[0.03]'
                    }`}
                    aria-pressed={active}
                    aria-label={`Toggle ${CATEGORY_LABELS[cat]}`}
                  >
                    <span className={`w-4 h-4 rounded-[5px] border flex items-center justify-center transition-colors ${
                      active
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                        : 'border-gray-700 bg-transparent'
                    }`}>
                      {active && <CheckCircle2 className="w-3 h-3" />}
                    </span>
                    <span className="flex-1 text-left truncate">{CATEGORY_LABELS[cat]}</span>
                    {bytes > 0 && (
                      <span className="text-[11px] text-gray-600 tabular-nums">{formatBytes(bytes)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Bottom: views + scheduler */}
        <div className="px-4 pb-4 pt-3 space-y-4 border-t border-white/[0.06]">
          {/* View switcher */}
          <div className="flex rounded-xl bg-white/[0.03] border border-white/[0.06] p-1">
            <button
              onClick={() => setActiveView('scan')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                activeView === 'scan' ? 'bg-white/[0.07] text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-300'
              }`}
              aria-pressed={activeView === 'scan'}
            >
              <ScanLine className="w-4 h-4" />
              Scanner
            </button>
            <button
              onClick={() => {
                setActiveView('history');
                window.cleer.journal.read().then((entries: UndoJournalEntry[]) => setJournalEntries(entries));
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                activeView === 'history' ? 'bg-white/[0.07] text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-300'
              }`}
              aria-pressed={activeView === 'history'}
            >
              <History className="w-4 h-4" />
              Cleanups
              {journalEntries.length > 0 && (
                <span className="text-[10px] text-gray-500 tabular-nums">{journalEntries.length}</span>
              )}
            </button>
          </div>

          {/* Scheduler */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs text-gray-400 font-medium">Auto-Scan</span>
              <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                schedulerEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/[0.05] text-gray-500'
              }`}>
                {schedulerEnabled ? 'On' : 'Off'}
              </span>
            </div>
            <select
              value={schedulerInterval}
              onChange={(e) => {
                const interval = e.target.value as 'hourly' | 'daily' | 'weekly';
                setSchedulerInterval(interval);
                if (schedulerEnabled) {
                  window.cleer.scheduler.start({
                    interval,
                    scanOptions: {
                      categories: Array.from(selected),
                      targetPaths: [homeDir || '/'],
                    },
                  });
                }
              }}
              disabled={!schedulerEnabled}
              className="w-full text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-gray-300 focus:outline-none focus:border-emerald-500/50 disabled:opacity-40"
              aria-label="Scheduler interval"
            >
              <option value="hourly">Every hour</option>
              <option value="daily">Every day</option>
              <option value="weekly">Every week</option>
            </select>
            <button
              onClick={async () => {
                if (schedulerEnabled) {
                  await window.cleer.scheduler.stop();
                  setSchedulerEnabled(false);
                } else {
                  await window.cleer.scheduler.start({
                    interval: schedulerInterval,
                    scanOptions: {
                      categories: Array.from(selected),
                      targetPaths: [homeDir || '/'],
                    },
                  });
                  setSchedulerEnabled(true);
                }
              }}
              className={`w-full mt-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                schedulerEnabled
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                  : 'bg-white/[0.04] text-gray-400 border border-white/[0.08] hover:bg-white/[0.07]'
              }`}
            >
              {schedulerEnabled ? 'Enabled' : 'Enable'}
            </button>
          </div>
        </div>
      </aside>

      {/* ======= Main ======= */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#07070c]">
        {/* Top bar */}
        <header className="h-16 border-b border-white/[0.06] flex items-center justify-between px-6 shrink-0 bg-[#0a0a12]">
          <div className="flex items-center gap-3 min-w-0">
            {activeView === 'history' ? (
              <>
                <History className="w-4.5 h-4.5 w-5 h-5 text-emerald-400" />
                <span className="text-[15px] font-semibold tracking-tight">Recent Cleanups</span>
                {journalEntries.length > 0 && (
                  <span className="text-xs text-gray-500 ml-1">
                    <span className="text-gray-200 font-medium tabular-nums">{journalEntries.length}</span> journal entries
                  </span>
                )}
              </>
            ) : state === 'scanning' ? (
              <>
                <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                <span className="text-[15px] font-semibold tracking-tight">Scanning</span>
                {progress && (
                  <>
                    <span className="text-xs text-gray-500">
                      <span className="text-gray-200 font-medium tabular-nums">{progress.entriesFound.toLocaleString()}</span> files found
                    </span>
                    <span className="hidden xl:block text-[11px] text-gray-600 tabular-nums max-w-[280px] truncate font-mono">
                      {progress.currentPath}
                    </span>
                  </>
                )}
              </>
            ) : state === 'results' && scanComplete ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-[15px] font-semibold tracking-tight">Scan Complete</span>
                <span className="text-xs text-gray-500">
                  <span className="text-gray-200 font-medium tabular-nums">{stats.totalEntries.toLocaleString()}</span> items found
                </span>
              </>
            ) : (
              <>
                <ScanLine className="w-5 h-5 text-emerald-400" />
                <span className="text-[15px] font-semibold tracking-tight">Disk Scanner</span>
                <span className="text-xs text-gray-500 hidden sm:block">Select what to scan, then run a scan</span>
              </>
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
                  className="w-64 pl-9 pr-8 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  aria-label="Search file paths"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </header>

        {/* Permission banner */}
        {permissionStatus && permissionStatus.level !== 'full' && activeView === 'scan' && (
          <div className={`px-6 py-3 border-b shrink-0 ${
            permissionStatus.level === 'restricted'
              ? 'bg-rose-500/[0.07] border-rose-500/20'
              : 'bg-amber-500/[0.06] border-amber-500/15'
          }`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                  permissionStatus.level === 'restricted' ? 'text-rose-400' : 'text-amber-400'
                }`} />
                <div className="min-w-0">
                  {permissionStatus.warnings.map((w, i) => (
                    <p key={i} className={`text-[13px] ${
                      permissionStatus.level === 'restricted' ? 'text-rose-300' : 'text-amber-300'
                    }`}>{w}</p>
                  ))}
                  {permissionStatus.inaccessiblePaths.length > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {permissionStatus.inaccessiblePaths.length} path(s) will be skipped
                    </p>
                  )}
                </div>
              </div>
              {permissionStatus.actionable && (
                <button
                  onClick={() => window.cleer.permissions.openSettings()}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium shrink-0 transition-colors ${
                    permissionStatus.level === 'restricted'
                      ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300'
                      : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300'
                  }`}
                >
                  {permissionStatus.actionLabel}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Scan permission-denied banner */}
        {activeView === 'scan' && scanPermissionDenied.length > 0 && (
          <div className="px-6 py-2 border-b border-amber-500/20 bg-amber-500/[0.04] shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-xs text-amber-300">
                  {scanPermissionDenied.length} path(s) skipped due to insufficient permissions
                </span>
              </div>
              <button
                onClick={() => setScanPermissionDenied([])}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 overflow-hidden">
          {activeView === 'history' ? (
            <HistoryView entries={journalEntries} />
          ) : (
            <>
              {state === 'idle' && entries.length === 0 && <IdleState onStart={startScan} />}
              {state === 'scanning' && entries.length === 0 && <ScanningState progress={progress} />}
              {state === 'error' && <ErrorState message={errorMsg} onRetry={startScan} />}

              {showResults ? (
                <div className="h-full flex flex-col">
                  {/* Stats cards */}
                  <div className="px-6 pt-5 pb-3 grid grid-cols-2 xl:grid-cols-4 gap-3 shrink-0">
                    <StatCard
                      icon={Gauge}
                      label="Reclaimable"
                      value={formatBytes(reclaimableBytes)}
                      sub={`${sortedEntries.length.toLocaleString()} of ${entries.length.toLocaleString()} items`}
                      accent="violet"
                    />
                    <StatCard
                      icon={Layers}
                      label="Items Found"
                      value={entries.length.toLocaleString()}
                      sub="Total scan results"
                      accent="blue"
                    />
                    <StatCard
                      icon={BarChart3}
                      label="By Risk Tier"
                      value={`${tierDistribution.filter((t) => t.bytes > 0).length} tiers`}
                      sub={<TierBar distribution={tierDistribution} />}
                      accent="emerald"
                    />
                    <StatCard
                      icon={Trash2}
                      label="Method"
                      value={deletionMode === 'trash' ? 'Move to Trash' : 'Permanent'}
                      sub="Recoverable by default"
                      accent="amber"
                    />
                  </div>

                  {/* Toolbar */}
                  <div className="px-6 pb-3 flex items-center gap-3 shrink-0">
                    {dedupeRunning ? (
                      <div className="flex items-center gap-3 flex-1 max-w-lg rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
                        <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                        <span className="text-[13px] text-gray-400">
                          Finding duplicates… {dedupeProgress ? `${dedupeProgress.processed}/${dedupeProgress.total}` : ''}
                        </span>
                        <div className="flex-1 h-1 bg-white/[0.05] rounded overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
                            style={{ width: dedupeProgress ? `${(dedupeProgress.processed / Math.max(dedupeProgress.total, 1)) * 100}%` : '0%' }}
                          />
                        </div>
                      </div>
                    ) : dedupeGroups.length > 0 ? (
                      <div className="flex items-center gap-2.5">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span className="text-[13px] text-gray-400">
                          Found <span className="text-gray-200 font-medium tabular-nums">{dedupeGroups.length}</span> duplicate groups
                        </span>
                        <button
                          onClick={startDedupe}
                          className="text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
                        >
                          Re-scan
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={startDedupe}
                        disabled={entries.length === 0}
                        className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] text-gray-400 hover:text-gray-100 hover:bg-white/[0.04] rounded-xl border border-white/[0.06] transition-colors disabled:opacity-40"
                      >
                        <Copy className="w-4 h-4" />
                        Find Duplicates
                      </button>
                    )}
                    {dedupeWasted > 0 && (
                      <div className="flex items-center gap-2 ml-auto text-[13px] text-amber-400">
                        <Copy className="w-4 h-4" />
                        {dedupeGroups.length} groups · {formatBytes(dedupeWasted)} wasted
                      </div>
                    )}
                    {search && (
                      <span className="text-xs text-gray-500 ml-auto">
                        Filtered by &quot;{search}&quot;
                      </span>
                    )}
                  </div>

                  {/* Duplicate groups */}
                  {dedupeGroups.length > 0 && (
                    <div className="border-b border-white/[0.06] shrink-0">
                      <div className="px-6 py-3">
                        <h3 className="text-[10px] uppercase tracking-[0.14em] text-gray-600 font-semibold mb-2.5">Duplicate Groups</h3>
                        <div className="max-h-44 overflow-y-auto space-y-2">
                          {dedupeGroups.slice(0, 10).map((group, i) => (
                            <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5">
                              <div className="flex items-center justify-between mb-2">
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
                                    <span className="ml-auto text-gray-600 tabular-nums">{formatBytes(dup.sizeBytes)}</span>
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
                    </div>
                  )}

                  {/* Table */}
                  <div className="flex-1 overflow-hidden" role="region" aria-label="Scan results">
                    <div className="px-6 py-2.5 border-b border-white/[0.06] grid grid-cols-[28px_1fr_150px_110px_110px_28px] gap-4 text-[10px] uppercase tracking-[0.14em] text-gray-600 font-semibold bg-white/[0.01]">
                      <span></span>
                      <span>Path</span>
                      <span>Category</span>
                      <span className="text-right">Size</span>
                      <span className="text-right">Modified</span>
                      <span></span>
                    </div>

                    <div ref={parentRef} className="h-[calc(100%-41px)] overflow-auto">
                      <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
                        {rowVirtualizer.getVirtualItems().map((vRow) => {
                          const entry = sortedEntries[vRow.index];
                          const isExpanded = expandedIdx === vRow.index;
                          const tierColors = TIER_COLORS[entry.riskTier];
                          const isSelected = selectedPaths.has(entry.path);

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
                              className={`border-b border-white/[0.04] transition-colors ${
                                isSelected ? 'bg-emerald-500/[0.06]' : isExpanded ? 'bg-white/[0.02]' : 'hover:bg-white/[0.015]'
                              }`}
                            >
                              <button
                                onClick={() => setExpandedIdx(isExpanded ? null : vRow.index)}
                                className="w-full px-6 py-3 grid grid-cols-[28px_1fr_150px_110px_110px_28px] gap-4 items-center text-left focus:outline-none focus:bg-white/[0.03]"
                                aria-expanded={isExpanded}
                                aria-label={`${entry.path}, ${formatBytes(entry.sizeBytes)}, ${entry.category}, ${entry.riskTier} risk`}
                              >
                                <div className="flex items-center justify-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => togglePathSelection(entry.path, entry.riskTier)}
                                    disabled={entry.riskTier === 'dangerous'}
                                    className="w-4 h-4 rounded-[5px] border-gray-700 bg-transparent text-emerald-500 focus:ring-emerald-500/30 focus:ring-offset-0 disabled:opacity-30 cursor-pointer"
                                    aria-label={`Select ${truncatePath(entry.path)}`}
                                  />
                                </div>
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${tierColors.dot}`} />
                                  <span className="text-[13px] text-gray-300 truncate font-mono">
                                    {truncatePath(entry.path)}
                                  </span>
                                </div>
                                <div>
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${tierColors.bg} ${tierColors.text} ${tierColors.border} border`}>
                                    {CATEGORY_LABELS[entry.category]}
                                  </span>
                                </div>
                                <span className="text-[13px] text-gray-300 text-right tabular-nums font-medium">{formatBytes(entry.sizeBytes)}</span>
                                <span className="text-xs text-gray-500 text-right tabular-nums">{formatDate(entry.lastModified)}</span>
                                <ChevronRight className={`w-4 h-4 text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                              </button>

                              {isExpanded && (
                                <div className="px-6 pb-4 pl-[56px]">
                                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                                      <div>
                                        <span className="text-gray-600 text-[11px] block uppercase tracking-wider mb-0.5">Full Path</span>
                                        <span className="text-gray-300 font-mono text-xs break-all">{entry.path}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600 text-[11px] block uppercase tracking-wider mb-0.5">Size</span>
                                        <span className="text-gray-300 font-mono text-xs">{formatBytes(entry.sizeBytes)} ({entry.sizeBytes.toLocaleString()} bytes)</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600 text-[11px] block uppercase tracking-wider mb-0.5">Last Accessed</span>
                                        <span className="text-gray-300 text-xs">{formatDate(entry.lastAccessed)}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600 text-[11px] block uppercase tracking-wider mb-0.5">Risk Tier</span>
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
                    <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                      <Filter className="w-6 h-6 text-gray-600" />
                    </div>
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
          <div className="border-t border-white/[0.06] bg-[#0a0a12] px-6 py-3 shrink-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <span className="text-sm text-gray-300 whitespace-nowrap">
                  <span className="font-semibold text-white tabular-nums">{selectedPaths.size}</span> items selected
                </span>
                <span className="text-sm text-emerald-400 font-semibold tabular-nums whitespace-nowrap">{formatBytes(selectedBytes)}</span>
                <div className="hidden md:flex items-center gap-2">
                  {selectedByTier.safe > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> safe · {formatBytes(selectedByTier.safe)}
                    </span>
                  )}
                  {selectedByTier.caution > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> caution · {formatBytes(selectedByTier.caution)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <select
                  value={deletionMode}
                  onChange={(e) => setDeletionMode(e.target.value as 'trash' | 'permanent')}
                  className="text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-2 text-gray-300 focus:outline-none focus:border-emerald-500/50"
                  aria-label="Deletion mode"
                >
                  <option value="trash">Move to Trash</option>
                  <option value="permanent">Delete Permanently</option>
                </select>
                <button
                  onClick={() => { setDeletionResults(null); setShowConfirmModal(true); }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-500/20"
                >
                  Clean Selected
                </button>
                <button
                  onClick={() => setSelectedPaths(new Set())}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-1"
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
              className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
              style={{ width: `${deletionTotal > 0 ? (deletionProgress / deletionTotal) * 100 : 0}%` }}
            />
          </div>
        )}

        {/* Bottom progress bar */}
        {state === 'scanning' && (
          <div className="h-1 bg-white/[0.04] shrink-0">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 animate-pulse w-full" />
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

/* ============ Sub-components ============ */

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub: React.ReactNode;
  accent: 'violet' | 'blue' | 'emerald' | 'amber';
}) {
  const accents = {
    violet: { icon: 'bg-emerald-500/10 text-emerald-400', ring: 'group-hover:ring-emerald-500/30' },
    blue: { icon: 'bg-blue-500/10 text-blue-400', ring: 'group-hover:ring-blue-500/30' },
    emerald: { icon: 'bg-emerald-500/10 text-emerald-400', ring: 'group-hover:ring-emerald-500/30' },
    amber: { icon: 'bg-amber-500/10 text-amber-400', ring: 'group-hover:ring-amber-500/30' },
  } as const;

  return (
    <div className={`group rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:bg-white/[0.03] hover:ring-1 ${accents[accent].ring}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-[0.12em] text-gray-600 font-semibold">{label}</span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${accents[accent].icon}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-xl font-bold tracking-tight tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-gray-500">{sub}</div>
    </div>
  );
}

function TierBar({ distribution }: { distribution: Array<{ tier: RiskTier; bytes: number; pct: number }> }) {
  const colors: Record<RiskTier, string> = {
    safe: 'bg-emerald-400',
    caution: 'bg-amber-400',
    dangerous: 'bg-rose-400',
  };
  return (
    <div className="flex items-center gap-3 mt-1">
      <div className="flex h-1.5 flex-1 rounded-full bg-white/[0.05] overflow-hidden">
        {distribution.map((d) => (
          <div
            key={d.tier}
            className={colors[d.tier]}
            style={{ width: `${d.pct}%` }}
            title={`${d.tier}: ${formatBytes(d.bytes)}`}
          />
        ))}
      </div>
      <div className="flex items-center gap-2.5">
        {distribution.filter((d) => d.bytes > 0).map((d) => (
          <span key={d.tier} className="flex items-center gap-1 text-[10px] text-gray-500">
            <span className={`w-1.5 h-1.5 rounded-full ${colors[d.tier]}`} />
            <span className="capitalize">{d.tier}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function IdleState({ onStart }: { onStart: () => void }) {
  return (
    <div className="h-full flex items-center justify-center relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] rounded-full bg-emerald-500/[0.06] blur-[120px]" />
      </div>
      <div className="relative text-center max-w-md px-6">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500/15 to-cyan-600/15 border border-emerald-500/25 flex items-center justify-center mx-auto mb-7 shadow-2xl shadow-emerald-500/10">
          <FolderOpen className="w-11 h-11 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-100 mb-2">Ready to scan</h2>
        <p className="text-gray-500 text-[15px] leading-relaxed mb-8">
          Select the categories you want to scan, then start a scan to find reclaimable disk space on your system.
        </p>
        <button
          onClick={onStart}
          className="inline-flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 rounded-xl font-medium text-sm transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 active:scale-[0.99]"
        >
          <Play className="w-4 h-4" /> Start First Scan
        </button>
        <div className="mt-8 flex items-center justify-center gap-5 text-[11px] text-gray-600">
          <span className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-emerald-500/70" /> Read-only until you confirm</span>
          <span className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-emerald-500/70" /> 100% local</span>
        </div>
      </div>
    </div>
  );
}

function ScanningState({ progress }: { progress: ScanProgress | null }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-28 h-28 mx-auto mb-7">
          <div className="absolute inset-0 rounded-full border-2 border-emerald-500/15" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <HardDrive className="w-9 h-9 text-emerald-400" />
          </div>
        </div>
        <p className="text-gray-200 text-[15px] font-medium mb-2">Scanning your system…</p>
        {progress && (
          <p className="text-gray-500 text-xs tabular-nums">
            {progress.entriesFound.toLocaleString()} files · {formatBytes(progress.bytesFound)}
          </p>
        )}
        <div className="mt-6 mx-auto w-48 h-1 bg-white/[0.05] rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-8 h-8 text-rose-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-200 mb-2">Scan failed</h2>
        <p className="text-gray-500 text-sm mb-6">{message || 'An unexpected error occurred during the scan.'}</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] rounded-xl text-sm font-medium transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Try Again
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
    const aTime = new Date(grouped[a][0]?.deletedAt ?? 0).getTime() || 0;
    const bTime = new Date(grouped[b][0]?.deletedAt ?? 0).getTime() || 0;
    return bTime - aTime;
  });

  if (entries.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
            <History className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-400 text-sm">No cleanup history yet</p>
          <p className="text-gray-600 text-xs mt-1">Items you clean will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-8 py-7">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-lg font-semibold tracking-tight text-gray-100 mb-1">Recent Cleanups</h2>
        <p className="text-sm text-gray-500 mb-6">Every cleanup is logged here — full transparency for everything you remove.</p>
        <div className="space-y-4">
          {batches.map(([batchId, batchEntries]) => {
            const batchTime = batchEntries[0]?.deletedAt;
            const completed = batchEntries.filter((e) => e.status === 'completed').length;
            const failed = batchEntries.filter((e) => e.status === 'failed').length;
            const totalBytes = batchEntries
              .filter((e) => e.status === 'completed')
              .reduce((s, e) => s + e.sizeBytes, 0);

            return (
              <div key={batchId} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-4.5 h-4.5 w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-sm text-gray-200 font-medium">
                        {completed} deleted
                        {failed > 0 && <span className="text-rose-400 ml-2">{failed} failed</span>}
                      </span>
                      <div className="text-xs text-gray-500">
                        {batchTime ? new Date(batchTime).toLocaleString() : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-emerald-400 tabular-nums">{formatBytes(totalBytes)}</span>
                    <span className="text-[10px] text-gray-600 uppercase tracking-wider">reclaimed</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {batchEntries.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="flex items-center gap-2.5 text-xs rounded-lg px-2.5 py-1.5 hover:bg-white/[0.02]">
                      {entry.status === 'completed' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      )}
                      <span className="text-gray-400 font-mono truncate flex-1">{truncatePath(entry.path)}</span>
                      <span className="text-gray-600 tabular-nums">{formatBytes(entry.sizeBytes)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        entry.mode === 'trash' ? 'bg-blue-500/10 text-blue-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {entry.mode === 'trash' ? 'Trash' : 'Permanent'}
                      </span>
                    </div>
                  ))}
                  {batchEntries.length > 5 && (
                    <p className="text-xs text-gray-600 pl-6">+{batchEntries.length - 5} more items</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Confirm deletion">
      <div className="bg-[#101018] border border-white/[0.08] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl shadow-black/50">
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            mode === 'permanent' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
          }`}>
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-gray-100 leading-tight">Confirm Cleanup</h3>
            <p className="text-xs text-gray-500">Double-check before anything is removed</p>
          </div>
        </div>

        <div className="bg-white/[0.03] rounded-xl p-4 mb-4 space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Items to delete</span>
            <span className="text-gray-100 font-semibold tabular-nums">{entries.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Space to reclaim</span>
            <span className="text-emerald-400 font-semibold tabular-nums">{formatBytes(totalBytes)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Method</span>
            <span className={mode === 'trash' ? 'text-blue-400 font-medium' : 'text-rose-400 font-medium'}>
              {mode === 'trash' ? 'Move to Trash' : 'Permanent Delete'}
            </span>
          </div>
        </div>

        {needsExtraConfirm && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 mb-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm space-y-1">
                {hasDangerous && <p className="text-amber-300">Some items are marked as <strong>dangerous</strong>.</p>}
                {mode === 'permanent' && <p className="text-amber-300">Permanent deletion <strong>cannot be undone</strong>.</p>}
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-600 mb-5">
          Items will be logged in the cleanup journal for full transparency.
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
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-lg ${
              mode === 'permanent'
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
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
  const allOk = results.totalFailed === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Deletion results">
      <div className="bg-[#101018] border border-white/[0.08] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl shadow-black/50">
        <div className="text-center mb-5">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${
            allOk ? 'bg-emerald-500/10 border border-emerald-500/25' : 'bg-amber-500/10 border border-amber-500/25'
          }`}>
            {allOk ? (
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-7 h-7 text-amber-400" />
            )}
          </div>
          <h3 className="text-lg font-semibold tracking-tight text-gray-100">
            {allOk ? 'Cleanup complete' : 'Cleanup finished with warnings'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {formatBytes(results.bytesReclaimed)} reclaimed
          </p>
        </div>

        <div className="bg-white/[0.03] rounded-xl p-4 mb-5 grid grid-cols-2 gap-3 text-center">
          <div>
            <div className="text-xl font-bold text-emerald-400 tabular-nums">{results.totalSucceeded}</div>
            <div className="text-[11px] text-gray-500 uppercase tracking-wider mt-0.5">Deleted</div>
          </div>
          <div>
            <div className={`text-xl font-bold tabular-nums ${results.totalFailed > 0 ? 'text-rose-400' : 'text-gray-500'}`}>
              {results.totalFailed}
            </div>
            <div className="text-[11px] text-gray-500 uppercase tracking-wider mt-0.5">Failed</div>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="w-full px-4 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-xl text-sm font-medium transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}
