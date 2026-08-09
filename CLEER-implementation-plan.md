# CLEER — Implementation Plan

Companion to `CLEER-architecture.md`. This is the build order: what to do, in what sequence, and what "done well" looks like at each step. Follow phases in order — don't start Deletion Executor work before Scanner + Rules Engine are solid, and don't start packaging before cross-platform testing is real (not assumed).

---

## Guiding Principle

**Scan is a solved problem in v1; deletion is the risky problem.** So the plan front-loads scanning, classification, and read-only UI until they're trustworthy on real machines across all three OSes — *then* introduces deletion, starting with the safest tier and the safest mode (Trash), and only widens scope once each layer has tests proving the safety invariants in §7 of the architecture doc.

---

## Phase 0 — Project Setup (0.5–1 day)

1. **Scaffold the Electron + TypeScript + Vite project.**
   - Use `electron-vite` as the base (handles main/preload/renderer build separation correctly out of the box — don't hand-roll this).
   - `pnpm init`, add `pnpm-workspace.yaml` if going multi-package from the start (recommended: keep `rules/` and `shared/` as separate workspace packages even in a single repo, so type contracts are enforced, not just conventions).
2. **Lock down security defaults immediately**, before any feature code exists:
   - `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` on the `BrowserWindow`.
   - Empty `preload/index.ts` with just a placeholder `contextBridge.exposeInMainWorld('cleer', {})`.
   - Add an ESLint rule / CI check that fails the build if `nodeIntegration` or `contextIsolation: false` ever appears in the codebase (grep-based check is fine).
3. **Set up tooling:** TypeScript strict mode, ESLint, Prettier, Vitest, Playwright (config only, tests come later), Husky + lint-staged for pre-commit.
4. **CI pipeline (GitHub Actions):** matrix build on `windows-latest`, `macos-latest`, `ubuntu-latest` from day one — even with just a "hello world" Electron window. Cross-platform breakage is much cheaper to catch now than after 3 phases of feature work.

**Exit criterion:** empty Electron app launches and passes CI on all 3 OSes.

---

## Phase 1 — Shared Contracts First (1–2 days)

Do this before any real scanning logic. Getting the types right early avoids expensive rework later.

1. Define `shared/types.ts`: `ScanEntry`, `CleanupCategory`, `RiskTier`, `CleanupRule`, `ScanOptions`, `CleanOptions`.
2. Define `shared/schemas.ts`: zod schemas mirroring every type above, used to validate every IPC payload at the boundary in both directions.
3. Define `ipc/ipcChannels.ts`: every channel name as a named constant (`SCAN_START`, `SCAN_PROGRESS`, `SCAN_RESULT_BATCH`, `CLEAN_EXECUTE`, `CLEAN_PROGRESS`, `UNDO_JOURNAL_GET`, etc.). No inline string literals anywhere else in the codebase.
4. Write the `contextBridge` API surface in `preload/index.ts` as fully typed functions (`scan.start`, `scan.onProgress`, `clean.execute`, …), each validating its own payload against the zod schema before sending.

**Exit criterion:** `window.cleer` is fully typed and callable from the renderer, even though the handlers on the Main side just return mock data. This lets UI work start in parallel with engine work if you have more than one contributor.

---

## Phase 2 — Rules Engine (2–3 days)

1. Design the rule JSON schema (see architecture §3.2) and validate it with a zod schema too — malformed rule files should fail CI, not fail silently at runtime.
2. Write an initial rule set per OS covering only the most common, lowest-risk categories first:
   - Windows: `%TEMP%`, browser caches, npm/yarn/pip caches.
   - macOS: `~/Library/Caches`, `~/Library/Logs`, Homebrew cache.
   - Linux: `~/.cache`, package manager caches.
3. Build the Rules Engine loader: reads all `rules/<os>/*.json` at startup, validates, indexes by category.
4. Unit test: every shipped rule file passes schema validation, every rule specifies `riskTier` and `regenerable`, no rule path resolves inside a hard-excluded system directory (cross-check against Phase 3's exclusion list once it exists).

**Exit criterion:** `rulesEngine.getRulesForPlatform('darwin')` returns validated, typed rules; 100% of shipped rule files pass validation in CI.

---

## Phase 3 — Platform Adapters & Exclusion List (2–3 days)

Build this *before* the Scanner, since the Scanner depends on it for safety.

1. `IPlatformAdapter` interface: resolve special folders (`getCachesDir()`, `getTempDir()`, etc.), trash semantics, permission checks (macOS Full Disk Access detection, Windows admin state).
2. One concrete adapter per OS.
3. **`platformExclusions.ts`**: hard-coded, heavily-tested deny-list of system paths per OS (`C:\Windows`, `/System`, `/usr`, `/bin`, `/etc`, etc.) plus a path-normalization + prefix-check function that can't be bypassed by `..`, symlink tricks, or trailing slashes.
4. Unit tests specifically trying to defeat the exclusion check: symlinked paths, relative paths, case variations on case-insensitive filesystems (Windows/macOS default), trailing slash variants, UNC paths on Windows.

**Exit criterion:** exclusion check has a dedicated test suite with adversarial cases, and it's wired to be called from *two* places later (Scanner and Deletion Executor), per the defense-in-depth rule in the architecture doc.

---

## Phase 4 — Scanner Engine (3–5 days)

1. Implement the worker-thread pool: one worker type per category, spawned from Main, streaming results back via `postMessage` in batches (don't send one message per file — batch every N entries or every X ms, whichever comes first, to avoid IPC flooding).
2. Async directory walking with backpressure — never load an entire large tree into memory before yielding results.
3. Wire in the exclusion check from Phase 3 as the first filter, before any rule matching.
4. Wire in the Rules Engine from Phase 2 to classify each entry into a category + risk tier as it's found.
5. Size-bucket pre-filter for duplicate detection (defer full hashing to Phase 6 — don't build dedupe into the core scan loop, keep it as an optional secondary pass).
6. Progress reporting: entries scanned, bytes found so far, current path (throttled) — Main forwards this to Renderer via IPC events.

**Exit criterion:** a scan of a real, large home directory on each OS completes without blocking the UI thread, respects exclusions, and produces correctly tiered results. Profile this — scanning should feel fast; if a category is slow (e.g. `node_modules` detection needing deep recursion), consider a depth cap with a "scan deeper" opt-in rather than always going unbounded.

---

## Phase 5 — Read-Only Results UI (3–5 days)

Build the full reporting UI before any delete button exists.

1. Category/tier grouped results list with virtualized rendering (don't render 50,000 DOM rows — use `react-window` or similar; this matters a lot for a disk-cleanup tool where result sets can be huge).
2. Live-updating totals as scan batches stream in.
3. Per-item detail (path, size, last modified/accessed, why it's classified this way — surface the rule's `description`).
4. Empty/loading/error states, including graceful handling of permission-denied paths (macOS Full Disk Access is the big one — detect it and show an actionable prompt, don't just silently skip).
5. Accessibility pass: keyboard navigation through results, proper ARIA roles on the list — this is a system utility, likely used by a wide range of users; don't treat a11y as optional.

**Exit criterion:** a user can run a full scan and understand exactly what was found and why, on all three OSes, with zero delete capability yet. This is a good internal milestone to dogfood — run it on your own machine and sanity-check the results before writing a single line of deletion code.

---

## Phase 6 — Duplicate Detection (2–3 days, can run parallel to Phase 5)

1. Secondary pass, opt-in per scan: for entries above a minimum size in the size-bucket groups from Phase 4, compute `blake3` hash.
2. Group by hash, mark all but one (user-configurable "keep newest" / "keep in X location" heuristic) as `isDuplicateOf`.
3. Never auto-select duplicates for deletion by default — surface them, let the user choose which copy to keep.

**Exit criterion:** duplicate groups are correctly identified on a test fixture with known duplicate files, with false-positive rate effectively zero (hash collision handling: treat hash match as candidate, confirm with byte-for-byte compare if you want zero false positives — recommended, given the cost of wrongly flagging non-duplicates as duplicate).

---

## Phase 7 — Undo Journal (1–2 days)

Build this *before* the Deletion Executor, since deletion depends on it.

1. Local append-only log (SQLite via `better-sqlite3`, or a simple JSON-lines file if you want to avoid a native dependency — SQLite is recommended for query-ability as the journal grows).
2. Schema: timestamp, path, size, category, riskTier, action (`trash`/`permanent`), status (`pending`/`completed`/`failed`), batchId.
3. Write API: `journal.recordPending(entries, batchId)` called *before* any filesystem mutation; `journal.markCompleted(id)` / `journal.markFailed(id, error)` called after.
4. Read API for a UI screen ("Recent cleanups") — this doubles as user trust-building and as debug tooling for you.

**Exit criterion:** unit test proving journal entries exist in `pending` state even if the process is killed immediately after `recordPending` and before the actual delete — this is the property that makes the journal trustworthy after a crash.

---

## Phase 8 — Deletion Executor (3–4 days)

The highest-risk phase. Go slowly here.

1. Single entry point: `executeDeletion(entries, options)`. No other code path may touch `fs.unlink`/`fs.rm`/`shell.trashItem` directly — enforce this with an ESLint rule or code-review checklist, not just convention.
2. Re-run the exclusion check from Phase 3 here too, independent of whatever filtering happened at scan time (defense in depth — scan results could theoretically be stale or tampered with between scan and delete).
3. Trash mode first: wire `shell.trashItem` (Electron's built-in cross-platform Trash API), write journal `pending` before calling it, `completed`/`failed` after, per item.
4. Permanent-delete mode second, behind a separate explicit flag that can only be set by a UI flow with its own confirmation step (not the same confirmation as Trash mode).
5. Batch semantics: process items individually, collect per-item results, never let one failure abort the whole batch silently — report a clear success/fail/skip summary.
6. Unit tests (per §8.3 of the architecture doc): exclusion enforcement even with direct calls bypassing UI, journal-before-filesystem ordering, no path to `permanent: true` without an explicit caller flag.

**Exit criterion:** deleting a real test file via Trash mode works correctly on all 3 OSes, appears in OS-native Trash/Recycle Bin, and is fully journaled. Only then move to permanent-delete mode.

---

## Phase 9 — Wire Deletion Into UI (2–3 days)

1. Selection state: checkboxes per item, "select all in category" *only* enabled for Safe/Caution tiers (per §7 rule 4 — Dangerous tier never batch-selects).
2. Confirmation modal: explicit list of what will be removed, total size, tier breakdown. Trash-mode confirmation is lighter-weight than permanent-delete confirmation (which should require a typed acknowledgement for large/risky batches).
3. Progress + results screen wired to `clean:progress` events, showing per-item success/fail.
4. "Recent cleanups" screen backed by the Undo Journal (Phase 7) — let users see history, and clarify honestly that "undo" here means "we moved it to Trash, you can restore it from there" (don't imply a magic undo button unless you build actual file restoration logic, which is a stretch goal, not v1).

**Exit criterion:** a full scan → select → confirm → delete → verify-in-journal loop works end to end on all 3 OSes.

---

## Phase 10 — Scheduler (opt-in) & Notifications (2 days)

1. Background scan on idle-detection or timer, using the same Scanner Engine from Phase 4 in report-only mode.
2. OS-native notification summarizing what was found — never auto-delete, per the hard invariant in §7.
3. Clicking the notification opens the app to the results screen from Phase 5.

**Exit criterion:** scheduled scan produces a report and notification with zero filesystem mutation, verified by a test that asserts no `executeDeletion` call happens on the scheduler code path.

---

## Phase 11 — Cross-Platform Hardening Pass (3–5 days)

Don't skip this — this is where "works on my machine" becomes "works everywhere."

1. Test on a genuinely low-disk-space machine/VM per OS (the actual target user scenario) — behavior under near-full disk (can the app even write its own journal/logs?) matters.
2. Test with restricted permissions: standard (non-admin) user on Windows, no Full Disk Access on macOS, restrictive umask on Linux. The app should degrade gracefully with clear messaging, never crash.
3. Locale/path edge cases: usernames with non-ASCII characters, paths with spaces, very long paths (Windows `MAX_PATH` historically an issue — verify long-path handling).
4. External/network drives: decide and document explicit behavior (scan them if mounted and user opts in; never assume).

**Exit criterion:** a written test matrix (OS × permission level × disk state) with pass/fail status for each combination, checked into the repo.

---

## Phase 12 — Packaging, Signing, Auto-Update (3–5 days)

1. `electron-builder` config per OS: `.exe`/NSIS installer for Windows, `.dmg`/notarized `.app` for macOS, `.AppImage`/`.deb` for Linux.
2. Code signing: Windows Authenticode cert, macOS Developer ID + notarization (required for Gatekeeper — don't skip, users will hit a scary warning otherwise). Set this up early enough that CI can produce signed builds well before launch, not the night before.
3. Auto-update channel (`electron-updater`), tested with a real version bump end-to-end, not just configured and assumed to work.
4. First-run experience: request macOS Full Disk Access with a clear explanation screen before the first scan, rather than a bare OS permission dialog with no context.

**Exit criterion:** installable, signed builds for all 3 OSes, produced by CI, that auto-update correctly from a prior test version.

---

## Phase 13 — Beta & Feedback Loop (ongoing)

1. Closed beta with real users on real machines — disk cleanup tools live or die on trust; this is not a phase to compress.
2. Instrument (if telemetry is added — opt-in, no paths/filenames per §7) category-level "bytes reclaimed" and error rates to see which rules misfire in the wild.
3. Track false-positive reports (things flagged as safe that shouldn't have been) as P0 bugs — trust, once broken, is very hard for this category of app to recover.
4. Expand the Rules Engine dataset based on real feedback rather than guessing more categories up front.

---

## Suggested Timeline (single experienced full-stack + Electron dev, rough order of magnitude)

| Phase | Duration | Cumulative |
|---|---|---|
| 0 Setup | 1 day | 1 day |
| 1 Contracts | 2 days | 3 days |
| 2 Rules Engine | 3 days | 6 days |
| 3 Adapters/Exclusions | 3 days | 9 days |
| 4 Scanner | 5 days | 14 days |
| 5 Results UI | 5 days | 19 days |
| 6 Dedupe | 3 days (parallel) | ~19 days |
| 7 Undo Journal | 2 days | 21 days |
| 8 Deletion Executor | 4 days | 25 days |
| 9 UI wiring | 3 days | 28 days |
| 10 Scheduler | 2 days | 30 days |
| 11 Hardening | 5 days | 35 days |
| 12 Packaging | 5 days | 40 days |
| 13 Beta | ongoing | — |

Roughly **8 weeks** to a signed, cross-platform beta with a small team or a focused solo dev; compress by parallelizing UI (Phase 5) against engine work (Phases 6–8) once Phase 1's contracts are locked, since both sides can build against the typed mock API.

---

## Non-Negotiable Gates Between Phases

Do not proceed past these without the exit criterion genuinely met:

- **Phase 3 → 4:** exclusion adversarial tests pass.
- **Phase 7 → 8:** journal-before-delete ordering test passes.
- **Phase 8 → 9:** Trash-mode deletion verified on all 3 OSes before UI exposes it to users.
- **Phase 11 → 12:** cross-platform test matrix fully populated, no unresolved failures.

These gates exist because the cost of a deletion bug shipped to users is categorically higher than the cost of a delayed milestone.
