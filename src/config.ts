import * as vscode from "vscode";

export const DEFAULT_DELIMITER = "/";

export type GroupOverride = {
  shortLabel?: boolean;
};

export interface TaskasaurusConfig {
  groupDelimiter: string;
  shortChildLabels: boolean;
  animateExpand: boolean;
  groupOverrides: Map<string, GroupOverride>;
}

/**
 * Validates that the delimiter is a single character.
 * Returns the validated delimiter or the default if invalid.
 */
function validateDelimiter(value: unknown): string {
  if (typeof value !== "string" || value.length !== 1) {
    return DEFAULT_DELIMITER;
  }
  return value;
}

/**
 * Reads the current Taskasaurus configuration from VS Code settings.
 */
export function getConfig(): TaskasaurusConfig {
  const config = vscode.workspace.getConfiguration("taskasaurus");
  const rawDelimiter = config.get<string>("groupDelimiter", DEFAULT_DELIMITER);
  const shortChildLabels = config.get<boolean>("shortChildLabels", true);
  const animateExpand = config.get<boolean>("animateExpand", true);
  const rawGroups = config.get<Record<string, GroupOverride>>("groups", {});

  const groupOverrides = new Map<string, GroupOverride>();
  if (rawGroups && typeof rawGroups === "object") {
    for (const [key, value] of Object.entries(rawGroups)) {
      if (value && typeof value === "object") {
        const shortLabel = typeof value.shortLabel === "boolean" ? value.shortLabel : undefined;
        groupOverrides.set(key, { shortLabel });
      }
    }
  }

  return {
    groupDelimiter: validateDelimiter(rawDelimiter),
    shortChildLabels: typeof shortChildLabels === "boolean" ? shortChildLabels : true,
    animateExpand: typeof animateExpand === "boolean" ? animateExpand : true,
    groupOverrides,
  };
}

/**
 * Checks if the configuration change affects Taskasaurus settings.
 */
export function affectsTaskasaurusConfig(event: vscode.ConfigurationChangeEvent): boolean {
  return event.affectsConfiguration("taskasaurus");
}
