# Specifications

## Product overview

**Taskasaurus**: A status-bar “task launcher strip” designed for repositories with many tasks. It renders top-level tasks and (virtual) groups, supports **2-level hierarchy**, and expands groups in-place with **accordion behavior**.

### Target users

- Developers with many build/test/lint/run tasks
- Teams standardizing tasks via `.vscode/tasks.json`

## VS Code tasks model (what you are launching)

- Workspace/folder tasks are configured in `.vscode/tasks.json`. ([Visual Studio Code][3])
- `tasks.json` is a native VS Code config file in **JSONC** mode (comments + trailing commas allowed). ([Visual Studio Code][4])
- Tasks can come from `tasks.json` and also be contributed by extensions via Task Providers. ([Visual Studio Code][3])
- Extension launches tasks via `vscode.tasks.fetchTasks()` and `vscode.tasks.executeTask(task)`. ([VS Code API][5])

---

## User experience spec

### Visual layout (Status Bar, left side)

- Items appear in the **left (Primary)** status bar group (align left). Rationale: these are workspace-level actions. ([Visual Studio Code][6])
- Each visible “row” is a separate `StatusBarItem`, ordered by numeric `priority`.

### States

1. **Collapsed (default)**: show only top-level items
2. **Expanded(groupId)**: show top-level items plus that group’s children inserted directly beneath it (in-order), while other groups remain collapsed.

### Example rendering rules

Given tasks:

- `Build`
- `Test/unit`
- `Test/e2e`
- `Check/lint`
- `Check/style`
- `Run`

Collapsed:

- `Build`
- `Test [disclosure]`
- `Check [disclosure]`
- `Run`

Expanded(Test):

- `Build`
- `Test [disclosure]`
- `childIcon  taskIcon?  Test/unit`
- `childIcon  taskIcon?  Test/e2e`
- `Check [disclosure]`
- `Run`

#### Icons & label composition

Status bar text supports codicons like `$(chevron-right)` and multiple icons. ([Visual Studio Code][2])

- **Child indicator icon (always for children):** `$(arrow-small-right)` (or any stable codicon).
- **Task icon (optional):** if task has a known ThemeIcon id (see “Task icons” below), render `$(<id>)`.
- **Disclosure icon for parents:** collapsed: `$(chevron-right)`, expanded: `$(chevron-down)`

**Parent item label format**

- If task icon exists: `$(taskIcon) <GroupLabel> $(chevron-right|chevron-down)`
- Else: `<GroupLabel> $(chevron-right|chevron-down)`

**Leaf child item label format**

- If task icon exists: `$(arrow-small-right) $(taskIcon) <TaskLabel>`
- Else: `$(arrow-small-right) <TaskLabel>`

**Leaf root item label format**

- If task icon exists: `$(taskIcon) <TaskLabel>`
- Else: `<TaskLabel>`

Tooltips:

- Parent: "Expand group 'Test'"
- Child: "Run task 'Test/unit'"
- Root leaf: "Run task 'Build'"
- Include `task.source` and workspace folder name in tooltip for multi-root disambiguation.
- **Detail override:** If the task has a non-empty `detail` property in its JSON definition, use that value as the tooltip instead of the default format.

### Interaction rules (accordion)

- Clicking a **collapsed parent** expands it and collapses any other expanded group.
- Clicking the **expanded parent** collapses it (toggle).
- Clicking any **leaf item** (root leaf or child leaf) executes the task and collapses all groups.
- **Timeout auto-collapse:** After **10 seconds** of no Taskasaurus click activity while expanded, collapse all.

Timeout notes:

- Timer starts (or resets) on every Taskasaurus click.
- Timer is canceled when collapsed.
- Because “mouse leave” is not available, the definition of inactivity is “no Taskasaurus interactions”.

### Sorting

- Default sort: alphabetical by **display label** (case-insensitive), stable tie-break by original fetch order.
- Group children: alphabetical by full task label.

---

## Hierarchy derivation spec (2-level)

### Input tasks

Taskasaurus displays **only tasks defined in `.vscode/tasks.json`** files. Auto-detected tasks from task providers (e.g., npm scripts, TypeScript tasks) are excluded to keep the status bar focused and user-controlled.

**Implementation:**

1. Parse `.vscode/tasks.json` (JSONC) from each workspace folder to extract task labels.
2. Use `vscode.tasks.fetchTasks()` to obtain task objects. ([VS Code API][5])
3. Filter the fetched tasks to include only those whose labels match entries in `tasks.json`.

### Hidden tasks

Tasks may define a `"hide": true` property in `.vscode/tasks.json`. When a task is marked as hidden:

- It **must not** appear in the status bar (neither as a root leaf, parent, nor child).
- It **must not** contribute to group formation. For example, if `Test/unit` and `Test/e2e` both exist but `Test/e2e` has `hide: true`, no "Test" group is created since only one visible child remains.
- Hidden tasks are filtered out **before** the grouping algorithm runs.

**Implementation:**

1. Parse `.vscode/tasks.json` (JSONC) to build a set of hidden task labels.
2. After fetching tasks via `vscode.tasks.fetchTasks()`, filter out any task whose label matches a hidden entry.
3. Proceed with grouping and rendering using only visible tasks.

**Rationale:** Users may define utility tasks (e.g., background watchers, internal scripts) that should be runnable via command palette or keybindings but not clutter the status bar.

### Grouping algorithm

Taskasaurus will create _virtual_ groups based on a delimiter in the task label:

- Delimiter: first `/` (slash) in the label.
- `GroupName = label.split('/', 1)[0].trim()`
- If no `/`, task is a **root leaf**.
- If `/` exists, task is a **candidate child** belonging to `GroupName`.

**When to create a group**

- Create a group node if **2+ child tasks** share the same `GroupName`.
- If only one child exists for a `GroupName`, do **not** create a group; treat it as a root leaf to avoid noise.

**Edge case: a real task label equals the group name**
If a task exists with label exactly `GroupName` and the group also exists (because 2+ children):

- The group remains a **parent toggle** (non-runnable).
- The runnable task is shown as a child entry at the top of the group as:
  - `$(arrow-small-right) $(taskIcon?) <GroupName>`
    Tooltip clarifies it’s runnable (“Run task ‘Test’” vs “Expand group ‘Test’”).

This preserves determinism without introducing alternate click behaviors.

---

## Task execution spec

### Launch

- On leaf click: call `vscode.tasks.executeTask(task)` ([VS Code API][5])
- Immediately collapse all groups (per your requirement).

### Run feedback indicators

Provide visual feedback in the status bar while tasks are running and after completion.

**Feedback states:**

- **Running:** Prefix the task's status bar item with `$(loading~spin)` (animated spinner). ([Visual Studio Code][2])
- **Success:** On exit code 0, show `$(check)` for 2 seconds, then revert to normal.
- **Failure:** On non-zero exit code, show `$(error)` for 2 seconds, then revert to normal.

**Tracking behavior:**

- Use `vscode.tasks.onDidStartTaskProcess` to detect when a task begins execution.
- Use `vscode.tasks.onDidEndTaskProcess` to capture exit code and trigger success/failure feedback. ([VS Code API][5])
- Track the task by matching `TaskExecution` to the stored `TaskKey`.

**Display rules:**

- Feedback is shown on the task's status bar item in the **collapsed view**.
- If the task is currently a child (group expanded), show feedback on the child item; on collapse, transfer to the corresponding root item.
- If the user launches another task while one is running, show feedback for **all running tasks** simultaneously (each task tracks its own state).
- After the 2-second success/error display, revert to the normal label (no icon prefix or standard task icon if configured).

**Edge cases:**

- If a task is hidden (`"hide": true`), no feedback is shown (task doesn't appear in status bar).
- If the same task is launched multiple times concurrently, track each execution independently.

### Concurrency

- If user launches another task while one is running, allow it (VS Code tasks support multiple executions).
- Each running task displays its own feedback indicator independently.

---

## Multi-root workspace behavior

Without adding a third hierarchy level, Taskasaurus must still behave predictably:

### Task selection scope

- Show tasks from **all workspace folders**, but disambiguate duplicates.

### Disambiguation rule

If multiple tasks share the same label across folders:

- Append a short folder suffix in tooltip always.
- Append `【<folderName>】` to the visible label only when necessary to avoid ambiguity:
  - `Build【api】`, `Build【web】`

Folder name source: `WorkspaceFolder.name`.

---

## Task icons spec (best-effort)

### Goal

If the task defines an icon, render it next to the label (per your desired “child-icon + task-icon + label” layout).

### Reality of VS Code tasks

VS Code supports task icon/color configuration properties (notably surfaced in task-related quick picks), per upstream tracking. ([GitHub][7])
However, the exact shape of icon metadata available at runtime may vary by task source/provider and VS Code version.

### Implementation strategy (robust)

Try icons in this order:

1. **Runtime Task object**: if the task instance exposes an icon as a `ThemeIcon`-like identifier, render it as `$(id)`. (Some providers may set this.)
2. **Parse `.vscode/tasks.json`** (JSONC): build a map from task label (and optional type) → icon id. JSONC parsing is required because config files may contain comments. ([Visual Studio Code][4])
   - Use a JSONC parser (e.g., `jsonc-parser`) rather than `JSON.parse`.
   - Merge results across workspace folders.

3. If neither yields an icon id, render no task icon.

**Important:** even if you find `color`, ignore it (StatusBar limitations).

---

## Status Bar rendering & ordering spec

### Item creation

- Maintain a dynamic set of `StatusBarItem`s equal to the number of currently visible nodes.
- On any state change, **reconcile** items:
  - Reuse existing items when possible (to reduce flicker)
  - Create/dispose only when count changes significantly

### Alignment & priority

- Alignment: `vscode.StatusBarAlignment.Left`
- Priority: allocate in “bands” so children can be inserted between parents:
  - Root item i priority: `10000 - i*100`
  - Child j under root i priority: `(10000 - i*100) - 50 - j`
    This guarantees children appear directly after their parent.

### UX guideline compliance note

VS Code UX guidelines advise limiting status bar items and avoiding multiple icons unless necessary. Taskasaurus intentionally bends that to deliver the product concept; keep labels short and icons meaningful. ([Visual Studio Code][6])

---

## Commands (extension API surface)

Even with “status bar only”, you still need command IDs for click handlers.

### Required commands

- `taskasaurus.clickNode` (internal): args `{ nodeId: string }`
- `taskasaurus.refresh` (optional, for troubleshooting): reload task list and rerender
- `taskasaurus.collapse` (optional): collapse any expanded group

No QuickPick commands.

### Keybindings

None by default (status-bar-first product). (You can add later.)

---

## Activation & refresh behavior

### Activation events (package.json)

- `onStartupFinished`
- `workspaceContains:.vscode/tasks.json` (since only `tasks.json` tasks are shown, this is reliable)

### Refresh triggers

Recompute tasks + hierarchy on:

- Extension activation complete
- `vscode.workspace.onDidChangeWorkspaceFolders`
- `vscode.workspace.onDidSaveTextDocument` when file path matches `**/.vscode/tasks.json`
- (Optional) `vscode.tasks.onDidStartTask` / `onDidEndTask` to update run feedback ([VS Code API][5])

### Debounce

- Debounce refresh to ~250ms to avoid storms during file saves or folder changes.

---

## Data model

### Node types

```ts
type NodeId = string;

type RootLeafNode = {
  id: NodeId;
  kind: "rootLeaf";
  label: string;
  taskKey: TaskKey;
  iconId?: string;
};

type ParentNode = {
  id: NodeId;
  kind: "parent";
  label: string;          // group label (e.g., "Test")
  iconId?: string;        // if group has a runnable task named exactly label, icon belongs to that task; otherwise omit
  children: ChildLeafNode[];
  runnableTaskKey?: TaskKey; // only if an actual task label == group label exists
};

type ChildLeafNode = {
  id: NodeId;
  kind: "childLeaf";
  label: string;          // full task label ("Test/unit")
  taskKey: TaskKey;
  iconId?: string;
};

type TaskKey = {
  label: string;
  source: string;
  folder?: string;     // workspace folder name (if applicable)
  definitionType?: string;
};
```

### State store

```ts
type UIState = {
  expandedGroupId?: NodeId;
  lastInteractionAt?: number;
  collapseTimer?: NodeJS.Timeout;
};
```

---

## Core logic pseudocode

```ts
async function refreshModelAndRender() {
  const tasks = await vscode.tasks.fetchTasks(); // all tasks :contentReference[oaicite:17]{index=17}
  const iconMap = await loadIconsFromTasksJsonJsonc(); // best-effort :contentReference[oaicite:18]{index=18}

  const model = buildHierarchy(tasks, iconMap); // root nodes (parents + root leaf)
  renderStatusBar(model, uiState);
}

function onNodeClick(nodeId: string) {
  resetCollapseTimer();

  const node = lookupNode(nodeId);
  switch (node.kind) {
    case "parent":
      uiState.expandedGroupId = (uiState.expandedGroupId === nodeId) ? undefined : nodeId;
      render();
      startCollapseTimer(10_000);
      break;

    case "rootLeaf":
    case "childLeaf":
      vscode.tasks.executeTask(resolveTask(node.taskKey)); :contentReference[oaicite:19]{index=19}
      uiState.expandedGroupId = undefined;
      render();
      break;
  }
}
```

---

## Error handling & empty states

### No workspace folder open

Tasks are only available in folder/workspace context. ([Visual Studio Code][3])
Behavior:

- Show a single status bar item: `Taskasaurus: Open a folder to use tasks`
- Clicking opens `vscode.openFolder` command (optional), or just shows an information message.

### No tasks found

- Show `Taskasaurus: No tasks`
- Tooltip: “Define tasks in .vscode/tasks.json or install extensions that provide tasks.”

### Task execution failure to start

`executeTask` can throw in environments that can’t start processes (per API docs). ([VS Code API][5])

- Catch and show `window.showErrorMessage(...)`

---

## QA / acceptance criteria

### Functional

- [ ] Collapsed view renders root items only.
- [ ] Parent click expands and inserts children after parent.
- [ ] Only one parent expanded at a time (accordion).
- [ ] Clicking a different parent collapses the previous and expands the new.
- [ ] Clicking any leaf executes the task and collapses all groups.
- [ ] After 10s with no Taskasaurus click activity while expanded, collapses to default.
- [ ] Labels can include two icons at left for child items (child icon + task icon).
- [ ] Only displays tasks defined in `.vscode/tasks.json` (auto-detected tasks from providers are excluded).
- [ ] Multi-root: duplicate labels are disambiguated.
- [ ] Tasks with `"hide": true` do not appear in the status bar and do not affect group formation.
- [ ] Running tasks show `$(loading~spin)` indicator.
- [ ] Completed tasks show `$(check)` (success) or `$(error)` (failure) for 2 seconds.

### Non-functional

- [ ] No QuickPick, no TreeView.
- [ ] No custom child background coloring beyond VS Code constraints. ([VSHaxe][1])
- [ ] Refresh does not flicker excessively (reuse status bar items where possible).

---

## Packaging notes (for agents)

- TypeScript extension (standard VS Code extension scaffold).
- Ensure `contributes.commands` includes `taskasaurus.clickNode`.
- Keep internal node registry in memory; avoid persisting user settings (since you want “no options”).

---

If you want, I can also draft a **minimal `tasks.json` conventions guide** to encourage clean grouping (e.g., `Group/action` naming patterns), plus a set of recommended codicons for common task types (build/test/lint/run) using the official icon IDs. ([Visual Studio Code][2])

[1]: https://vshaxe.github.io/vscode-extern/vscode/StatusBarItem.html?utm_source=chatgpt.com "vscode.StatusBarItem - Haxe externs for Visual Studio Code - API ..."
[2]: https://code.visualstudio.com/api/references/icons-in-labels "Product Icon Reference | Visual Studio Code Extension
API"
[3]: https://code.visualstudio.com/docs/debugtest/tasks "Integrate with External Tools via Tasks"
[4]: https://code.visualstudio.com/Docs/languages/json "Editing JSON with Visual Studio Code"
[5]: https://www.vscodeapi.com/modules/vscode.tasks.html "tasks | VS Code API"
[6]: https://code.visualstudio.com/api/ux-guidelines/status-bar "Status Bar | Visual Studio Code Extension
API"
[7]: https://github.com/microsoft/vscode/issues/153377?utm_source=chatgpt.com "Test: task icon / color customization · Issue #153377 · microsoft/vscode"
