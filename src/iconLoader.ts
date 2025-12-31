import * as vscode from 'vscode';
import type { IconMap } from './types';
import { parseTasksJson, buildIconMapFromTasks, TaskDefinition } from './iconParser';

async function readTasksJsonFromFolder(folder: vscode.WorkspaceFolder): Promise<TaskDefinition[]> {
  const tasksJsonUri = vscode.Uri.joinPath(folder.uri, '.vscode', 'tasks.json');

  try {
    const content = await vscode.workspace.fs.readFile(tasksJsonUri);
    const text = new TextDecoder('utf-8').decode(content);
    return parseTasksJson(text);
  } catch {
    // File doesn't exist or can't be read - that's OK
  }

  return [];
}

export async function loadIconMap(): Promise<IconMap> {
  const folders = vscode.workspace.workspaceFolders ?? [];
  const tasksByFolder: TaskDefinition[][] = [];

  for (const folder of folders) {
    const tasks = await readTasksJsonFromFolder(folder);
    tasksByFolder.push(tasks);
  }

  return buildIconMapFromTasks(tasksByFolder);
}
