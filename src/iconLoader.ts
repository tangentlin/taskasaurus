import * as vscode from "vscode";
import {
  parseTasksJson,
  parseTasksJsonGroupOverrides,
  buildTasksMetadata,
  TaskDefinition,
  TasksJsonMetadata,
  TasksJsonGroupOverrides,
} from "./iconParser";
import { logTasksJsonFound, logTasksJsonNotFound } from "./logger";

export type TasksJsonData = TasksJsonMetadata;

type FolderTasksJsonData = {
  tasks: TaskDefinition[];
  groupOverrides: TasksJsonGroupOverrides;
};

async function readTasksJsonFromFolder(folder: vscode.WorkspaceFolder): Promise<FolderTasksJsonData> {
  const tasksJsonUri = vscode.Uri.joinPath(folder.uri, ".vscode", "tasks.json");

  try {
    const content = await vscode.workspace.fs.readFile(tasksJsonUri);
    const text = new TextDecoder("utf-8").decode(content);
    const tasks = parseTasksJson(text);
    const groupOverrides = parseTasksJsonGroupOverrides(text);
    logTasksJsonFound(folder.name, tasksJsonUri.fsPath, tasks.length);
    return { tasks, groupOverrides };
  } catch {
    // File doesn't exist or can't be read - that's OK
    logTasksJsonNotFound(folder.name);
  }

  return { tasks: [], groupOverrides: new Map() };
}

export async function loadTasksJsonData(): Promise<TasksJsonData> {
  const folders = vscode.workspace.workspaceFolders ?? [];
  const tasksByFolder: TaskDefinition[][] = [];
  const groupOverridesByFolder: TasksJsonGroupOverrides[] = [];

  for (const folder of folders) {
    const data = await readTasksJsonFromFolder(folder);
    tasksByFolder.push(data.tasks);
    groupOverridesByFolder.push(data.groupOverrides);
  }

  return buildTasksMetadata(tasksByFolder, groupOverridesByFolder);
}
