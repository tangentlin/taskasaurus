import * as vscode from "vscode";
import type { RootNode, NodeId, UIState } from "./types";
import { buildVisibleItems, COMMAND_ID } from "./statusBarModel";

export class StatusBarRenderer {
  private items: vscode.StatusBarItem[] = [];
  private nodeIdToItem = new Map<NodeId, vscode.StatusBarItem>();

  render(roots: RootNode[], uiState: UIState): void {
    const visibleItems = buildVisibleItems(roots, uiState);

    // Reconcile: reuse existing items where possible
    const newNodeIdToItem = new Map<NodeId, vscode.StatusBarItem>();
    const usedItems = new Set<vscode.StatusBarItem>();

    for (const vi of visibleItems) {
      let item = this.nodeIdToItem.get(vi.nodeId);
      // Priority is read-only after creation, so recreate if it changed
      if (item && item.priority !== vi.priority) {
        item.dispose();
        item = undefined;
      }
      if (!item) {
        // Create new item
        item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, vi.priority);
      }

      item.text = vi.label;
      item.tooltip = vi.tooltip;
      item.command = { command: COMMAND_ID, title: "", arguments: [vi.commandArgs] };
      item.show();

      newNodeIdToItem.set(vi.nodeId, item);
      usedItems.add(item);
    }

    // Dispose unused items
    for (const item of this.items) {
      if (!usedItems.has(item)) {
        item.dispose();
      }
    }

    this.items = Array.from(usedItems);
    this.nodeIdToItem = newNodeIdToItem;
  }

  dispose(): void {
    for (const item of this.items) {
      item.dispose();
    }
    this.items = [];
    this.nodeIdToItem.clear();
  }
}
