# JSONC Parsing and Metadata

Parses `.vscode/tasks.json` content (JSONC format) and extracts task metadata including icons, hidden labels, defined labels, and group overrides.

**File:** `src/iconParser.ts`

## Public Surface

| Export                                                       | Type       | File                |
| ------------------------------------------------------------ | ---------- | ------------------- |
| `parseTasksJson(text)`                                       | function   | `src/iconParser.ts` |
| `parseTasksJsonFull(text)`                                   | function   | `src/iconParser.ts` |
| `buildTasksMetadata(tasksByFolder, groupOverridesByFolder?)` | function   | `src/iconParser.ts` |
| `TaskDefinition`                                             | type       | `src/iconParser.ts` |
| `TasksJson`                                                  | type       | `src/iconParser.ts` |
| `TasksJsonMetadata`                                          | type       | `src/iconParser.ts` |
| `TasksJsonGroupOverrides`                                    | type alias | `src/iconParser.ts` |

## Responsibilities

- `parseTasksJson(text)`: convenience wrapper that returns only `TaskDefinition[]` from JSONC text. Delegates to `parseTasksJsonFull()`.
- `parseTasksJsonFull(text)`: parses JSONC text using `jsonc-parser` library (`jsonc.parse()`). Returns `{ tasks: TaskDefinition[], groupOverrides: TasksJsonGroupOverrides }`. Extracts `taskasaurus.groups` config from the parsed object. Returns empty results on parse failure.
- `buildTasksMetadata(tasksByFolder, groupOverridesByFolder?)`: merges task definitions from multiple workspace folders into a single `TasksJsonMetadata`. Iterates all folders and:
  - Populates `definedLabels` with every task that has a `label`.
  - Populates `hiddenLabels` with tasks where `hide === true`.
  - Populates `iconMap` with the first icon found per label (first folder wins for duplicates).
  - Merges `groupOverrides` across folders (first folder wins).

### Non-Goals

- Does not read files from disk (handled by `loadTasksJsonData()` in `src/iconLoader.ts`).
- Does not interact with VS Code APIs.

## Key Types

| Type                      | Location            | Description                                                         |
| ------------------------- | ------------------- | ------------------------------------------------------------------- |
| `TaskDefinition`          | `src/iconParser.ts` | `{ label?, icon?: { id?, color? }, hide? }`                         |
| `TasksJson`               | `src/iconParser.ts` | `{ version?, tasks?: TaskDefinition[], taskasaurus?: { groups? } }` |
| `TasksJsonMetadata`       | `src/iconParser.ts` | `{ iconMap, hiddenLabels, definedLabels, groupOverrides }`          |
| `TasksJsonGroupOverrides` | `src/iconParser.ts` | `Map<string, GroupOverride>`                                        |
| `GroupOverride`           | `src/config.ts`     | `{ shortLabel?: boolean }`                                          |
| `IconMap`                 | `src/types.ts`      | `Map<string, string>`                                               |

## Invariants and Failure Modes

- Uses `jsonc-parser` for JSONC support (comments, trailing commas). Does not use `JSON.parse()`.
- `parseTasksJsonFull()` catches all exceptions and returns empty results (`{ tasks: [], groupOverrides: new Map() }`) on any parse error.
- `buildTasksMetadata()`: first folder wins for both `iconMap` entries and `groupOverrides` entries when the same label or group name appears in multiple folders.
- `TaskDefinition.icon.color` is parsed but intentionally ignored downstream (status bar items do not support custom colors).
- Tasks without a `label` property are silently skipped in `buildTasksMetadata()`.

## Extension Points

- The `taskasaurus` key in `tasks.json` supports `groups` with per-group `shortLabel` overrides, parsed by `parseTasksJsonFull()`.

## Related Files

- `src/iconLoader.ts` -- calls `parseTasksJsonFull()` and `buildTasksMetadata()`
- `src/config.ts` -- defines `GroupOverride` type used by `TasksJsonGroupOverrides`
- `src/types.ts` -- defines `IconMap`
- `src/controller.ts` -- consumes `TasksJsonMetadata` via `loadTasksJsonData()`
