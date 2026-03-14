# Configuration

Reads and validates Taskasaurus settings from VS Code workspace configuration.

**File:** `src/config.ts`

## Public Surface

| Export                            | Type         | File            |
| --------------------------------- | ------------ | --------------- |
| `getConfig()`                     | function     | `src/config.ts` |
| `affectsTaskasaurusConfig(event)` | function     | `src/config.ts` |
| `DEFAULT_DELIMITER`               | const string | `src/config.ts` |
| `GroupOverride`                   | type         | `src/config.ts` |
| `TaskasaurusConfig`               | interface    | `src/config.ts` |

## Responsibilities

- `getConfig()`: reads from `vscode.workspace.getConfiguration("taskasaurus")` and returns a validated `TaskasaurusConfig` object. Parses the raw `groups` object into a `Map<string, GroupOverride>`.
- `affectsTaskasaurusConfig(event)`: checks if a `ConfigurationChangeEvent` affects any `taskasaurus.*` setting. Returns `boolean`.
- `DEFAULT_DELIMITER`: the constant `"/"`.
- `validateDelimiter()` (internal): ensures the delimiter is a single character. Returns `DEFAULT_DELIMITER` if the value is not a string or not exactly one character long.

### Non-Goals

- Does not read `taskasaurus.autoCollapseTimeout` -- that setting is read directly by `TaskasaurusController.startCollapseTimer()` in `src/controller.ts`.
- Does not merge tasks.json overrides (handled in `TaskasaurusController.refresh()`).

## Settings

| Setting                           | Type    | Default | Validation                                                 |
| --------------------------------- | ------- | ------- | ---------------------------------------------------------- |
| `taskasaurus.groupDelimiter`      | string  | `"/"`   | Must be exactly 1 character; falls back to `"/"`           |
| `taskasaurus.shortChildLabels`    | boolean | `true`  | Falls back to `true` if not a boolean                      |
| `taskasaurus.groups`              | object  | `{}`    | Keyed by group name; each value `{ shortLabel?: boolean }` |
| `taskasaurus.autoCollapseTimeout` | integer | `10000` | Read directly in controller, not via `getConfig()`         |

## Key Types

| Type                | Location        | Description                                                                                         |
| ------------------- | --------------- | --------------------------------------------------------------------------------------------------- |
| `TaskasaurusConfig` | `src/config.ts` | `{ groupDelimiter: string, shortChildLabels: boolean, groupOverrides: Map<string, GroupOverride> }` |
| `GroupOverride`     | `src/config.ts` | `{ shortLabel?: boolean }`                                                                          |

## Invariants and Failure Modes

- `getConfig()` always returns a valid `TaskasaurusConfig`. Invalid delimiter values silently fall back to `DEFAULT_DELIMITER`.
- `GroupOverride` entries with non-boolean `shortLabel` values have `shortLabel` set to `undefined` (effectively ignored).
- `affectsTaskasaurusConfig()` uses VS Code's built-in `event.affectsConfiguration("taskasaurus")` which covers all sub-keys.

## Extension Points

- New settings can be added by extending `TaskasaurusConfig` and reading additional keys in `getConfig()`.
- Per-group overrides support arbitrary group names as keys in the `taskasaurus.groups` object.

## Related Files

- `src/controller.ts` -- calls `getConfig()` during `refresh()`; reads `autoCollapseTimeout` separately
- `src/iconParser.ts` -- imports `GroupOverride` type for tasks.json group overrides
- `src/statusBarModel.ts` -- `ShortLabelConfig` consumes `groupDelimiter` and `shortChildLabels`
