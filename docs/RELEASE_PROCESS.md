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

| Secret | Platform | Purpose |
|--------|----------|---------|
| `WIN_CSC_LINK` | Windows | Code signing certificate |
| `WIN_CSC_KEY_PASSWORD` | Windows | Certificate password |
| `APPLE_ID` | macOS | Apple Developer ID |
| `APPLE_APP_SPECIFIC_PASSWORD` | macOS | App-specific password |
| `APPLE_TEAM_ID` | macOS | Apple Developer Team ID |
| `MAC_CERTS` | macOS | P12 certificate (base64) |
| `MAC_CERTS_PASSWORD` | macOS | P12 certificate password |
