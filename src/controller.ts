import * as vscode from "vscode";
import type { RootNode, NodeId, UIState, TaskKey, Node, TaskFeedback } from "./types";
import { buildHierarchy, disambiguateLabels } from "./hierarchy";
import { createTaskKey, resolveTask, taskKeyToId } from "./taskKey";
import { StatusBarRenderer } from "./statusBar";
import { loadTasksJsonData } from "./iconLoader";

const AUTO_COLLAPSE_TIMEOUT_MS = 10_000;
const REFRESH_DEBOUNCE_MS = 250;
const FEEDBACK_DISPLAY_MS = 2_000;

export type FeedbackMap = Map<string, TaskFeedback>;

export class TaskasaurusController {
  private uiState: UIState = {};
  private roots: RootNode[] = [];
  private tasks: vscode.Task[] = [];
  private readonly renderer: StatusBarRenderer;
  private refreshTimer?: ReturnType<typeof setTimeout>;
  private readonly feedbackMap: FeedbackMap = new Map();
  private readonly disposables: vscode.Disposable[] = [];

  constructor() {
    this.renderer = new StatusBarRenderer();
    this.setupTaskListeners();
  }

  private setupTaskListeners(): void {
    // Listen for task process start
    this.disposables.push(
      vscode.tasks.onDidStartTaskProcess((e) => {
        this.handleTaskStart(e.execution.task);
      }),
    );

    // Listen for task process end
    this.disposables.push(
      vscode.tasks.onDidEndTaskProcess((e) => {
        this.handleTaskEnd(e.execution.task, e.exitCode);
      }),
    );
  }

  private handleTaskStart(task: vscode.Task): void {
    const taskKey = createTaskKey(task);
    const keyId = taskKeyToId(taskKey);

    // Clear any existing timer for this task
    const existing = this.feedbackMap.get(keyId);
    if (existing?.timer) {
      clearTimeout(existing.timer);
    }

    this.feedbackMap.set(keyId, { state: "running" });
    this.render();
  }

  private handleTaskEnd(task: vscode.Task, exitCode: number | undefined): void {
    const taskKey = createTaskKey(task);
    const keyId = taskKeyToId(taskKey);

    // Clear any existing timer
    const existing = this.feedbackMap.get(keyId);
    if (existing?.timer) {
      clearTimeout(existing.timer);
    }

    // Set success or error state
    const state = exitCode === 0 ? "success" : "error";

    // Set up timer to clear feedback after display period
    const timer = setTimeout(() => {
      this.feedbackMap.delete(keyId);
      this.render();
    }, FEEDBACK_DISPLAY_MS);

    this.feedbackMap.set(keyId, { state, timer });
    this.render();
  }

  async refresh(): Promise<void> {
    const [allTasks, tasksJsonData] = await Promise.all([
      vscode.tasks.fetchTasks(),
      loadTasksJsonData(),
    ]);

    // Filter out hidden tasks before building hierarchy
    const visibleTasks = allTasks.filter((task) => !tasksJsonData.hiddenLabels.has(task.name));

    this.tasks = visibleTasks;
    this.roots = buildHierarchy(this.tasks, tasksJsonData.iconMap);
    disambiguateLabels(this.roots);
    this.render();
  }

  scheduleRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    this.refreshTimer = setTimeout(() => {
      this.refreshTimer = undefined;
      this.refresh();
    }, REFRESH_DEBOUNCE_MS);
  }

  onClickNode(nodeId: NodeId): void {
    const node = this.lookupNode(nodeId);
    if (!node) {
      console.warn(`Taskasaurus: Node not found: ${nodeId}`);
      return;
    }

    this.resetCollapseTimer();
    this.uiState.lastInteractionAt = Date.now();

    switch (node.kind) {
      case "parent":
        this.handleParentClick(node.id);
        break;
      case "rootLeaf":
      case "childLeaf":
        this.handleLeafClick(node.taskKey);
        break;
    }
  }

  collapse(): void {
    this.clearCollapseTimer();
    this.uiState.expandedGroupId = undefined;
    this.render();
  }

  dispose(): void {
    this.clearCollapseTimer();
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = undefined;
    }
    // Clear all feedback timers
    for (const feedback of this.feedbackMap.values()) {
      if (feedback.timer) {
        clearTimeout(feedback.timer);
      }
    }
    this.feedbackMap.clear();
    // Dispose event listeners
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables.length = 0;
    this.renderer.dispose();
  }

  private handleParentClick(nodeId: NodeId): void {
    if (this.uiState.expandedGroupId === nodeId) {
      // Toggle off - collapse
      this.uiState.expandedGroupId = undefined;
      this.clearCollapseTimer();
    } else {
      // Expand this group (accordion: only one open at a time)
      this.uiState.expandedGroupId = nodeId;
      this.startCollapseTimer();
    }
    this.render();
  }

  private handleLeafClick(taskKey: TaskKey): void {
    // Collapse all groups immediately
    this.uiState.expandedGroupId = undefined;
    this.clearCollapseTimer();
    this.render();

    // Execute the task
    const task = resolveTask(this.tasks, taskKey);
    if (task) {
      vscode.tasks.executeTask(task).then(
        () => {
          /* Task started successfully */
        },
        (err) => {
          vscode.window.showErrorMessage(`Failed to start task: ${err.message || err}`);
        },
      );
    } else {
      vscode.window.showErrorMessage(`Task not found: ${taskKey.label}`);
    }
  }

  private lookupNode(nodeId: NodeId): Node | undefined {
    for (const root of this.roots) {
      if (root.id === nodeId) {
        return root;
      }
      if (root.kind === "parent") {
        for (const child of root.children) {
          if (child.id === nodeId) {
            return child;
          }
        }
      }
    }
    return undefined;
  }

  private render(): void {
    this.renderer.render(this.roots, this.uiState, this.feedbackMap);
  }

  private startCollapseTimer(): void {
    this.clearCollapseTimer();
    this.uiState.collapseTimer = setTimeout(() => {
      this.collapse();
    }, AUTO_COLLAPSE_TIMEOUT_MS);
  }

  private resetCollapseTimer(): void {
    if (this.uiState.expandedGroupId !== undefined) {
      this.startCollapseTimer();
    }
  }

  private clearCollapseTimer(): void {
    if (this.uiState.collapseTimer) {
      clearTimeout(this.uiState.collapseTimer);
      this.uiState.collapseTimer = undefined;
    }
  }
}
