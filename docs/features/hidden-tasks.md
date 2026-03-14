# Hidden Tasks

Exclude specific tasks from the status bar while keeping them available via the VS Code command palette and keybindings.

## User Story

As a developer, I want to mark certain utility tasks (background watchers, internal scripts) as hidden so they do not clutter the status bar, while still being runnable through other VS Code mechanisms.

## Scope

- Reading the `"hide": true` property from task definitions in `.vscode/tasks.json`.
- Filtering hidden tasks out before hierarchy building.
- Ensuring hidden tasks do not affect group formation or child counts.

Out of scope: hiding tasks via settings.json, hiding auto-detected tasks (they are already excluded), toggling visibility at runtime.

## UX Flow

### Configuration

In `.vscode/tasks.json`:

```jsonc
{
  "tasks": [
    {
      "label": "Watch/sass",
      "type": "shell",
      "command": "sass --watch src:dist",
      "hide": true,
    },
  ],
}
```

### Behavior

- `Watch/sass` does not appear in the status bar.
- If `Watch/sass` was the only child of the `Watch` group, no `Watch` group is created.
- If `Watch/css` also exists (not hidden), it appears as a root leaf (single-child promotion) rather than inside a `Watch` group.

### No Feedback for Hidden Tasks

Hidden tasks have no status bar item. If a hidden task is executed via the command palette, no spinner, success, or error icon is shown in Taskasaurus.

## Acceptance Criteria

- [ ] Tasks with `"hide": true` in `tasks.json` do not appear in the status bar.
- [ ] Hidden tasks do not count toward group formation (a group needs 2+ visible children).
- [ ] Removing `"hide": true` from a task makes it appear on the next refresh.
- [ ] Hidden tasks can still be executed via the VS Code command palette.
- [ ] No runtime feedback is shown for hidden tasks (no status bar item exists to display it).
- [ ] The `hide` property is read from JSONC (comments and trailing commas are tolerated).

## Code Touchpoints

| File                | Symbol               | Role                                                                                                                                                                                     |
| ------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/iconParser.ts` | `buildTasksMetadata` | Parses `tasks.json` (JSONC) and produces a `hiddenLabels: Set<string>` containing labels of tasks where `hide === true`.                                                                 |
| `src/controller.ts` | `refresh`            | After fetching tasks via `vscode.tasks.fetchTasks()`, iterates and filters out any task whose label is in the `hiddenLabels` set before passing the remaining tasks to `buildHierarchy`. |

## Known Pitfalls

- **JSONC parsing required.** `tasks.json` supports comments and trailing commas. Using `JSON.parse` instead of a JSONC parser will fail on files with comments. The `jsonc-parser` library is used for this purpose.
- **Label matching sensitivity.** The `hide` property is matched by exact task label. If a task label in `tasks.json` does not exactly match the label returned by `fetchTasks()`, the filter will miss it. This can happen if VS Code normalizes whitespace differently.
- **hide is not a standard VS Code property.** The `"hide"` key is a Taskasaurus-specific extension of the task schema. VS Code ignores unknown properties in `tasks.json`, so there is no conflict, but users may be confused if they expect it to affect the built-in task picker as well.
