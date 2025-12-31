import * as jsonc from 'jsonc-parser';
import type { IconMap } from './types';

export type TaskDefinition = {
  label?: string;
  icon?: {
    id?: string;
    color?: string;
  };
};

export type TasksJson = {
  version?: string;
  tasks?: TaskDefinition[];
};

export function parseTasksJson(text: string): TaskDefinition[] {
  try {
    const parsed = jsonc.parse(text) as TasksJson;
    if (parsed && Array.isArray(parsed.tasks)) {
      return parsed.tasks;
    }
  } catch {
    // Invalid JSON - return empty array
  }
  return [];
}

export function buildIconMapFromTasks(tasksByFolder: TaskDefinition[][]): IconMap {
  const iconMap: IconMap = new Map();

  for (const tasks of tasksByFolder) {
    for (const task of tasks) {
      if (task.label && task.icon?.id) {
        // Only set if not already set (first folder wins for duplicates)
        if (!iconMap.has(task.label)) {
          iconMap.set(task.label, task.icon.id);
        }
      }
    }
  }

  return iconMap;
}
