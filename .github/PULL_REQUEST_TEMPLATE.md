## Summary

<!-- What does this PR do? -->

## Safety Checklist (per §7 of CLEER-architecture.md)

- [ ] This change does NOT add silent/automatic deletion
- [ ] This change does NOT broaden system-path exclusions without human sign-off
- [ ] This change does NOT add telemetry that includes file paths/names
- [ ] This change does NOT fetch and execute remote rule logic as code

## If touching Scanner, Rules Engine, or Deletion Executor

- [ ] Unit tests prove system-excluded paths are rejected even if passed in directly
- [ ] Unit tests prove the undo journal is written before the filesystem operation
- [ ] No code path exists where `permanent: true` can be reached without explicit separate confirmation

## Platforms affected

- [ ] Windows
- [ ] macOS
- [ ] Linux
- [ ] Cross-platform

## Testing

- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes (all 39+ tests green)
- [ ] `pnpm build` passes
- [ ] Tested on (list OSes):
