import * as jsonc from "jsonc-parser";
import type { IconMap } from "./types";
import type { GroupOverride } from "./config";

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
  taskasaurus?: {
    groups?: Record<string, { shortLabel?: boolean }>;
  };
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
  /** Per-group overrides from tasks.json taskasaurus config */
  groupOverrides: Map<string, GroupOverride>;
};

export type TasksJsonGroupOverrides = Map<string, GroupOverride>;

type ParsedTasksJson = {
  tasks: TaskDefinition[];
  groupOverrides: TasksJsonGroupOverrides;
};

export function parseTasksJson(text: string): TaskDefinition[] {
  return parseTasksJsonFull(text).tasks;
}

export function parseTasksJsonFull(text: string): ParsedTasksJson {
  try {
    const parsed = jsonc.parse(text) as TasksJson;
    const tasks = parsed && Array.isArray(parsed.tasks) ? parsed.tasks : [];
    const groupOverrides = new Map<string, GroupOverride>();
    if (parsed?.taskasaurus?.groups && typeof parsed.taskasaurus.groups === "object") {
      for (const [key, value] of Object.entries(parsed.taskasaurus.groups)) {
        if (value && typeof value === "object") {
          const shortLabel = typeof value.shortLabel === "boolean" ? value.shortLabel : undefined;
          groupOverrides.set(key, { shortLabel });
        }
      }
    }
    return { tasks, groupOverrides };
  } catch {
    return { tasks: [], groupOverrides: new Map() };
  }
}

/**
 * Build all task metadata from tasks.json definitions in a single pass.
 * Extracts icon mappings, hidden labels, and all defined labels.
 */
export function buildTasksMetadata(
  tasksByFolder: TaskDefinition[][],
  groupOverridesByFolder: TasksJsonGroupOverrides[] = [],
): TasksJsonMetadata {
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

  // Merge group overrides across folders (first folder wins)
  const groupOverrides = new Map<string, GroupOverride>();
  for (const folderOverrides of groupOverridesByFolder) {
    for (const [key, value] of folderOverrides) {
      if (!groupOverrides.has(key)) {
        groupOverrides.set(key, value);
      }
    }
  }

  return { iconMap, hiddenLabels, definedLabels, groupOverrides };
}
