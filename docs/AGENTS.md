# Taskasaurus — Agent Playbook

> Read this file first. It tells you what to read next for any task.

## Quick Start

1. Read `INDEX.md` for the full doc map.
2. Read `DOMAIN.md` for vocabulary.
3. Read `ARCHITECTURE.md` for structure and data flow.
4. Read the relevant `features/*.md` or `modules/*.md` for your task.

## Quick Lookup

| If you need to...                 | Start here                                                                         |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| Understand the domain vocabulary  | `DOMAIN.md`                                                                        |
| See how data flows end-to-end     | `ARCHITECTURE.md`                                                                  |
| Understand the node type system   | `DOMAIN.md` glossary + `src/types.ts`                                              |
| Change how tasks are grouped      | `features/task-grouping.md` → `modules/hierarchy.md` → `src/hierarchy.ts`          |
| Change expand/collapse behavior   | `features/accordion-expansion.md` → `modules/controller.md` → `src/controller.ts`  |
| Change how labels are composed    | `modules/status-bar.md` → `src/statusBarModel.ts`                                  |
| Change task execution or feedback | `features/task-execution.md` → `modules/controller.md` → `src/controller.ts`       |
| Change icon resolution            | `features/task-icons.md` → `modules/icon-parser.md` → `src/iconParser.ts`          |
| Change configuration/settings     | `modules/config.md` → `src/config.ts` + `package.json` (contributes.configuration) |
| Change hidden task filtering      | `features/hidden-tasks.md` → `src/controller.ts#refresh`                           |
| Change short child labels         | `features/short-child-labels.md` → `src/statusBarModel.ts#computeDisplayLabel`     |
| Change multi-root disambiguation  | `features/multi-root.md` → `src/hierarchy.ts#disambiguateLabels`                   |
| Add a new VS Code command         | `src/extension.ts` (register) + `package.json` (contributes.commands)              |
| Add a new VS Code setting         | `src/config.ts` (read) + `package.json` (contributes.configuration)                |
| Add a new refresh trigger         | `src/extension.ts` (event listener) → `controller.scheduleRefresh()`               |
| Understand task identity/matching | `modules/task-key.md` → `src/taskKey.ts`                                           |
| Understand tasks.json parsing     | `modules/icon-parser.md` → `src/iconParser.ts`                                     |
| Understand logging                | `modules/logger.md` → `src/logger.ts`                                              |
| Understand design decisions       | `adr/*.md`                                                                         |
| See the full product spec         | `functional-spec/PRODUCT.md`                                                       |
| See the roadmap                   | `docs/ROADMAP.md`                                                                  |

## Build / Test / Run

| Action             | Command                |
| ------------------ | ---------------------- |
| Build              | `pnpm run build`       |
| Watch (dev)        | `pnpm run watch`       |
| Run tests          | `pnpm test`            |
| Lint               | `pnpm run check:lint`  |
| Format check       | `pnpm run check:style` |
| Package VSIX       | `pnpm run package`     |
| Generate changelog | `pnpm run changelog`   |

**Test runner:** Vitest (`vitest run`). Config at `vitest.config.ts`.
**Bundler:** esbuild (single bundle to `dist/extension.js`).
**Package manager:** pnpm.

## Conventions

### Directory Structure

| Directory               | Purpose                          | Conventions                                            |
| ----------------------- | -------------------------------- | ------------------------------------------------------ |
| `src/`                  | All source code (flat structure) | One module per file, co-located tests as `*.test.ts`   |
| `src/types.ts`          | Shared type definitions          | All domain types defined here, no runtime code         |
| `src/extension.ts`      | VS Code entry point              | Only wiring — no business logic                        |
| `src/controller.ts`     | Orchestrator                     | Owns state (UIState, FeedbackMap), coordinates modules |
| `src/statusBarModel.ts` | Pure presentation logic          | No VS Code imports (testable without mocks)            |
| `src/statusBar.ts`      | VS Code StatusBarItem management | Thin adapter over statusBarModel                       |
| `dist/`                 | Build output                     | Single bundled `extension.js` via esbuild              |
| `docs/`                 | Documentation                    | Generated docs (this directory) + specs + plan         |
| `.vscode/`              | VS Code workspace config         | launch.json, tasks.json, settings.json                 |

### Naming & Patterns

- **Files:** camelCase (`statusBarModel.ts`, `iconParser.ts`)
- **Tests:** co-located as `<module>.test.ts` (e.g., `hierarchy.test.ts`)
- **Types:** PascalCase, exported from `src/types.ts` for shared types
- **Constants:** UPPER_SNAKE_CASE for module-level constants (e.g., `AUTO_COLLAPSE_TIMEOUT_MS`)
- **Pure vs impure:** `statusBarModel.ts` and `hierarchy.ts` are pure (no VS Code API calls); `controller.ts`, `statusBar.ts`, `iconLoader.ts`, `extension.ts` depend on VS Code API
- **Testing:** Pure modules tested directly; VS Code-dependent modules use `vi.mock("vscode")`

### Key Patterns

- **Task identity:** Tasks are identified by `TaskKey` (label + source + folder + definitionType). Use `taskKeyToId()` for string keys. — `src/taskKey.ts`
- **Node IDs:** Generated as `{kind}::{taskKeyId}` for leaf nodes, `{kind}::{groupName}` for parents. — `src/hierarchy.ts#generateNodeId`
- **StatusBarItem reconciliation:** Items reused by nodeId; recreated only when priority changes. — `src/statusBar.ts#render`
- **Config merge order:** tasks.json per-group > settings.json per-group > settings.json global > built-in default. — `src/controller.ts#refresh`

## Change Workflows

### Add a Feature

1. Define any new types in `src/types.ts`
2. Implement core logic in the appropriate pure module (`hierarchy.ts`, `statusBarModel.ts`)
3. Wire into `controller.ts` (state management, event handling)
4. If new settings needed: add to `src/config.ts` + `package.json` contributes.configuration
5. If new commands needed: add to `src/extension.ts` + `package.json` contributes.commands
6. Write tests in co-located `*.test.ts` file
7. Run `pnpm test` and `pnpm run check:lint`
8. Update docs: relevant `modules/*.md`, `features/*.md`, and this file's Quick Lookup table

### Fix a Bug

1. Reproduce with the relevant test file or add a failing test
2. Trace through: extension.ts → controller.ts → relevant module
3. Fix in the lowest-level module possible (prefer pure modules)
4. Verify fix with `pnpm test`

### Extend the Data Model

1. Add/modify types in `src/types.ts`
2. Update `src/taskKey.ts` if TaskKey changes
3. Update `src/hierarchy.ts#buildHierarchy` if node structure changes
4. Update `src/statusBarModel.ts` if rendering changes
5. Update `src/iconParser.ts` if tasks.json schema changes
6. Run all tests — hierarchy, statusBar, iconLoader, taskKey, config tests may be affected

### Add a New Configuration Setting

1. Add the setting schema to `package.json` under `contributes.configuration.properties`
2. Read the setting in `src/config.ts#getConfig()`
3. Pass through `controller.ts#refresh()` to wherever it's consumed
4. Add tests in `src/config.test.ts`

## Documentation Update Rules

| When you change...     | Update...                                                 |
| ---------------------- | --------------------------------------------------------- |
| A domain type or DTO   | `DOMAIN.md` glossary, relevant `modules/*.md` key types   |
| Module public surface  | Relevant `modules/*.md`                                   |
| User-visible behavior  | Relevant `features/*.md` and `functional-spec/PRODUCT.md` |
| File/folder structure  | `Conventions` table above                                 |
| A design decision      | Relevant `adr/*.md`                                       |
| Configuration settings | `modules/config.md` and `functional-spec/PRODUCT.md`      |

## Context-Minimizing Guidance

For typical tasks, load docs in this order (stop when you have enough context):

1. **This file** (AGENTS.md) — routing and conventions
2. **DOMAIN.md** — if you need to understand types or invariants
3. **The relevant feature doc** — if working on a specific feature
4. **The relevant module doc** — for implementation details
5. **ARCHITECTURE.md** — if you need the full data flow picture
