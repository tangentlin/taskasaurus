import * as vscode from "vscode";
import { TaskasaurusController } from "./controller";

let controller: TaskasaurusController | undefined;

export function activate(context: vscode.ExtensionContext): void {
  console.log("Taskasaurus activated");

  controller = new TaskasaurusController();

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand("taskasaurus.clickNode", (args: { nodeId: string }) => {
      controller?.onClickNode(args.nodeId);
    }),
    vscode.commands.registerCommand("taskasaurus.refresh", () => {
      controller?.refresh();
    }),
    vscode.commands.registerCommand("taskasaurus.collapse", () => {
      controller?.collapse();
    }),
  );

  // Register refresh triggers
  context.subscriptions.push(
    // Refresh when workspace folders change
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      controller?.scheduleRefresh();
    }),

    // Refresh when tasks.json is saved
    vscode.workspace.onDidSaveTextDocument((document) => {
      if (
        document.uri.fsPath.endsWith(".vscode/tasks.json") ||
        document.uri.fsPath.endsWith(".vscode\\tasks.json")
      ) {
        controller?.scheduleRefresh();
      }
    }),
  );

  // Register disposal
  context.subscriptions.push({
    dispose: () => {
      controller?.dispose();
      controller = undefined;
    },
  });

  // Initial refresh
  controller.refresh();
}

export function deactivate(): void {
  // Cleanup handled by context.subscriptions
}
