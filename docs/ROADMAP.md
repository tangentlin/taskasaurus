# Taskasaurus Roadmap

Future features under consideration, roughly ordered by priority.

---

## High Priority

### Task Favorites / Pinned Tasks

Allow users to mark certain tasks as "favorites" that always appear first in the status bar.

**Behavior:**

- Tasks with `"favorite": true` appear before other root items
- Order among favorites preserved by their original position
- Works with both grouped and ungrouped tasks

**Implementation notes:**

- Read `favorite` property from task definition
- Sort favorites to the front during tree construction
- Consider a small star icon or other visual indicator

**Why:**

The tasks you run 20 times a day should be the easiest to reach. Reduces scanning time for daily workflows.

---

### Keyboard Quick Launch

Add a command for keyboard-driven task launching.

**Behavior:**

- `Taskasaurus: Quick Launch` command opens a minimal quick pick
- Shows only Taskasaurus-visible tasks (respects `hide` property)
- Preserves the same hierarchy as the status bar

**Implementation notes:**

- New command registered in `package.json`
- Reuse existing task tree data structure
- QuickPick with hierarchy indicators (e.g., `Test / unit`)

**Why:**

Power users prefer keyboard-driven workflows. A quick `Cmd+Shift+T` is faster than clicking the status bar.

---

### Re-run Last Task

Make it easy to repeat the most recently executed task.

**Behavior:**

- `Taskasaurus: Re-run Last Task` command
- Optionally show a subtle indicator on the last-run task
- Persist across window reloads (workspace state)

**Implementation notes:**

- Store last task identifier in workspace state
- Add command that retrieves and executes it
- Consider a small "repeat" icon or highlight

**Why:**

Test-driven development and iterative builds involve running the same task dozens of times per session.

---

## Medium Priority

### Terminal Focus Option

Control whether the terminal panel is focused when executing a task.

**Behavior:**

- Setting: `taskasaurus.focusTerminalOnRun` (default: `false`)
- When `true`, terminal panel gains focus after task starts
- When `false`, focus stays in editor

**Implementation notes:**

- Read setting value before task execution
- Use VS Code's `revealKind` or manual focus call

**Why:**

Some users want to see output immediately; others find it disruptive. Give users control.

---

### Task Status Persistence

Track running tasks across window reloads.

**Behavior:**

- If a long-running task (dev server, watcher) is still active after reload, show running indicator
- Detect by matching active terminal names to known tasks

**Implementation notes:**

- Store running task IDs in workspace state
- On activation, check for matching active terminals
- Clear state when task ends or terminal closes

**Why:**

Long-running background tasks are common. Users should see accurate state even after reloads.

---

### Short Labels for Status Bar

Allow shorter display names in the cramped status bar.

**Behavior:**

- Support `"statusBarLabel"` property in task definition
- Full `label` still used for tooltips and Command Palette
- Falls back to `label` if not specified

**Example:**

```json
{
  "label": "Build (production with minification)",
  "statusBarLabel": "Build"
}
```

**Why:**

Status bar space is limited. Descriptive labels needed elsewhere shouldn't crowd the UI.

---

## Lower Priority

### Group-Level Icons

Allow explicit icons for parent groups.

**Behavior:**

- Define group icon via convention (e.g., task with `"group": true` flag)
- Or: read from a `taskasaurus.groupIcons` setting

**Why:**

Visual consistency - if all tasks have icons, groups look odd without them.

---

### Task Dependencies Visualization

Show `dependsOn` relationships in the UI.

**Behavior:**

- Tooltip shows dependencies: "Runs: lint, test, build"
- Optional indicator for compound tasks

**Why:**

Helps users understand what will actually run when they click.

---

### Execution Statistics

Track how often each task is run.

**Behavior:**

- Store execution counts in workspace state
- Show in tooltip or via dedicated command
- Optional: auto-suggest favorites based on frequency

**Why:**

Data-driven workflow optimization. Identify candidates for keyboard shortcuts.

---

### Conditional Task Visibility

Hide tasks based on context (branch, environment, etc.).

**Behavior:**

- Support `"showWhen"` expression in task definition
- Evaluate against workspace context variables

**Example:**

```json
{
  "label": "Deploy",
  "showWhen": "gitBranch == main"
}
```

**Implementation notes:**

- Parse and evaluate simple expressions
- Re-evaluate on relevant context changes
- Complex feature - consider scope carefully

**Why:**

Reduces status bar clutter by hiding contextually irrelevant tasks.

---

## Completed

### ~~Configurable auto-collapse timeout~~

Implemented in v0.x. Users can customize via `taskasaurus.autoCollapseTimeout` setting.

### ~~Configurable group delimiter~~

Implemented in v0.x. Users can change delimiter via `taskasaurus.groupDelimiter` setting.
