import * as vscode from "vscode";
import {
  parseTasksJson,
  buildTasksMetadata,
  TaskDefinition,
  TasksJsonMetadata,
} from "./iconParser";
import { logTasksJsonFound, logTasksJsonNotFound } from "./logger";

export type TasksJsonData = TasksJsonMetadata;

async function readTasksJsonFromFolder(folder: vscode.WorkspaceFolder): Promise<TaskDefinition[]> {
  const tasksJsonUri = vscode.Uri.joinPath(folder.uri, ".vscode", "tasks.json");

  try {
    const content = await vscode.workspace.fs.readFile(tasksJsonUri);
    const text = new TextDecoder("utf-8").decode(content);
    const tasks = parseTasksJson(text);
    logTasksJsonFound(folder.name, tasksJsonUri.fsPath, tasks.length);
    return tasks;
  } catch {
    // File doesn't exist or can't be read - that's OK
    logTasksJsonNotFound(folder.name);
  }

  return [];
}

export async function loadTasksJsonData(): Promise<TasksJsonData> {
  const folders = vscode.workspace.workspaceFolders ?? [];
  const tasksByFolder: TaskDefinition[][] = [];

  for (const folder of folders) {
    const tasks = await readTasksJsonFromFolder(folder);
    tasksByFolder.push(tasks);
  }

  return buildTasksMetadata(tasksByFolder);
}
