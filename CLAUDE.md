# CLAUDE.md

> Taskasaurus — A status-bar task launcher for VS Code.

## Start Here

Read `docs/AGENTS.md` before making any changes. It is the routing hub for all
project documentation and tells you exactly which docs to read for any task.

## Collaboration

Before starting non-trivial work, scrutinize the ask and surface ambiguities.
Present unclear points in batches of 3 with concrete choices (pros, cons,
tradeoffs). Mark a recommended default for each. Assume as little as possible —
an extra round of questions is better than a wrong assumption baked into code.

## Commands

| Action       | Command               |
| ------------ | --------------------- |
| Build        | `pnpm run build`      |
| Test         | `pnpm test`           |
| Lint         | `pnpm run check:lint` |
| Format check | `pnpm run check:style`|
| All checks   | `pnpm run check:all`  |

Always run `pnpm test` and `pnpm run check:lint` before considering a task done.

## Key Conventions

- **Pure vs impure modules** — `statusBarModel.ts` and `hierarchy.ts` are pure
  (no VS Code API). Prefer implementing logic here when possible; they are
  directly testable without mocks. `controller.ts`, `statusBar.ts`,
  `iconLoader.ts`, and `extension.ts` depend on VS Code APIs.
- **Co-located tests** — Tests live next to source as `<module>.test.ts`. Pure
  modules are tested directly; impure modules use `vi.mock("vscode")`.
- **Types in one place** — All shared domain types live in `src/types.ts`.
- **Flat src/** — One module per file, no subdirectories.
- **Fix at the lowest level** — When fixing bugs, prefer changes in pure modules
  over the controller or extension entry point.

## Architectural Decisions

Before proposing changes to the UI approach, rendering strategy, task filtering,
or grouping model, check `docs/adr/` for settled decisions:

- `001-status-bar-only.md` — StatusBarItem only, no TreeView/QuickPick/Webview
- `002-virtual-groups.md` — Groups derived from label delimiter, not config
- `003-tasks-json-only.md` — Only tasks.json-defined tasks, no auto-detected

## Documentation Sync Points

When changing code, consult `docs/AGENTS.md § Documentation Update Rules` for
which docs to update. Key sync groups that must stay consistent:

- **New config setting** — update all of: `package.json`
  (contributes.configuration), `src/config.ts` (read + interface),
  `src/config.test.ts` (tests), `docs/modules/config.md`
- **New feature** — update: relevant `src/` files, `docs/features/<name>.md`,
  `docs/modules/<name>.md`, `docs/AGENTS.md` quick lookup table
- **Domain type change** — update: `src/types.ts`, `docs/DOMAIN.md` glossary,
  relevant `docs/modules/*.md`
- **New command** — update: `src/extension.ts` (register), `package.json`
  (contributes.commands), `docs/AGENTS.md` quick lookup table
