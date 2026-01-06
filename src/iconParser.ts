import * as jsonc from "jsonc-parser";
import type { IconMap } from "./types";

export type TaskDefinition = {
  label?: string;
  icon?: {
    id?: string;
    color?: string;
  };
  hide?: boolean;
};

export type TasksJson = {
  version?: string;
  tasks?: TaskDefinition[];
};

/**
 * Metadata extracted from tasks.json files in a single pass.
 */
export type TasksJsonMetadata = {
  /** Map of task label to icon ID */
  iconMap: IconMap;
  /** Set of task labels marked with hide: true */
  hiddenLabels: Set<string>;
  /** Set of all task labels defined in tasks.json */
  definedLabels: Set<string>;
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

/**
 * Build all task metadata from tasks.json definitions in a single pass.
 * Extracts icon mappings, hidden labels, and all defined labels.
 */
export function buildTasksMetadata(tasksByFolder: TaskDefinition[][]): TasksJsonMetadata {
  const iconMap: IconMap = new Map();
  const hiddenLabels = new Set<string>();
  const definedLabels = new Set<string>();

  for (const tasks of tasksByFolder) {
    for (const task of tasks) {
      if (!task.label) continue;

      definedLabels.add(task.label);

      if (task.hide === true) {
        hiddenLabels.add(task.label);
      }

      // Only set icon if not already set (first folder wins for duplicates)
      if (task.icon?.id && !iconMap.has(task.label)) {
        iconMap.set(task.label, task.icon.id);
      }
    }
  }

  return { iconMap, hiddenLabels, definedLabels };
}
