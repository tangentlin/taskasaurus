# Release Workflow

This document describes how to release a new version of Taskasaurus.

## Prerequisites

- `VSCE_PAT` secret configured in the GitHub repository for VS Code Marketplace publishing

## How to Release

1. **Go to GitHub Releases**
   - Navigate to the [Releases page](https://github.com/tangentlin/taskasaurus/releases)
   - Click "Draft a new release"

2. **Create a version tag**
   - Enter a tag name following semver (e.g., `v1.2.0` or `1.2.0`)
   - The `v` prefix is optional and will be stripped automatically

3. **Publish the release**
   - Leave the release notes empty (they will be auto-generated)
   - Click "Publish release"

## What Happens Automatically

Once the release is published, the [release workflow](../.github/workflows/release.yml) runs and:

1. Extracts the version from the tag
2. Installs dependencies and runs tests
3. Updates `package.json` with the new version
4. Builds and packages the `.vsix` file
5. Publishes to VS Code Marketplace
6. Uploads the `.vsix` to the GitHub release
7. Generates changelog and updates `CHANGELOG.md` via `changelogen`
8. Deduplicates changelog entries (prefers PR references over commit hashes)
9. Updates the GitHub release notes with the new changelog entry
10. Commits the version bump and changelog back to `main`

## Commit Message Convention

Release notes are generated from commits following the [Conventional Commits](https://www.conventionalcommits.org/) format:

| Type        | Description             | Changelog Section |
| ----------- | ----------------------- | ----------------- |
| `feat:`     | New feature             | Features          |
| `fix:`      | Bug fix                 | Bug Fixes         |
| `docs:`     | Documentation changes   | Documentation     |
| `refactor:` | Code refactoring        | Refactors         |
| `perf:`     | Performance improvement | Performance       |
| `test:`     | Test changes            | (usually hidden)  |
| `chore:`    | Maintenance tasks       | (usually hidden)  |

Example commit messages:

```text
feat: add dark mode support
fix: resolve task not showing in status bar
docs: update README with new examples
```

## Versioning

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features, backwards compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, backwards compatible
