# Multi-Root Workspace Support

Display tasks from all workspace folders with automatic disambiguation when labels collide across folders.

## User Story

As a developer working in a multi-root workspace (e.g., `api/` and `web/` folders), I want to see tasks from all folders in the status bar with clear labels indicating which folder a task belongs to, so I can run the correct task without confusion.

## Scope

- Fetching and displaying tasks from all workspace folders.
- Detecting duplicate labels across folders.
- Appending a folder-name suffix to disambiguate colliding labels.
- Including folder and source information in tooltips.

Out of scope: per-folder filtering, folder ordering preferences, folder-scoped grouping.

## UX Flow

### No Collisions

If task labels are unique across all folders, no suffix is added. The status bar looks identical to a single-folder workspace.

### Duplicate Labels

Given two folders `api` and `web`, both defining a `Build` task:

| Status Bar Item | Tooltip                |
| --------------- | ---------------------- |
| `Build【api】`  | Run task 'Build' (api) |
| `Build【web】`  | Run task 'Build' (web) |

The `【folderName】` suffix (using fullwidth brackets) is appended only to labels that would otherwise be ambiguous.

### Tooltips

Tooltips always include the source and folder name for multi-root workspaces, regardless of whether disambiguation is needed:

- Root leaf: `Run task 'Build' [source: Workspace] [folder: api]`
- Parent: `Expand group 'Test' [folder: api]`
- Child: `Run task 'Test/unit' [source: Workspace] [folder: api]`

If a task defines a non-empty `detail` property, that value is used as the tooltip instead.

### Grouping Interaction

Groups are formed across all folders. If `api` defines `Test/unit` and `web` defines `Test/e2e`, they form a single `Test` group. The children carry disambiguation suffixes if needed.

## Acceptance Criteria

- [ ] Tasks from all workspace folders appear in the status bar.
- [ ] Labels unique across all folders have no suffix.
- [ ] Duplicate labels across folders receive a `【folderName】` suffix.
- [ ] Tooltips include the folder name in multi-root workspaces.
- [ ] Tasks with a `detail` property use that value as the tooltip.
- [ ] Groups are formed across folders (children from different folders can share a group).
- [ ] Disambiguation suffixes are preserved when short child labels strip the group prefix.
- [ ] Adding or removing a workspace folder triggers a refresh.

## Code Touchpoints

| File                    | Symbol               | Role                                                                                                                     |
| ----------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `src/hierarchy.ts`      | `disambiguateLabels` | Scans all task labels, identifies duplicates across folders, and appends `【folderName】` suffixes to colliding entries. |
| `src/statusBarModel.ts` | `composeLeafTooltip` | Builds the tooltip string including task source and workspace folder name. Respects the `detail` override.               |

## Known Pitfalls

- **Folder name collisions.** If two workspace folders share the same `WorkspaceFolder.name` (unlikely but possible with symlinks or manual configuration), the disambiguation suffix will not help. This is an accepted limitation.
- **Group label ambiguity.** The parent group label (e.g., `Test`) is not disambiguated because groups are virtual and span folders. If users find this confusing, they should use distinct group prefixes per folder.
- **Performance with many folders.** Each folder's `tasks.json` is parsed independently. The deduplication pass is O(n) where n is the total task count. This is not a concern for typical workspace sizes.
- **Suffix in sorting.** Sorting uses the display label including any disambiguation suffix. `Build【api】` sorts before `Build【web】` alphabetically, which may not match the folder order in the workspace file.
