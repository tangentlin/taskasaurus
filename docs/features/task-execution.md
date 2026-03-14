# Task Execution

Click-to-run leaf tasks with visual feedback for running, success, and failure states.

## User Story

As a developer, I want to click a task in the status bar to run it immediately and see visual feedback indicating whether it is running, succeeded, or failed, so I can monitor task outcomes without switching to the terminal.

## Scope

- Executing a task via `vscode.tasks.executeTask` on leaf click.
- Collapsing all groups on execution.
- Displaying a spinner icon while the task runs.
- Displaying success or failure icons for 2 seconds after completion.
- Tracking multiple concurrent task executions independently.

Out of scope: task cancellation from the status bar, re-run on failure, task output streaming.

## UX Flow

### State: Idle

The task displays its normal label (with optional task icon). No feedback icon is shown.

### State: Running

The task's status bar item shows `$(loading~spin)` (animated spinner) replacing the task icon position. The label text remains unchanged.

### State: Success

On exit code `0`, the spinner is replaced with `$(check)` for 2 seconds, then the item reverts to idle.

### State: Failure

On non-zero exit code, the spinner is replaced with `$(error)` for 2 seconds, then the item reverts to idle.

### Execution Sequence

1. User clicks a leaf item (root leaf or child leaf).
2. All groups collapse immediately.
3. `vscode.tasks.executeTask(task)` is called.
4. `onDidStartTaskProcess` fires: item enters Running state.
5. Task completes. `onDidEndTaskProcess` fires with exit code.
6. Item enters Success or Failure state for 2 seconds.
7. Item reverts to Idle state.

### Concurrent Execution

Each task tracks its own feedback state independently. If `Build` is running and the user launches `Test/unit`, both items show spinners simultaneously.

### Expanded vs. Collapsed Feedback

- If the task is a visible child (group expanded), feedback appears on the child item.
- When the group collapses, feedback transfers to the corresponding root-level item (parent or promoted leaf).
- Feedback is never lost due to expand/collapse transitions.

## Acceptance Criteria

- [ ] Clicking a root leaf executes the associated task.
- [ ] Clicking a child leaf executes the associated task and collapses all groups.
- [ ] A running task displays `$(loading~spin)` in place of its task icon.
- [ ] A task that exits with code 0 displays `$(check)` for 2 seconds.
- [ ] A task that exits with a non-zero code displays `$(error)` for 2 seconds.
- [ ] After the 2-second feedback period, the item reverts to its normal icon/label.
- [ ] Multiple tasks can run concurrently, each with independent feedback.
- [ ] If the same task is launched multiple times, each execution is tracked independently.
- [ ] Hidden tasks (`"hide": true`) never show feedback (they have no status bar item).
- [ ] If `executeTask` throws, an error message is shown via `window.showErrorMessage`.

## Code Touchpoints

| File | Symbol | Role |
|---|---|---|
| `src/controller.ts` | `handleLeafClick` | Collapses all groups, resolves the `Task` object from `TaskKey`, calls `executeTask`. |
| `src/controller.ts` | `handleTaskStart` | Listener for `onDidStartTaskProcess`. Matches the execution to a `TaskKey` and sets the running state. |
| `src/controller.ts` | `handleTaskEnd` | Listener for `onDidEndTaskProcess`. Reads exit code, sets success/failure state, schedules 2-second revert timer. |
| `src/statusBarModel.ts` | `getFeedbackIcon` | Returns the appropriate codicon string (`$(loading~spin)`, `$(check)`, `$(error)`, or `undefined`) for a task's current feedback state. |

## Known Pitfalls

- **Task identity matching.** `onDidStartTaskProcess` and `onDidEndTaskProcess` provide a `TaskExecution` object. Matching it back to a `TaskKey` requires comparing label, source, and folder. Mismatches cause orphaned feedback states.
- **Rapid re-launch.** If a user launches the same task again before the previous execution's 2-second feedback expires, both executions must be tracked. The feedback icon should reflect the most recent state (running takes precedence over a lingering success/error).
- **executeTask rejection.** In restricted environments (e.g., virtual workspaces, remote containers without shell access), `executeTask` can throw. The catch handler must prevent the UI from entering an inconsistent state.
- **Timer cleanup on dispose.** The 2-second revert timers must be cleared when the extension deactivates to avoid errors from callbacks firing after disposal.
