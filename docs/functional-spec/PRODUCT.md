# Taskasaurus Product Specification

A status-bar task launcher strip for VS Code, designed for repositories with many tasks.

## Personas

### Developer with Many Tasks

A software engineer working on a project with numerous build, test, lint, and run configurations defined in `.vscode/tasks.json`. They switch between tasks frequently throughout their workflow and want quick, always-visible access without navigating menus or remembering keyboard shortcuts.

**Pain points:**

- The VS Code command palette requires multiple keystrokes and typing to find a task.
- The terminal panel must be opened to see running tasks.
- No persistent visual indicator of available tasks.

### Team Lead Standardizing Workflows

A technical lead who defines a set of standard tasks in `.vscode/tasks.json` and commits them to the repository. They want all team members to have consistent, discoverable access to project tasks without requiring documentation or onboarding.

**Pain points:**

- New team members do not know which tasks are available.
- Custom keybindings are per-user and not shareable.
- No standard way to surface tasks visually across the team.

## Functional Requirements

### FR-1: Status Bar Task Launcher

The extension renders task launcher items in the left region of the VS Code status bar. Each task or task group is a separate clickable status bar item. Items are always visible without requiring panel switching or command invocation.

### FR-2: Two-Level Grouping

Tasks are organized into a maximum of two levels: groups (parents) and tasks (leaves). Groups are derived automatically from a configurable delimiter in the task label (default `/`). A group is created when two or more tasks share a common prefix. A single-child prefix does not form a group; the task appears as a root leaf.

### FR-3: Accordion Expand/Collapse

Only one group can be expanded at a time. Clicking a collapsed group expands it and collapses any other. Clicking an expanded group collapses it. Clicking any leaf task collapses all groups. This keeps the status bar compact and focused.

### FR-4: Click-to-Run

Clicking a leaf task (root leaf or child) executes it via the VS Code tasks API. All groups collapse on execution. No confirmation dialog is shown.

### FR-5: Auto-Collapse on Inactivity

After a configurable timeout (default 10 seconds, 0 disables), an expanded group collapses automatically if no Taskasaurus click occurs. The timer resets on each click. No timer runs when all groups are collapsed.

### FR-6: Visual Run Feedback

Running tasks display an animated spinner icon. Completed tasks display a success (check) or failure (error) icon for 2 seconds. Each task tracks its feedback state independently. Multiple tasks can show feedback simultaneously.

### FR-7: Hidden Tasks

Tasks with `"hide": true` in `tasks.json` are excluded from the status bar and do not affect group formation. They remain executable via the VS Code command palette.

### FR-8: Multi-Root Workspace Support

Tasks from all workspace folders are displayed. When task labels collide across folders, a folder-name suffix is appended for disambiguation. Tooltips include source and folder information.

### FR-9: Task Icons

Icons are resolved on a best-effort basis from runtime task objects or JSONC parsing of `tasks.json`. Icons render as codicons in the status bar text. Color properties are ignored. Tasks without icon definitions display no icon.

### FR-10: Short Child Labels

When a group is expanded, child labels strip the redundant group prefix by default. This is configurable globally and per-group. The resolution order is: `tasks.json` per-group override, `settings.json` per-group override, `settings.json` global setting, built-in default (`true`).

### FR-11: Configurable Group Delimiter

The delimiter used to derive groups from task labels defaults to `/` and is configurable via `taskasaurus.groupDelimiter`.

## Non-Functional Requirements

### NFR-1: UI Surface

No UI beyond status bar items. No Tree View, Quick Pick, Webview, or sidebar panel.

### NFR-2: Minimal Flicker

Status bar item reconciliation reuses existing items when possible. Items are created or disposed only when the visible count changes. This minimizes visual disruption on state changes.

### NFR-3: Debounced Refresh

Task list recomputation is debounced to 250ms to prevent excessive updates during rapid file saves or folder changes.

### NFR-4: Activation

The extension activates on startup completion or when a `.vscode/tasks.json` file exists in the workspace. It does not activate in empty windows without folders.

### NFR-5: Task Source Filtering

Only tasks defined in `.vscode/tasks.json` are shown. Auto-detected tasks from task providers (npm scripts, TypeScript tasks, etc.) are excluded to keep the status bar focused.

## Configuration Surface

| Setting                        | Type      | Default | Description                                                              |
| ------------------------------ | --------- | ------- | ------------------------------------------------------------------------ |
| `taskasaurus.groupDelimiter`   | `string`  | `"/"`   | Delimiter for deriving groups from task labels.                          |
| `taskasaurus.collapseTimeout`  | `number`  | `10`    | Seconds before auto-collapse. `0` disables.                              |
| `taskasaurus.shortChildLabels` | `boolean` | `true`  | Strip group prefix from child labels when expanded.                      |
| `taskasaurus.groups`           | `object`  | `{}`    | Per-group overrides keyed by group name. Supports `shortLabel: boolean`. |

Additionally, per-group overrides can be specified in `tasks.json` under a `taskasaurus` top-level key, following the same schema as `taskasaurus.groups` in settings.

## User Journeys

### Journey 1: View Tasks

**Trigger:** Developer opens a workspace with `.vscode/tasks.json` defined.

**Flow:**

1. Extension activates and reads `tasks.json`.
2. Tasks are fetched, filtered, and grouped.
3. Status bar shows root items: groups with disclosure chevrons and standalone tasks.
4. Developer sees their available tasks at a glance.

**Outcome:** Available tasks are persistently visible without any user action.

### Journey 2: Explore a Group

**Trigger:** Developer wants to see which tasks are in the `Test` group.

**Flow:**

1. Developer clicks `Test $(chevron-right)` in the status bar.
2. `Test` expands to `Test $(chevron-down)`, and child items (`unit`, `e2e`) appear after it.
3. Any previously expanded group collapses.
4. After 10 seconds of inactivity, the group collapses automatically.

**Outcome:** Developer sees the contents of exactly one group at a time, with automatic cleanup.

### Journey 3: Run a Task

**Trigger:** Developer wants to run the `Test/unit` task.

**Flow:**

1. Developer clicks `Test` to expand the group (if not already expanded).
2. Developer clicks `unit` (or `Test/unit` if short labels are disabled).
3. All groups collapse. The task begins executing.
4. The `Test/unit` item shows a spinner while running.
5. On completion, a check or error icon appears for 2 seconds, then reverts.

**Outcome:** Task is executed with clear visual feedback, and the status bar returns to its compact state.

### Journey 4: Configure Behavior

**Trigger:** Team lead wants to customize grouping and display for the project.

**Flow:**

1. In `.vscode/tasks.json`, the lead adds `"hide": true` to utility tasks.
2. In `.vscode/tasks.json`, the lead adds a `taskasaurus` block with per-group `shortLabel` overrides.
3. In `.vscode/settings.json`, the lead optionally sets the global delimiter and collapse timeout.
4. Configuration is committed to the repository. All team members see consistent behavior.

**Outcome:** Task visibility and display are customized per-project, shared via version control.

## Sorting

- Root items (parents and root leaves): alphabetical by display label, case-insensitive. Stable tie-break by original fetch order.
- Group children: alphabetical by full task label.

## Error States

| Condition                  | Behavior                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------ |
| No workspace folder open   | Single status bar item: "Taskasaurus: Open a folder to use tasks"                    |
| No tasks found             | Single status bar item: "Taskasaurus: No tasks"                                      |
| `tasks.json` parse failure | Warning logged. Affected folder's tasks are skipped. Other folders proceed normally. |
| `executeTask` throws       | Error message shown via `window.showErrorMessage`. UI state remains consistent.      |

## Commands

| Command ID              | Visibility      | Description                                                            |
| ----------------------- | --------------- | ---------------------------------------------------------------------- |
| `taskasaurus.clickNode` | Internal        | Click handler for all status bar items. Receives `{ nodeId: string }`. |
| `taskasaurus.refresh`   | Command palette | Manually reload tasks and re-render.                                   |
| `taskasaurus.collapse`  | Command palette | Collapse any expanded group.                                           |

No keybindings are defined by default.

## Refresh Triggers

The task list and hierarchy are recomputed on:

- Extension activation.
- Workspace folder addition or removal (`onDidChangeWorkspaceFolders`).
- Save of any `.vscode/tasks.json` file (`onDidSaveTextDocument` with path match).
- Configuration changes (`onDidChangeConfiguration` for `taskasaurus.*` settings).

All refreshes are debounced to 250ms.
