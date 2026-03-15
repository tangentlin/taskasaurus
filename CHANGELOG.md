# Changelog

All notable changes to Taskasaurus will be documented in this file.

This changelog is automatically generated from [Conventional Commits](https://www.conventionalcommits.org/) using [changelogen](https://github.com/unjs/changelogen).

## v1.6.0

[compare changes](https://github.com/tangentlin/taskasaurus/compare/v1.5.0...v1.6.0)

### 🚀 Enhancements

- Add staggered expand animation for task groups ([#28](https://github.com/tangentlin/taskasaurus/pull/28))

### 🩹 Fixes

- Validate shortLabel type and combine JSONC parse calls ([#26](https://github.com/tangentlin/taskasaurus/pull/26))

### 📖 Documentation

- Add comprehensive agent playbook and architecture documentation ([#27](https://github.com/tangentlin/taskasaurus/pull/27))

### 🏡 Chore

### ❤️ Contributors

- Tianzhen Lin (Tangent) <tangent@usa.net>

## v1.5.0

[compare changes](https://github.com/tangentlin/taskasaurus/compare/v1.4.0...v1.5.0)

### 🚀 Enhancements

- Add short child labels with configurable per-group overrides ([#25](https://github.com/tangentlin/taskasaurus/pull/25))

### 📖 Documentation

- Update roadmap with prioritized feature backlog ([#24](https://github.com/tangentlin/taskasaurus/pull/24))

### 🏡 Chore

### ❤️ Contributors

- Tianzhen Lin (Tangent) <tangent@usa.net>

## v1.4.0

[compare changes](https://github.com/tangentlin/taskasaurus/compare/v1.3.0...v1.4.0)

### 🚀 Enhancements

- Add configurable auto-collapse timeout setting ([#23](https://github.com/tangentlin/taskasaurus/pull/23))

### 📖 Documentation

- Remove completed delimiter config from roadmap ([#21](https://github.com/tangentlin/taskasaurus/pull/21))

### 🏡 Chore

### 🤖 CI

- Generate changelog before publishing to include in marketplace releases ([#22](https://github.com/tangentlin/taskasaurus/pull/22))

### ❤️ Contributors

- Tianzhen Lin (Tangent) <tangent@usa.net>

## v1.3.0

[compare changes](https://github.com/tangentlin/taskasaurus/compare/v1.2.0...v1.3.0)

### 🚀 Enhancements

- Add configurable group delimiter setting ([#20](https://github.com/tangentlin/taskasaurus/pull/20))

### 🏡 Chore

- Add Git support to PR command with smart diff detection ([#19](https://github.com/tangentlin/taskasaurus/pull/19))

### ❤️ Contributors

- Tianzhen Lin (Tangent) <tangent@usa.net>

## v1.2.0

[compare changes](https://github.com/tangentlin/taskasaurus/compare/v1.1.3...v1.2.0)

### 🚀 Enhancements

- Use task detail property as tooltip when available ([#17](https://github.com/tangentlin/taskasaurus/pull/17))

### 🩹 Fixes

- Improve changelog generation with deduplication and proper formatting ([#18](https://github.com/tangentlin/taskasaurus/pull/18))

### 🏡 Chore

### ❤️ Contributors

- Tianzhen Lin (Tangent) <tangent@usa.net>

## [v1.1.3](https://github.com/tangentlin/taskasaurus/compare/v1.1.2...v1.1.3)

### 🩹 Fixes

- Improve release workflow changelog generation and asset upload ([#16](https://github.com/tangentlin/taskasaurus/pull/16))

## [v1.1.2](https://github.com/tangentlin/taskasaurus/compare/v1.1.1...v1.1.2)

### ✨ Features

- Add /pr slash command for streamlined pull request creation ([#15](https://github.com/tangentlin/taskasaurus/pull/15))

## [v1.1.1](https://github.com/tangentlin/taskasaurus/compare/v1.1.0...v1.1.1)

### 🐛 Bug Fixes

- Filter status bar to only show tasks.json tasks ([#12](https://github.com/tangentlin/taskasaurus/pull/12))

### 📖 Documentation

- Add release workflow documentation ([#9](https://github.com/tangentlin/taskasaurus/pull/9))

### 🏗️ CI

- Add Open VSX publishing to release workflow ([#13](https://github.com/tangentlin/taskasaurus/pull/13))

## [v1.1.0](https://github.com/tangentlin/taskasaurus/compare/v1.0.1...v1.1.0)

### ✨ Features

- Add run feedback indicators in status bar ([#7](https://github.com/tangentlin/taskasaurus/pull/7))
  - Spinning icon while task runs
  - Checkmark on successful completion
  - Error icon on failure
  - Auto-clears after 2 seconds

## [v1.0.1](https://github.com/tangentlin/taskasaurus/compare/v1.0.0...v1.0.1)

### 🔧 Changes

- Change hierarchical task grouping with `:` delimiter

## v1.0.0

### 🎉 Initial Release

- Status bar task launcher for VS Code
- Support for `.vscode/tasks.json` task discovery
- Hierarchical task grouping with `:` delimiter
- Click-to-run task execution
- Collapsible task groups
