# Task Grouping

Delimiter-based 2-level hierarchy that derives virtual groups from task label conventions, requiring zero explicit configuration.

## User Story

As a developer with many tasks in `tasks.json`, I want tasks that share a common prefix to be visually grouped in the status bar, so I can navigate related tasks without scrolling through a flat list.

## Scope

- Parsing task labels to extract group membership via a configurable delimiter (default `/`).
- Forming group parent nodes when 2 or more children share a prefix.
- Promoting single-child groups back to root leaves to avoid unnecessary nesting.
- Handling the edge case where a task label exactly matches a group name.

Out of scope: 3+ level nesting, drag-and-drop reordering, explicit group definitions.

## UX Flow

### Collapsed State (default)

Given tasks `Build`, `Test/unit`, `Test/e2e`, `Check/lint`, `Check/style`, `Run`:

| Status Bar Item          | Type               |
| ------------------------ | ------------------ |
| `Build`                  | Root leaf          |
| `Check $(chevron-right)` | Parent (collapsed) |
| `Test $(chevron-right)`  | Parent (collapsed) |
| `Run`                    | Root leaf          |

Items are sorted alphabetically (case-insensitive) by display label.

### Single-Child Promotion

If `Check/style` is removed (or hidden), `Check/lint` has no sibling. The `Check` group is not created. `Check/lint` appears as a root leaf with its full label.

### Edge Case: Task Label Equals Group Name

If a task with label `Test` exists alongside `Test/unit` and `Test/e2e`:

- `Test` remains a non-runnable parent toggle in the status bar.
- The runnable `Test` task appears as the first child inside the group: `$(arrow-small-right) Test`.
- Tooltip on the parent: "Expand group 'Test'".
- Tooltip on the child: "Run task 'Test'".

## Acceptance Criteria

- [ ] Tasks without a delimiter appear as root leaves.
- [ ] Tasks sharing a prefix (2+ siblings) form a parent group.
- [ ] A prefix with only one child does not form a group; the child is promoted to a root leaf.
- [ ] Changing the delimiter via `taskasaurus.groupDelimiter` alters grouping behavior.
- [ ] A task whose label exactly matches its group name appears as a runnable child at the top of the expanded group.
- [ ] Groups and root leaves are sorted alphabetically (case-insensitive) by display label.
- [ ] Group children are sorted alphabetically by full task label.
- [ ] Hidden tasks (`"hide": true`) are excluded before grouping runs, affecting group formation counts.

## Code Touchpoints

| File                | Symbol               | Role                                                                                                      |
| ------------------- | -------------------- | --------------------------------------------------------------------------------------------------------- |
| `src/hierarchy.ts`  | `buildHierarchy`     | Core grouping algorithm: splits labels, counts children per prefix, emits `ParentNode` or `RootLeafNode`. |
| `src/config.ts`     | `getConfig`          | Reads `taskasaurus.groupDelimiter` (default `"/"`).                                                       |
| `src/iconParser.ts` | `buildTasksMetadata` | Produces `hiddenLabels` set consumed before `buildHierarchy` runs.                                        |

## Known Pitfalls

- **Delimiter in label body.** Only the first occurrence of the delimiter is used for splitting. A task labeled `Build/docker/prod` produces group `Build` with child `Build/docker/prod`. There is no third level.
- **Whitespace around delimiter.** The group name is trimmed (`label.split('/', 1)[0].trim()`), but the full label stored on the child node is not trimmed. Inconsistent spacing in `tasks.json` labels can cause visual mismatches.
- **Rapid task additions.** Adding or removing tasks that cross the 2-child threshold causes a structural change (leaf to group or group to leaf). This is handled on refresh but may cause a brief visual reflow.
- **Group name collisions across folders.** In multi-root workspaces, groups are formed per-label, not per-folder. Two folders both defining `Test/unit` contribute to the same `Test` group. Disambiguation suffixes are applied to child labels, not to the group parent.
