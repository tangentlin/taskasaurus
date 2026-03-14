# Short Child Labels

Strip redundant group prefixes from child labels when a group is expanded, saving status bar space.

## User Story

As a developer viewing an expanded task group, I want child labels to omit the group prefix (e.g., `Test/unit` shown as `unit`) since the parent already provides that context, so the status bar stays compact.

## Scope

- Stripping `GroupName + delimiter` from child display labels when short labels are enabled.
- Global toggle via `taskasaurus.shortChildLabels` (default `true`).
- Per-group overrides in both `settings.json` and `tasks.json`.
- Defined resolution order for conflicting settings.

Out of scope: shortening root leaf labels, shortening parent labels, custom display name mappings.

## UX Flow

### Default Behavior (short labels enabled)

Expanded `Test` group:

| Status Bar Item             | Display Label             |
| --------------------------- | ------------------------- |
| `Test $(chevron-down)`      | `Test` (parent)           |
| `$(arrow-small-right) unit` | stripped from `Test/unit` |
| `$(arrow-small-right) e2e`  | stripped from `Test/e2e`  |

### Short Labels Disabled (global or per-group)

Expanded `Test` group with `shortChildLabels: false`:

| Status Bar Item                  | Display Label   |
| -------------------------------- | --------------- |
| `Test $(chevron-down)`           | `Test` (parent) |
| `$(arrow-small-right) Test/unit` | full label      |
| `$(arrow-small-right) Test/e2e`  | full label      |

### Configuration Examples

**Global default in `settings.json`:**

```json
{
  "taskasaurus.shortChildLabels": false
}
```

**Per-group override in `settings.json`:**

```json
{
  "taskasaurus.groups": {
    "Test": { "shortLabel": true },
    "Check": { "shortLabel": false }
  }
}
```

**Per-group override in `tasks.json`:**

```jsonc
{
  "tasks": [
    /* ... */
  ],
  "taskasaurus": {
    "groups": {
      "Check": { "shortLabel": false },
    },
  },
}
```

### Resolution Order

For a given group, the effective `shortLabel` value is resolved top-down (first match wins):

1. `tasks.json` `taskasaurus.groups.<GroupName>.shortLabel` (highest priority)
2. `settings.json` `taskasaurus.groups.<GroupName>.shortLabel`
3. `settings.json` `taskasaurus.shortChildLabels` (global)
4. Built-in default: `true`

### Display Rules

- **Tooltip:** Always shows the full task label regardless of display setting.
- **Sorting:** Always by full task label, not by the shortened display label.
- **Multi-root suffix:** The prefix is stripped but the disambiguation suffix is preserved. `Test/unit【api】` displays as `unit【api】`.
- **Promoted root leaves:** Single-child groups promoted to root leaves always show their full label. There is no group context to make stripping meaningful.
- **No prefix match:** If the child label does not start with `GroupName + delimiter` (e.g., a task whose label exactly equals the group name), the label is shown as-is.

## Acceptance Criteria

- [ ] With default settings, child labels strip the `GroupName/` prefix when the group is expanded.
- [ ] Setting `taskasaurus.shortChildLabels` to `false` globally shows full child labels.
- [ ] Per-group overrides in `settings.json` take effect for the specified group only.
- [ ] Per-group overrides in `tasks.json` take precedence over `settings.json` per-group overrides.
- [ ] `tasks.json` per-group > `settings.json` per-group > `settings.json` global > built-in default.
- [ ] Tooltips always show the full task label.
- [ ] Sorting uses the full task label, not the shortened display label.
- [ ] Multi-root disambiguation suffixes are preserved after prefix stripping.
- [ ] Promoted root leaves (single-child groups) show their full label.

## Code Touchpoints

| File                    | Symbol                | Role                                                                                                                                     |
| ----------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `src/statusBarModel.ts` | `computeDisplayLabel` | Applies prefix stripping to a child label based on the resolved `shortLabel` setting for the child's group.                              |
| `src/config.ts`         | `getConfig`           | Reads `taskasaurus.shortChildLabels` (global boolean) and `taskasaurus.groups` (per-group overrides) from VS Code settings.              |
| `src/iconParser.ts`     | `parseTasksJsonFull`  | Reads the `taskasaurus.groups` block from `tasks.json` JSONC to extract per-group `shortLabel` overrides.                                |
| `src/controller.ts`     | Lines 122-138         | Integrates the resolved short-label setting when building display labels during render. Calls `computeDisplayLabel` for each child node. |

## Known Pitfalls

- **Delimiter mismatch.** If the delimiter is changed from `/` to something else, the prefix stripping must use the configured delimiter, not a hardcoded `/`. Both `computeDisplayLabel` and the grouping algorithm must read the same delimiter from config.
- **Edge case: label equals group name.** A task labeled `Test` inside the `Test` group does not start with `Test/`, so no stripping occurs. The label is displayed as-is, which is the correct behavior.
- **Settings change detection.** Changes to `settings.json` or `tasks.json` require a refresh to take effect. The debounced refresh on file save handles `tasks.json` changes. `settings.json` changes are picked up via `onDidChangeConfiguration`.
- **Override granularity.** Overrides are per-group, not per-task. There is no way to show short labels for some children in a group but not others.
