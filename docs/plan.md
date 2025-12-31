# Taskasaurus plan

This is the implementation plan for the Taskasaurus VS Code extension described in `docs/specs.md`.

## Goals (v1)

- Status-bar “task launcher strip” for the current workspace.
- 2-level virtual grouping derived from task labels (first `:`), with accordion expansion.
- Click-to-run for leaf tasks; collapse after launching.
- Multi-root support with label disambiguation when needed.
- Best-effort task icons (runtime first; fallback to parsing `.vscode/tasks.json` as JSONC).

## Non-goals (v1)

- No QuickPick, TreeView, or custom UI beyond Status Bar items.
- No persistent configuration/options (keep behavior deterministic).
- No custom coloring beyond what the Status Bar supports.

## Milestones

### M0 — Project scaffold + dev loop

- Create a standard TypeScript VS Code extension scaffold.
- Add scripts for `build`, `watch`, `lint`, and `test` (if using a test harness).
- Configure activation in `package.json` (`onStartupFinished` + optional `workspaceContains:.vscode/tasks.json`).
- Contribute command IDs in `package.json`:
  - `taskasaurus.clickNode` (required)
  - `taskasaurus.refresh` (optional but helpful)
  - `taskasaurus.collapse` (optional)

**Done when**
- Extension activates without errors and logs a single “activated” line in the Extension Host.

### M1 — Core data model + hierarchy builder

- Implement `TaskKey` and a stable way to resolve it back to a `vscode.Task`.
- Implement `buildHierarchy(tasks, iconMap)` per `docs/specs.md`:
  - Root leaf vs parent + child leaf nodes
  - “Only make a group when 2+ children share a group name”
  - Edge case: task label equals group label (runnable child at top)
- Sorting:
  - Root nodes by display label (case-insensitive; stable tie-break)
  - Group children by full task label
- Multi-root disambiguation:
  - Detect duplicate labels across folders and append `【folderName】` only when required.

**Done when**
- Unit tests (or a quick script) validate grouping + sorting + disambiguation on representative task lists.

### M2 — Status bar rendering (collapsed + expanded)

- Maintain a dynamic set of `StatusBarItem`s for the currently visible node list.
- Implement priority “bands” so children insert directly under their parent:
  - Root `i`: `10000 - i*100`
  - Child `j` of root `i`: `(10000 - i*100) - 50 - j`
- Implement label composition rules (codicons + optional task icon id).
- Tooltips:
  - Parent: “Expand group ‘X’”
  - Leaf: “Run task ‘Y’”
  - Include `task.source` and folder name for multi-root.
- Reconcile items (reuse when possible) to minimize flicker.

**Done when**
- Collapsed view shows only root items.
- Expanded view inserts children directly under the expanded parent.

### M3 — Interaction + UI state (accordion + auto-collapse)

- Implement in-memory `UIState`:
  - `expandedGroupId`
  - `lastInteractionAt`
  - `collapseTimer`
- Implement click behavior via `taskasaurus.clickNode`:
  - Parent toggles expand/collapse and enforces accordion (only one open).
  - Leaf click calls `vscode.tasks.executeTask(...)` and collapses everything.
- Implement inactivity auto-collapse:
  - Start/reset timer on every Taskasaurus click while expanded.
  - Collapse after 10 seconds of no Taskasaurus clicks.

**Done when**
- Behavior matches the “Interaction rules (accordion)” section in `docs/specs.md`.

### M4 — Refresh triggers + debounce

- Implement `refreshModelAndRender()`:
  - `vscode.tasks.fetchTasks()`
  - build icon map (best-effort, see M5)
  - build model + render
- Refresh triggers:
  - activation complete
  - `onDidChangeWorkspaceFolders`
  - `onDidSaveTextDocument` for `**/.vscode/tasks.json`
  - (optional) `vscode.tasks.onDidStartTask` / `onDidEndTaskProcess` if doing run feedback
- Add ~250ms debounce to avoid refresh storms.
- Implement `taskasaurus.refresh` command for manual recovery.

**Done when**
- Editing and saving `.vscode/tasks.json` updates the status bar within ~1s without flicker storms.

### M5 — Task icon support (best-effort)

- Strategy:
  1. Prefer icon metadata on the runtime `vscode.Task` (when available).
  2. Parse `.vscode/tasks.json` (JSONC) using a JSONC parser and map task label → icon id.
  3. If neither yields an icon id, omit the task icon.
- Merge results across workspace folders; ignore `color`.

**Done when**
- Known icon IDs in `.vscode/tasks.json` render as `$(iconId)` next to labels (when present).

### M6 — QA + packaging

- Manual QA checklist (based on `docs/specs.md` acceptance criteria):
  - Collapsed/expanded behavior
  - Accordion behavior
  - Leaf click launches task and collapses
  - Auto-collapse after 10s inactivity while expanded
  - Multi-root disambiguation
  - Works with both `tasks.json` tasks and provider tasks
- Package the extension (e.g., with `vsce`) and install locally for verification.

**Done when**
- Acceptance criteria in `docs/specs.md` are satisfied in a real workspace with several tasks.

## Open questions / follow-ups

- Whether to include “run feedback” (spinning / check / error) in v1, or defer to v1.1.
- How to robustly extract runtime task icons across VS Code versions/providers (may require experimentation).
