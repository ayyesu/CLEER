# CLEER — Computer Lifecycle, Efficiency & Environment Recovery

**Type:** Cross-platform Electron desktop app (Windows, macOS, Linux)
**Purpose:** Help users safely find and reclaim disk space — duplicate files, caches, logs, large/old files, dev artifacts, package manager junk, orphaned app leftovers — without risking data loss or system breakage.

---

## 1. Product Scope

### 1.1 In scope
- Scan local disks/volumes for reclaimable space across common categories.
- Classify findings by risk tier (safe / caution / dangerous).
- Present findings with clear size, count, and last-modified/last-accessed data.
- Let the user select what to remove; nothing is deleted without explicit confirmation.
- Move deleted items to OS Trash/Recycle Bin by default, not permanent delete.
- Support scheduled/background scans (opt-in) with notification, not auto-delete.
- Per-platform aware scan targets (see §5).

### 1.2 Out of scope (v1)
- Cloud storage cleanup (Google Drive, OneDrive, iCloud files).
- Registry editing on Windows.
- System file / OS-protected file removal.
- Anything requiring root/admin escalation for *deletion* (scanning may read privileged paths where permitted; deleting protected system paths is never allowed — see §7).

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Electron App                            │
│                                                                   │
│  ┌───────────────────┐        IPC (contextBridge)   ┌─────────┐ │
│  │   Renderer (UI)    │ ◄───────────────────────────►│  Main   │ │
│  │  React + Vite      │        typed channels only    │ Process │ │
│  │  no Node access    │                                └────┬────┘ │
│  └───────────────────┘                                     │      │
│                                                              │      │
│                                              ┌───────────────┴───┐ │
│                                              │   Core Services    │ │
│                                              │ (run in Main or    │ │
│                                              │  Worker Threads)   │ │
│                                              ├─────────────────────┤ │
│                                              │ • Scanner Engine    │ │
│                                              │ • Classifier/Rules  │ │
│                                              │ • Risk Tier Engine  │ │
│                                              │ • Deletion Executor │ │
│                                              │ • Trash Adapter     │ │
│                                              │ • Platform Adapter  │ │
│                                              │ • Scheduler         │ │
│                                              │ • Telemetry (opt-in)│ │
│                                              └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Process separation is non-negotiable:**
- Renderer process: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.
- All filesystem access happens in the Main process or in Worker Threads spawned by Main.
- Renderer talks to Main only through a typed `contextBridge` API (`window.cleer.*`), never raw IPC strings scattered through UI code.

---

## 3. Core Modules

### 3.1 Scanner Engine
- Walks target directories using async streaming (never blocks event loop).
- Runs in `worker_threads` (one pool per scan category) to keep UI responsive.
- Produces a normalized `ScanEntry`:
  ```ts
  interface ScanEntry {
    path: string;
    sizeBytes: number;
    kind: 'file' | 'directory' | 'symlink';
    category: CleanupCategory;
    lastAccessed?: Date;
    lastModified?: Date;
    ownerApp?: string;       // e.g. detected from path heuristics
    isDuplicateOf?: string;  // hash-linked path, if dedupe category
  }
  ```
- Uses incremental hashing (xxhash/blake3, not md5) only for duplicate-detection category, and only after a cheap size-bucket pre-filter to avoid hashing everything.

### 3.2 Rules Engine / Classifier
- Declarative rule definitions (JSON/YAML) per category and per OS, not hardcoded path logic scattered in code.
- Each rule declares:
  ```json
  {
    "id": "npm-cache",
    "category": "dev-cache",
    "platforms": ["darwin", "linux", "win32"],
    "paths": ["~/.npm/_cacache"],
    "riskTier": "safe",
    "regenerable": true,
    "description": "npm package cache, safe to clear, will be rebuilt automatically"
  }
  ```
- Rules are versioned and shipped with the app; a signed remote rule-update channel is a stretch goal, not v1.

### 3.3 Risk Tier Engine
Three tiers only — no ambiguity in UI:
| Tier | Meaning | Default UI state |
|---|---|---|
| **Safe** | Regenerable caches, temp files, known-safe app leftovers | Pre-checked |
| **Caution** | Old downloads, large unused files, orphaned app support folders | Unchecked, shown with explanation |
| **Dangerous** | Anything touching user documents, active app data, or unclear ownership | Never surfaced for one-click delete; requires explicit per-item confirmation with a typed "I understand" step for bulk actions |

### 3.4 Deletion Executor
- Every delete operation goes through a single choke point: `executeDeletion(entries: ScanEntry[], options)`.
- Default behavior: move to OS Trash/Recycle Bin (`shell.trashItem` in Electron, or platform-native fallback).
- Permanent delete is opt-in per action, requires a separate confirmation, and is logged.
- All deletions are logged to a local, user-viewable **undo journal** (path, size, timestamp, tier) before the action runs, so the user can review "what did CLEER do" even after emptying Trash.
- Batches are transactional in intent: if a batch partially fails, report exactly which items succeeded/failed — never silently swallow errors.

### 3.5 Platform Adapter
- One adapter per OS behind a common interface (`IPlatformAdapter`): resolves special folders, checks permissions (e.g., macOS Full Disk Access, Windows admin state), and trash semantics.
- No `process.platform` checks scattered through business logic — only inside adapters.

### 3.6 Scheduler (opt-in)
- Background scans on a timer or idle-detection trigger.
- Scheduler **never deletes automatically** — it only prepares a report and notifies the user. Deletion always requires an active session confirmation.

### 3.7 Telemetry (strictly opt-in, off by default)
- If added: anonymized counts only (category, bytes reclaimed) — never file paths or names.

---

## 4. Data Flow (typical scan → clean cycle)

1. User selects scan categories + target volume(s) in UI.
2. Renderer calls `window.cleer.scan.start(options)`.
3. Main spawns worker(s) per category; workers stream `ScanEntry` batches back via `postMessage`.
4. Main applies Rules Engine + Risk Tier Engine, forwards classified batches to Renderer via IPC events (`scan:progress`, `scan:result-batch`).
5. Renderer renders results grouped by category/tier, live-updating totals.
6. User selects items → clicks "Clean Selected".
7. Renderer sends `window.cleer.clean.execute(entryIds, { mode: 'trash' | 'permanent' })`.
8. Main writes undo-journal entries, then calls Deletion Executor.
9. Main streams per-item result (`clean:progress`) back to Renderer.
10. Renderer shows summary: bytes reclaimed, items skipped/failed, link to undo journal.

---

## 5. Platform-Specific Scan Targets (representative, not exhaustive)

**Windows**
- `%TEMP%`, `%LOCALAPPDATA%\Temp`
- Windows.old, Delivery Optimization cache (requires elevation awareness)
- Browser caches, npm/yarn/pip caches, `node_modules` older than N days
- Recycle Bin size (report only; emptying is a distinct explicit action)

**macOS**
- `~/Library/Caches`, `~/Library/Logs`
- Xcode DerivedData, iOS device support files, simulator caches
- Homebrew cache (`brew cleanup --dry-run` equivalent logic)
- `~/Library/Application Support/<orphaned-app>` (only flagged as Caution, requires app-uninstall correlation)

**Linux**
- `~/.cache`, `/var/cache` (read permission dependent)
- `journalctl` vacuum candidates (report size, defer actual vacuum to `systemd` command, don't reimplement)
- Package manager caches (`apt`, `dnf`, `pacman`) via safe dry-run commands, not manual file deletion of package DBs
- Flatpak/Snap unused runtimes

All OS-protected/system paths (e.g. `C:\Windows\System32`, `/System`, `/usr` on Linux without explicit override) are **hard-excluded** at the Scanner level, not just filtered in UI.

---

## 6. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Shell | Electron (latest stable) | Cross-platform, native Trash API, mature packaging |
| UI | React + TypeScript + Vite | Fast dev loop, typed contracts with Main |
| State | Zustand or Redux Toolkit | Predictable scan/clean state machine |
| Styling | Tailwind (or CSS modules) | Fast iteration, consistent design tokens |
| IPC contract | `zod`-validated typed channels | Catch malformed payloads at the boundary |
| Hashing | `blake3` (via native binding) | Fast dedupe hashing |
| Packaging | `electron-builder` | Code signing + auto-update support per OS |
| Testing | Vitest (unit), Playwright (E2E on packaged app) | |
| Package manager | `pnpm` | Fast installs, strict node_modules (fewer phantom-dependency bugs), efficient monorepo support if main/preload/renderer/rules get split into workspaces |

---

## 7. Safety Rules (Product-Level, Hard Constraints)

These are invariants, not preferences. Any code change that violates one of these should be rejected in review regardless of who wrote it.

1. **No silent deletion.** Every delete requires a user action that follows a visible list of exactly what will be removed.
2. **Trash by default.** Permanent delete is a distinct, separately-confirmed mode.
3. **System paths are hard-excluded** at the Scanner and Executor layers (defense in depth — exclude in two places, not one).
4. **Dangerous tier never batch-selects.** "Select All" only applies within Safe/Caution tiers.
5. **Undo journal is written before deletion, not after.** If the app crashes mid-batch, the journal still reflects intent.
6. **No auto-delete from the Scheduler**, ever, under any settings combination.
7. **No remote code execution.** Rule definitions are data (JSON/YAML), never executable scripts fetched at runtime.
8. **Least privilege.** The app never requests admin/root elevation for scanning. Elevation, if ever needed for a specific deletion (e.g. certain Windows paths), is requested per-action with a clear explanation, never at app launch.

---

## 8. Rules for Coding Agents Working on This Repo

These apply to any AI coding agent (or human) making changes in this codebase.

### 8.1 Before writing code
- Read `§7 Safety Rules` above. If a task seems to require violating one of them, stop and flag it instead of implementing a workaround.
- Check whether the change touches the **Deletion Executor** or **Scanner exclusion list** — these are the two highest-risk files in the repo (`src/main/services/deletionExecutor.ts`, `src/main/services/platformExclusions.ts`) and changes to them require an explicit note in the PR description explaining the safety implications.
- Prefer extending the Rules Engine (data) over adding new hardcoded path logic in TypeScript.

### 8.2 Process boundaries
- Never add filesystem, `child_process`, or native module access to renderer-side code.
- Never set `nodeIntegration: true`, disable `contextIsolation`, or disable `sandbox` on any `BrowserWindow`.
- All new Main↔Renderer communication must go through the typed `contextBridge` API and be validated with a schema (zod) on both sides of the boundary.

### 8.3 Deletion-path changes specifically
- Any change to deletion logic must include:
  - A unit test proving system-excluded paths are rejected even if passed in directly.
  - A unit test proving the undo journal is written before the filesystem operation.
  - No code path where `permanent: true` can be reached without an explicit, separate user confirmation flag from the caller.
- Never remove or weaken an existing exclusion without a corresponding entry in `CHANGELOG.md` explaining why, plus reviewer sign-off.

### 8.4 Cross-platform discipline
- New scan targets go into the Rules Engine definitions (`/rules/<os>/*.json`), not inline conditionals.
- `process.platform` checks are only allowed inside `src/main/platform/*Adapter.ts` files.
- Any new rule must specify `riskTier` and `regenerable` — PRs adding a rule without both fields should be rejected.

### 8.5 Testing expectations
- Unit tests (Vitest) for: rule matching, risk-tier assignment, exclusion enforcement, undo-journal writes.
- E2E tests (Playwright, run against packaged/dev app) for the full scan → select → clean → undo-journal-visible flow, on at least a mocked filesystem fixture per OS.
- No PR that touches Scanner, Rules Engine, or Deletion Executor merges without passing tests — this is a hard gate, not a suggestion.

### 8.6 Code style / structure
- Use `pnpm` for all install/add/run commands — never `npm install` or `yarn add`. Commit `pnpm-lock.yaml`; do not commit `package-lock.json` or `yarn.lock`.
- If the project splits into workspaces (e.g. `main`, `preload`, `renderer`, `rules`), use `pnpm` workspaces (`pnpm-workspace.yaml`) rather than a separate monorepo tool.
- TypeScript strict mode on.
- One responsibility per service file; no "god files" mixing scanning + deletion + UI state.
- IPC channel names are constants in a single `ipcChannels.ts`, never inline strings.
- Errors surfaced to the user must be actionable ("Couldn't access ~/Library/Caches — check Full Disk Access in System Settings"), never raw stack traces in UI.

### 8.7 Commit / PR conventions
- Conventional commits (`feat:`, `fix:`, `refactor:`, `safety:` — use `safety:` prefix for any change touching §7 invariants so it's greppable in history).
- PR description must state: what categories/platforms are affected, and confirm which §7 safety rules were considered.

### 8.8 What agents should refuse or escalate instead of implementing
- Any request to add silent/automatic deletion.
- Any request to broaden system-path exclusions without human sign-off.
- Any request to add telemetry that includes file paths/names.
- Any request to fetch and execute remote rule logic as code rather than data.

---

## 9. Suggested Folder Structure

```
cleer/
├── src/
│   ├── main/
│   │   ├── services/
│   │   │   ├── scannerEngine.ts
│   │   │   ├── rulesEngine.ts
│   │   │   ├── riskTierEngine.ts
│   │   │   ├── deletionExecutor.ts
│   │   │   ├── undoJournal.ts
│   │   │   └── scheduler.ts
│   │   ├── platform/
│   │   │   ├── windowsAdapter.ts
│   │   │   ├── macAdapter.ts
│   │   │   ├── linuxAdapter.ts
│   │   │   └── platformExclusions.ts
│   │   ├── workers/
│   │   │   └── scanWorker.ts
│   │   ├── ipc/
│   │   │   ├── ipcChannels.ts
│   │   │   └── handlers.ts
│   │   └── index.ts
│   ├── preload/
│   │   └── index.ts        // contextBridge only
│   ├── renderer/
│   │   ├── components/
│   │   ├── state/
│   │   └── App.tsx
│   └── shared/
│       ├── types.ts
│       └── schemas.ts      // zod schemas shared by main + renderer
├── rules/
│   ├── windows/*.json
│   ├── macos/*.json
│   └── linux/*.json
├── tests/
│   ├── unit/
│   └── e2e/
└── CHANGELOG.md
```

---

## 10. Milestones

1. **M1 — Scan-only MVP:** Scanner + Rules Engine + Risk Tier + read-only report UI, no deletion.
2. **M2 — Safe deletion:** Deletion Executor (Trash mode only) + undo journal, Safe tier only.
3. **M3 — Full tiers:** Caution/Dangerous tiers with confirmation flows, dedupe detection.
4. **M4 — Scheduler + notifications** (still no auto-delete).
5. **M5 — Packaging & auto-update** for all three OSes, code signing.
