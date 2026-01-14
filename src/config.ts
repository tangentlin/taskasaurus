import * as vscode from "vscode";

export const DEFAULT_DELIMITER = "/";

export interface TaskasaurusConfig {
  groupDelimiter: string;
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

  return {
    groupDelimiter: validateDelimiter(rawDelimiter),
  };
}

/**
 * Checks if the configuration change affects Taskasaurus settings.
 */
export function affectsTaskasaurusConfig(event: vscode.ConfigurationChangeEvent): boolean {
  return event.affectsConfiguration("taskasaurus");
}
