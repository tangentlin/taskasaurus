import * as vscode from 'vscode';
import type { RootNode, NodeId, UIState, TaskKey, Node } from './types';
import { buildHierarchy, disambiguateLabels } from './hierarchy';
import { resolveTask } from './taskKey';
import { StatusBarRenderer } from './statusBar';
import { loadIconMap } from './iconLoader';

const AUTO_COLLAPSE_TIMEOUT_MS = 10_000;
const REFRESH_DEBOUNCE_MS = 250;

export class TaskasaurusController {
  private uiState: UIState = {};
  private roots: RootNode[] = [];
  private tasks: vscode.Task[] = [];
  private readonly renderer: StatusBarRenderer;
  private refreshTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.renderer = new StatusBarRenderer();
  }

  async refresh(): Promise<void> {
    const [tasks, iconMap] = await Promise.all([
      vscode.tasks.fetchTasks(),
      loadIconMap(),
    ]);
    this.tasks = tasks;
    this.roots = buildHierarchy(this.tasks, iconMap);
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
      case 'parent':
        this.handleParentClick(node.id);
        break;
      case 'rootLeaf':
      case 'childLeaf':
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
        () => { /* Task started successfully */ },
        (err) => {
          vscode.window.showErrorMessage(`Failed to start task: ${err.message || err}`);
        }
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
      if (root.kind === 'parent') {
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
    this.renderer.render(this.roots, this.uiState);
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
