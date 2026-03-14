# Task Icons

Best-effort icon resolution for tasks, displaying codicons next to task labels in the status bar.

## User Story

As a developer, I want tasks to display recognizable icons (build hammer, test beaker, etc.) next to their labels in the status bar, so I can visually identify task types at a glance.

## Scope

- Resolving icon IDs from runtime `Task` objects.
- Falling back to JSONC parsing of `tasks.json` for icon definitions.
- Rendering icons as codicon strings in status bar item text.
- Ignoring color properties (status bar does not support per-item coloring).

Out of scope: custom icon packs, user-defined icon mappings in settings, icon color rendering.

## UX Flow

### Icon Display

Icons appear in the status bar text using the `$(iconId)` codicon syntax:

- **Root leaf with icon:** `$(beaker) Test/unit`
- **Root leaf without icon:** `Test/unit`
- **Parent with icon:** `$(beaker) Test $(chevron-right)`
- **Child with icon:** `$(arrow-small-right) $(beaker) unit`
- **Child without icon:** `$(arrow-small-right) unit`

### Resolution Priority

Icons are resolved in this order (first match wins):

1. **Runtime Task.icon.id** -- If the `Task` object from `fetchTasks()` exposes an `icon` property with a `ThemeIcon`-like identifier, use it. Some task providers set this.
2. **tasks.json JSONC parsing** -- Parse `.vscode/tasks.json` from each workspace folder. Build a map from task label to icon ID from the `icon` property in task definitions.
3. **No icon** -- If neither source provides an icon, render the label without an icon prefix.

### Color Handling

The `icon.color` property is ignored. `StatusBarItem.text` supports codicon rendering but not per-icon coloring. No warning is shown for ignored colors.

## Acceptance Criteria

- [ ] Tasks with a runtime `icon.id` display that icon in the status bar.
- [ ] Tasks with an `icon` defined in `tasks.json` display that icon when no runtime icon exists.
- [ ] Tasks without any icon definition render their label without an icon prefix.
- [ ] Icon color properties are silently ignored.
- [ ] Icons are resolved independently for each task (one task's icon does not affect another).
- [ ] In multi-root workspaces, icon maps are merged across all workspace folders.
- [ ] Parent group icons come from the runnable task matching the group name (if one exists), not from children.

## Code Touchpoints

| File                | Symbol               | Role                                                                                                                     |
| ------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------- |
| `src/hierarchy.ts`  | `getTaskIconId`      | Checks the runtime `Task` object for an icon ID. Returns `string                                                         | undefined`. |
| `src/iconParser.ts` | `buildTasksMetadata` | Parses `tasks.json` JSONC to build a `Map<string, string>` from task label to icon ID.                                   |
| `src/iconLoader.ts` | `loadTasksJsonData`  | Reads and parses `.vscode/tasks.json` files from all workspace folders. Provides raw JSONC data to `buildTasksMetadata`. |

## Known Pitfalls

- **Runtime icon availability varies.** The `Task.icon` property is not guaranteed by the VS Code API for all task types. Shell tasks defined in `tasks.json` may not expose it at runtime even if the JSON defines it. The JSONC fallback covers this gap.
- **JSONC parsing failures.** Malformed `tasks.json` files (beyond what JSONC tolerates) will cause the icon map to be empty for that folder. The extension logs a warning but does not fail.
- **Icon ID validity.** There is no validation that an icon ID from `tasks.json` is a real codicon. An invalid ID like `$(nonexistent)` renders as empty text in VS Code. This is a silent failure.
- **Stale icon cache.** Icon maps are rebuilt on each refresh (triggered by `tasks.json` save). Between saves, newly added icons in `tasks.json` are not visible.
