# Accordion Expansion

Single-group expand/collapse behavior for the status bar task launcher, ensuring only one group is open at a time with automatic collapse after inactivity.

## User Story

As a developer browsing my task groups, I want clicking a group to expand it in-place and collapse any other open group, so the status bar remains compact and I can focus on one group at a time.

## Scope

- Expanding a collapsed parent group to reveal its children.
- Collapsing any previously expanded group when a new one is opened (accordion).
- Toggling an already-expanded group closed on re-click.
- Auto-collapsing after a configurable timeout (default 10 seconds, 0 disables).

Out of scope: multi-group expansion, keyboard navigation, pinning groups open.

### Expand Animation

When `taskasaurus.animateExpand` is enabled (default `true`), children are revealed one at a time with a 60ms stagger delay between each. Setting `animateExpand` to `false` reveals all children instantly.

## UX Flow

### State: All Collapsed (default)

Status bar shows only root-level items (parents with `$(chevron-right)` and root leaves). This is the resting state.

### State: One Group Expanded

A single parent shows `$(chevron-down)` and its children are inserted directly after it in the status bar. All other parents remain collapsed.

### Transitions

| Current State | Action         | Next State                    |
| ------------- | -------------- | ----------------------------- |
| All collapsed | Click parent A | Expanded(A)                   |
| Expanded(A)   | Click parent A | All collapsed                 |
| Expanded(A)   | Click parent B | Expanded(B)                   |
| Expanded(A)   | Click any leaf | All collapsed (task executes) |
| Expanded(A)   | 10s inactivity | All collapsed                 |

### Auto-Collapse Timer

- Timer starts (or resets) on every Taskasaurus-related click while a group is expanded.
- Timer is cancelled when all groups are collapsed (no timer runs in resting state).
- Default timeout: 10 seconds, configurable via `taskasaurus.autoCollapseTimeout` (value in milliseconds, default `10000`).
- Setting timeout to `0` disables auto-collapse entirely.
- "Inactivity" means no Taskasaurus click events. Mouse-leave detection is not available in the status bar API.

## Acceptance Criteria

- [ ] Clicking a collapsed parent expands it and inserts its children after it in the status bar.
- [ ] Clicking the currently expanded parent collapses it (toggle behavior).
- [ ] Clicking a different parent collapses the current group and expands the new one.
- [ ] Clicking any leaf (root or child) collapses all groups.
- [ ] After the configured timeout with no Taskasaurus clicks, all groups collapse automatically.
- [ ] Setting `taskasaurus.autoCollapseTimeout` to `0` disables the auto-collapse timer.
- [ ] The timer resets on every Taskasaurus click while expanded.
- [ ] No timer is running when all groups are collapsed.

## Code Touchpoints

| File                | Symbol                  | Role                                                                        |
| ------------------- | ----------------------- | --------------------------------------------------------------------------- |
| `src/controller.ts` | `handleParentClick`     | Accordion toggle based on `UIState.expandedGroupId`. Calls render after.    |
| `src/controller.ts` | `startCollapseTimer`    | Starts/resets auto-collapse `setTimeout`. Reads timeout from config.        |
| `src/controller.ts` | `startExpandAnimation`  | Staggers child reveal when `animateExpand` is on. Uses `EXPAND_STAGGER_MS`. |
| `src/controller.ts` | `cancelExpandAnimation` | Cancels in-progress expand animation; clears `UIState.revealedChildCount`.  |

## Known Pitfalls

- **Timer drift.** `setTimeout` is not precision-guaranteed. For a 10-second UX timeout this is acceptable, but tests should use fuzzy assertions or fake timers.
- **Rapid clicks.** Multiple fast clicks can queue multiple state transitions. The controller must process them synchronously (state updates are synchronous; only rendering is async). Each click should see the result of the previous click's state change.
- **Task execution during expand.** Clicking a child leaf both executes the task and collapses all groups. The collapse must happen before or simultaneously with the execution call to avoid showing stale expanded state while the task launches.
- **No mouse-leave detection.** The status bar API does not expose hover or mouse-leave events. The timeout is the only mechanism for auto-collapse, which means users who click elsewhere in VS Code (but not on Taskasaurus) will still see the expanded state until the timer fires.
