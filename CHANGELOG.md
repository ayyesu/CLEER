# Changelog

## [Unreleased]

### Added
- Initial project scaffold from CLEER architecture document.
- Core modules: Scanner Engine, Rules Engine, Risk Tier Engine, Deletion Executor, Undo Journal, Scheduler.
- Platform adapters for Windows, macOS, Linux.
- Typed IPC channels with zod validation.
- `contextBridge` preload API (`window.cleer.*`).
- Declarative rule definitions for npm cache, temp files, Xcode DerivedData, APT cache.
- System path exclusions for all three platforms.
- Unit tests for exclusions, risk tier classification, and schema validation.

### Safety
- System paths hard-excluded at Scanner level (see `platformExclusions.ts`).
- Undo journal writes before filesystem operations.
- Trash-by-default deletion mode; permanent delete requires separate confirmation.
