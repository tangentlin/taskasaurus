# Task Identity

Provides deterministic identity and equality for VS Code tasks, enabling task lookup, feedback tracking, and stable node IDs.

**File:** `src/taskKey.ts`

## Public Surface

| Export                    | Type     | File             |
| ------------------------- | -------- | ---------------- |
| `createTaskKey(task)`     | function | `src/taskKey.ts` |
| `taskKeyToId(key)`        | function | `src/taskKey.ts` |
| `taskKeysEqual(a, b)`     | function | `src/taskKey.ts` |
| `resolveTask(tasks, key)` | function | `src/taskKey.ts` |

## Responsibilities

- `createTaskKey(task)`: extracts a `TaskKey` from a `vscode.Task` instance. Fields: `label` (from `task.name`), `source` (from `task.source`), `folder` (from `task.scope` if it is a `WorkspaceFolder`), `definitionType` (from `task.definition.type`), `detail` (from `task.detail`, coerced to `undefined` if falsy).
- `taskKeyToId(key)`: serializes a `TaskKey` to a string by joining `label`, `source`, and optionally `folder` and `definitionType` with `"::"` separator. Used for `FeedbackMap` keys and node ID generation.
- `taskKeysEqual(a, b)`: compares `label`, `source`, `folder`, and `definitionType` for strict equality. Note: `detail` is intentionally excluded from equality checks.
- `resolveTask(tasks, key)`: finds the first task in the array whose `createTaskKey()` output is equal (via `taskKeysEqual()`) to the provided key. Returns `undefined` if not found.

### Non-Goals

- Does not store or cache tasks. Resolution is a linear scan each time.
- Does not handle task execution (handled by `TaskasaurusController` in `src/controller.ts`).

## Key Types

| Type      | Location       | Description                                            |
| --------- | -------------- | ------------------------------------------------------ |
| `TaskKey` | `src/types.ts` | `{ label, source, folder?, definitionType?, detail? }` |

## Invariants and Failure Modes

- `taskKeyToId()` output varies based on which optional fields are present. Two keys with different `folder` values but otherwise identical fields produce different IDs.
- `taskKeysEqual()` does not compare `detail` -- two tasks with the same label/source/folder/definitionType but different details are considered equal.
- `resolveTask()` returns the first match via `Array.find()`. If multiple tasks match the same key (unlikely in practice), only the first is returned.
- `createTaskKey()` handles the case where `task.scope` is not a `WorkspaceFolder` (e.g., global tasks) by setting `folder` to `undefined`.

## Extension Points

None. This module is a pure utility with no configuration dependencies.

## Related Files

- `src/types.ts` -- `TaskKey` type definition
- `src/controller.ts` -- uses `createTaskKey()` for feedback tracking, `resolveTask()` for task execution
- `src/hierarchy.ts` -- uses `createTaskKey()` and `taskKeyToId()` for node ID generation
- `src/statusBarModel.ts` -- uses `taskKeyToId()` for feedback map lookups
