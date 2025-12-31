import type * as vscode from "vscode";
import type { TaskKey } from "./types";

export function createTaskKey(task: vscode.Task): TaskKey {
  return {
    label: task.name,
    source: task.source,
    folder:
      task.scope !== undefined && typeof task.scope === "object" && "name" in task.scope
        ? (task.scope as vscode.WorkspaceFolder).name
        : undefined,
    definitionType: task.definition?.type,
  };
}

export function taskKeyToId(key: TaskKey): string {
  const parts = [key.label, key.source];
  if (key.folder) {
    parts.push(key.folder);
  }
  if (key.definitionType) {
    parts.push(key.definitionType);
  }
  return parts.join("::");
}

export function taskKeysEqual(a: TaskKey, b: TaskKey): boolean {
  return (
    a.label === b.label &&
    a.source === b.source &&
    a.folder === b.folder &&
    a.definitionType === b.definitionType
  );
}

export function resolveTask(tasks: vscode.Task[], key: TaskKey): vscode.Task | undefined {
  return tasks.find((task) => {
    const taskKey = createTaskKey(task);
    return taskKeysEqual(taskKey, key);
  });
}
