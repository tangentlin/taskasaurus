# ADR 002: Virtual Groups from Label Delimiters

## Status

Accepted

## Context

Taskasaurus displays tasks in a 2-level hierarchy (groups and leaves). The grouping mechanism needs to be defined. Two approaches were considered:

1. **Convention-based (virtual groups):** Derive groups automatically from a delimiter in the task label. A task labeled `Test/unit` belongs to the `Test` group. No explicit configuration needed.
2. **Configuration-based (explicit groups):** Users define groups in settings or `tasks.json` and assign tasks to them via a `group` property.

The target user experience prioritizes zero-config setup. Users should add tasks to `tasks.json` with a naming convention and see groups appear automatically.

## Decision

Derive groups from task label delimiters. The first occurrence of the delimiter (default `/`) splits the label into a group name and a task name. Groups are created only when 2 or more tasks share the same group name prefix. Single-child groups are promoted to root leaves.

The delimiter is configurable via `taskasaurus.groupDelimiter` but defaults to `/` to match common `Group/task` naming conventions.

The hierarchy is limited to 2 levels (one level of groups, one level of leaves). Deeper nesting (e.g., `Build/docker/prod`) is not supported; only the first delimiter is used for splitting.

## Consequences

**Positive:**

- Zero configuration required for grouping. Users just name their tasks with a convention.
- Adding a new task to a group requires only matching the prefix -- no settings changes needed.
- Removing all but one child automatically dissolves the group (promotion to root leaf).
- The naming convention (`Group/task`) is self-documenting in `tasks.json`.

**Negative:**

- Users must adopt the naming convention. Existing tasks may need renaming.
- Limited to 2 levels. Users with complex task taxonomies cannot create deeper hierarchies.
- A task label that coincidentally contains the delimiter will be grouped unintentionally. The workaround is to change the delimiter or rename the task.
- The delimiter is global. Different groups cannot use different delimiters.

## Alternatives Considered

### Explicit Group Property

Users would define groups in configuration and assign tasks via a `group` property:

```jsonc
{
  "taskasaurus": {
    "groups": {
      "Test": ["Test/unit", "Test/e2e"],
    },
  },
}
```

Rejected because:

- Higher configuration burden. Users must maintain group assignments alongside task definitions.
- More error-prone. Typos in group assignments cause tasks to silently disappear from groups.
- Does not align with the zero-config philosophy of the product.

### Hybrid Approach

Auto-detect groups from delimiters but allow explicit overrides. Not pursued in the initial version to keep the implementation simple. This could be added later if the convention-based approach proves insufficient.
