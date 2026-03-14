# ADR 003: tasks.json Tasks Only

## Status

Accepted

## Context

VS Code surfaces tasks from two sources:

1. **`.vscode/tasks.json`** -- Explicitly defined by the user. Typically a curated set of build, test, lint, and run commands specific to the project.
2. **Task providers** -- Extensions and built-in detectors that auto-discover tasks from project files. Examples: npm scripts from `package.json`, TypeScript build tasks, Grunt/Gulp tasks, Make targets.

`vscode.tasks.fetchTasks()` returns tasks from both sources. Auto-detected tasks can be numerous -- a `package.json` with 30 npm scripts would contribute 30 tasks. In a multi-root workspace with several `package.json` files, the count can easily exceed 100.

Taskasaurus renders each task as a status bar item. The status bar has limited horizontal space (typically 40-80 characters visible). Displaying all auto-detected tasks would overwhelm the UI and defeat the purpose of a focused task launcher.

## Decision

Only display tasks whose labels match entries in `.vscode/tasks.json`. Auto-detected tasks from task providers are excluded.

The implementation:

1. Parse `.vscode/tasks.json` (JSONC) from each workspace folder to extract the set of defined task labels.
2. Call `vscode.tasks.fetchTasks()` to get task objects with full execution metadata.
3. Filter the fetched tasks, keeping only those whose labels match the `tasks.json` label set.

This approach uses `tasks.json` as the source of truth for which tasks to show, while still relying on `fetchTasks()` for the runtime `Task` objects needed for execution.

## Consequences

**Positive:**

- The status bar shows only tasks the user has intentionally defined, keeping the count manageable.
- Users have full control over which tasks appear by editing `tasks.json`.
- The grouping and hierarchy features work reliably with a curated task set.
- Consistent behavior across different project types (not affected by which task providers are installed).

**Negative:**

- Users must define tasks in `tasks.json` to see them in Taskasaurus. Auto-detected tasks (npm scripts, etc.) are invisible unless explicitly added to `tasks.json`.
- Duplicating an auto-detected task into `tasks.json` requires knowing the correct task type and command configuration.
- Users may not understand why some tasks they see in the VS Code task picker do not appear in Taskasaurus.

## Alternatives Considered

### Show All Tasks

Display every task returned by `fetchTasks()`, including auto-detected ones. Rejected because:

- Auto-detected tasks can number in the dozens or hundreds, overwhelming the status bar.
- Many auto-detected tasks are not useful as one-click launcher targets (e.g., obscure npm scripts, internal build steps).
- Filtering mechanisms (allowlist, blocklist) would be needed to make the count manageable, adding configuration complexity that rivals just defining tasks in `tasks.json`.

### Allow Opt-In for Provider Tasks

Add a setting to include tasks from specific providers (e.g., `"taskasaurus.includeProviders": ["npm"]`). Not pursued in the initial version to keep the scope focused. This could be added later as an enhancement if users request it.
