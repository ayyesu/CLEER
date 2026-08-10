# Release Process

## Versioning

CLEER follows [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes to public APIs or data formats
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

## Release Workflow

### 1. Prepare the Release

```bash
# Bump version in package.json
npm version <major|minor|patch> --no-git-tag-version

# Update CHANGELOG.md
# Move "[Unreleased]" changes to a new section: "## [X.Y.Z] - YYYY-MM-DD"
# Add a new empty "[Unreleased]" section at the top

# Commit
git add package.json CHANGELOG.md
git commit -m "chore(release): vX.Y.Z"
```

### 2. Merge to Release Branch

```bash
git checkout release
git merge main
git push origin release
```

### 3. Create and Push Tag

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

### 4. CI Builds Release

The release workflow (`.github/workflows/release.yml`) will:
1. Verify the tag matches `package.json` version
2. Build on Windows, macOS, and Ubuntu
3. Sign the binaries (if certificates are configured)
4. Create a draft GitHub Release with artifacts

### 5. Publish the Release

1. Go to GitHub Releases
2. Review the draft release
3. Add release notes from CHANGELOG.md
4. Publish

### 6. Auto-Update

`electron-updater` in the built app will detect the new release on GitHub
and notify users of the update.

## Version Consistency

The CI pipeline verifies:
- Tag version matches `package.json` version
- CHANGELOG.md has an entry for the version being released

## Secrets Required

> **Note:** Secrets are optional. The release workflow builds unsigned binaries
> when secrets are not configured. Unsigned builds work but show security warnings.
> Configure secrets when ready for production distribution.

### macOS Signing Secrets

| Secret | Type | How to Obtain |
|--------|------|---------------|
| `MAC_CERTS` | Base64-encoded P12 | 1. Open Keychain Access → export your "Developer ID Installer" certificate as `.p12`<br>2. `base64 -i cert.p12 \| pbcopy` to encode |
| `MAC_CERTS_PASSWORD` | String | Password you set when exporting the P12 |
| `APPLE_ID` | String | Your Apple Developer account email |
| `APPLE_APP_SPECIFIC_PASSWORD` | String | Generate at appleid.apple.com → App-Specific Passwords |
| `APPLE_TEAM_ID` | String | Found in Apple Developer portal → Membership → Team ID |

### Windows Signing Secrets

| Secret | Type | How to Obtain |
|--------|------|---------------|
| `WIN_CSC_LINK` | File path or URL | Path to your `.pfx` certificate file, or a secure download URL |
| `WIN_CSC_KEY_PASSWORD` | String | Password for the PFX certificate |

### Configuring Secrets

1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret from the tables above
4. The next release build will automatically sign the binaries
