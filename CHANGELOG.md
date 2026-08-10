# Changelog

All notable changes to CLEER will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-10

### Added
- Initial release.
- Scanner Engine with worker-thread-based directory walking, batching, and live progress.
- Rules Engine with declarative JSON rule definitions for Windows, macOS, Linux.
- Risk Tier Engine classifying entries into safe/caution/dangerous.
- Deletion Executor with trash-by-default and permanent-delete modes.
- Undo Journal with crash-safe pending-state writes.
- Duplicate Detection with size-bucket hashing and byte-for-byte verification.
- Cross-platform path utilities (non-ASCII, long paths, network drives).
- Disk space monitoring with low/critical thresholds.
- Permissions detection for macOS Full Disk Access, Windows UAC, Linux root.
- Scheduler with configurable intervals and OS-native notifications.
- Zero-mutation guarantee on the scheduler code path.
- Virtualized results UI with tier badges and accessibility support.
- Confirmation modal with extra warnings for dangerous items and permanent deletion.
- First-run onboarding experience (Welcome, Read-Only, Privacy, Permissions).
- electron-builder packaging for DMG, NSIS, AppImage, deb.
- Code signing hooks for Windows Authenticode and macOS notarization.
- Auto-update integration via electron-updater.
- CI pipeline with matrix build on Windows, macOS, Ubuntu.
- 140 unit and integration tests.

### Safety
- System paths hard-excluded at both scan and deletion (defense in depth).
- Undo journal written before any filesystem mutation.
- Trash-by-default deletion; permanent delete requires explicit separate confirmation.
- Dangerous-tier items never auto-selected.
- Permission-denied paths skipped gracefully with user-facing warnings.
