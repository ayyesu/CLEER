# CLEER — Cross-Platform Test Matrix

## OS × Permission Level × Disk State

| OS | Permissions | Disk State | Expected Behavior | Status |
|---|---|---|---|---|
| Windows | Admin | Normal | Full scan of all directories | ⬜ |
| Windows | Admin | Low disk (<10% free) | Full scan, warn before journal write | ⬜ |
| Windows | Admin | Critical (<5% free) | Full scan, skip journal if can't write | ⬜ |
| Windows | Standard user | Normal | Skip system dirs, scan user dirs | ⬜ |
| Windows | Standard user | Low disk | Skip system dirs, warn on low disk | ⬜ |
| macOS | FDA granted | Normal | Full scan of all directories | ⬜ |
| macOS | FDA granted | Low disk | Full scan, warn before journal write | ⬜ |
| macOS | No FDA | Normal | Skip restricted dirs, show banner | ⬜ |
| macOS | No FDA | Low disk | Skip restricted dirs, show banner + disk warn | ⬜ |
| Linux | Root | Normal | Full scan of all directories | ⬜ |
| Linux | Root | Low disk | Full scan, warn before journal write | ⬜ |
| Linux | Standard user | Normal | Skip /root, /etc/shadow, scan /home | ⬜ |
| Linux | Standard user | Low disk | Skip restricted dirs, warn on low disk | ⬜ |

## Path Edge Cases

| Case | Windows | macOS | Linux | Status |
|---|---|---|---|---|
| ASCII paths | ✅ | ✅ | ✅ | ⬜ |
| Non-ASCII (CJK) | ✅ | ✅ | ✅ | ⬜ |
| Non-ASCII (Arabic/Hebrew) | ✅ | ✅ | ✅ | ⬜ |
| Non-ASCII (accented) | ✅ | ✅ | ✅ | ⬜ |
| Emoji in paths | ✅ | ✅ | ✅ | ⬜ |
| Spaces in paths | ✅ | ✅ | ✅ | ⬜ |
| Very long paths (>260 chars) | ✅ (extended) | ✅ | ✅ | ⬜ |
| UNC paths (\\\\server\\share) | ✅ | N/A | N/A | ⬜ |
| Symlinks | ✅ | ✅ | ✅ | ⬜ |
| Hard links | ✅ | ✅ | ✅ | ⬜ |

## Drive Types

| Type | Windows | macOS | Linux | Status |
|---|---|---|---|---|
| Local system drive | ✅ | ✅ | ✅ | ⬜ |
| External USB | ✅ | ✅ | ✅ | ⬜ |
| Network drive (SMB) | ✅ | ✅ | ✅ | ⬜ |
| NFS mount | N/A | ✅ | ✅ | ⬜ |

## Scheduler × Notifications

| Scenario | Expected | Status |
|---|---|---|
| Scheduled scan completes | Notification shown | ⬜ |
| Scheduled scan finds items | Notification with count + size | ⬜ |
| Scheduled scan finds nothing | "System is clean" notification | ⬜ |
| Notification clicked | App opens to results | ⬜ |
| Notifications disabled | No notification shown | ⬜ |
| **Scheduled scan NEVER deletes** | Zero filesystem mutation | ✅ |

## Test Results

- ✅ = Passing
- ⬜ = Not yet tested
- ❌ = Failing
- N/A = Not applicable

Last updated: 2026-08-10
