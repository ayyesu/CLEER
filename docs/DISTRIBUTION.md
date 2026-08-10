# Distribution Strategy

CLEER is distributed through package managers — no code signing certificates required.

## Why Package Managers?

| Approach | Cost | User Experience |
|---|---|---|
| Code signing certificates | $99-400/year | Clean install, but expensive |
| **Package managers** | **Free** | **Clean install, trusted, auto-updating** |

Package managers have their own trust mechanisms, so unsigned binaries install without warnings.

## Supported Package Managers

### macOS — Homebrew

```bash
brew install --cask cleer
```

Users install CLEER like any other trusted app. No security warnings.

### Windows — Chocolatey

```powershell
choco install cleer
```

Trusted distribution through Windows package manager.

### Linux — AUR (Arch) / AppImage

```bash
# Arch Linux (AUR)
yay -S cleer

# Any Linux (AppImage)
chmod +x cleer.AppImage
./cleer.AppImage
```

## How It Works

1. **CI builds** unsigned binaries for all 3 platforms (no certs needed)
2. **GitHub Release** publishes the artifacts
3. **Package manager configs** in `distro/` reference the release artifacts
4. **Users install** through their package manager of choice

## Publishing a New Release

1. Bump version in `package.json`
2. Update CHANGELOG.md
3. Merge `main` → `release`
4. Tag and push: `git tag v0.1.0 && git push origin v0.1.0`
5. CI builds binaries and creates a GitHub Release
6. Publish to Chocolatey: `choco push cleer.x.x.x.nupkg`
7. Submit Homebrew cask update (or use `brew bump-cask-pr`)

## Package Manager Files

```
distro/
├── homebrew/
│   └── cleer.rb              # Homebrew cask formula
├── chocolatey/
│   ├── cleer.nuspec          # Chocolatey package metadata
│   └── tools/
│       ├── chocolateyinstall.ps1
│       └── chocolateyuninstall.ps1
└── linux/
    └── PKGBUILD              # Arch Linux AUR package
```

## User Install Commands

| OS | Command |
|---|---|
| macOS | `brew install --cask cleer` |
| Windows | `choco install cleer` |
| Arch Linux | `yay -S cleer` |
| Any Linux | Download AppImage from releases |
