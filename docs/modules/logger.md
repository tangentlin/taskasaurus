# Logging

Provides timestamped logging to a dedicated VS Code output channel for diagnostics and traceability.

**File:** `src/logger.ts`

## Public Surface

| Export | Type | File |
|---|---|---|
| `logInfo(message)` | function | `src/logger.ts` |
| `logDebug(message)` | function | `src/logger.ts` |
| `logWarn(message)` | function | `src/logger.ts` |
| `logTaskSource(taskLabel, source, folder, included)` | function | `src/logger.ts` |
| `logTasksJsonFound(folderName, filePath, taskCount)` | function | `src/logger.ts` |
| `logTasksJsonNotFound(folderName)` | function | `src/logger.ts` |
| `logFilteringSummary(totalFetched, totalIncluded, totalFiltered)` | function | `src/logger.ts` |
| `disposeLogger()` | function | `src/logger.ts` |

## Responsibilities

- General logging: `logInfo()`, `logDebug()`, `logWarn()` write timestamped messages at respective levels to the output channel. Format: `[ISO-timestamp] LEVEL: message`.
- `logTaskSource()`: debug-level log for each task during filtering, showing label, source, folder, and whether it was `INCLUDED` or `FILTERED`.
- `logTasksJsonFound()`: info-level log when a `tasks.json` file is discovered, including folder name, file path, and task count.
- `logTasksJsonNotFound()`: debug-level log when a folder has no `tasks.json`.
- `logFilteringSummary()`: info-level summary of task filtering results (total fetched, included, filtered out).
- `disposeLogger()`: disposes the output channel and resets the module-level reference.

### Non-Goals

- Does not provide log-level filtering or configuration. All levels are always written.
- Does not write to files or external log services.

## How It Works

The module lazily creates a single `vscode.OutputChannel` named `"Taskasaurus"` via `getChannel()` (internal). The channel is created on first log call and reused for all subsequent calls. The channel appears in the VS Code Output panel under the "Taskasaurus" dropdown.

## Key Types

No exported types. All functions accept primitive parameters.

## Invariants and Failure Modes

- The output channel is created lazily on first use. If no log function is ever called, no channel is created.
- `disposeLogger()` is safe to call multiple times; subsequent calls are no-ops.
- Timestamps use `new Date().toISOString()` for consistent UTC formatting.

## Extension Points

None. Add new `log*` functions following the existing pattern for domain-specific log messages.

## Related Files

- `src/controller.ts` -- calls `logInfo()`, `logTaskSource()`, `logFilteringSummary()`
- `src/iconLoader.ts` -- calls `logTasksJsonFound()`, `logTasksJsonNotFound()`
