import * as vscode from "vscode";

let outputChannel: vscode.OutputChannel | undefined;

/**
 * Get or create the Taskasaurus output channel for logging.
 * Logs are visible in VS Code's Output panel under "Taskasaurus".
 */
function getChannel(): vscode.OutputChannel {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel("Taskasaurus");
  }
  return outputChannel;
}

/**
 * Log an informational message to the Taskasaurus output channel.
 */
export function logInfo(message: string): void {
  const timestamp = new Date().toISOString();
  getChannel().appendLine(`[${timestamp}] INFO: ${message}`);
}

/**
 * Log a debug message to the Taskasaurus output channel.
 */
export function logDebug(message: string): void {
  const timestamp = new Date().toISOString();
  getChannel().appendLine(`[${timestamp}] DEBUG: ${message}`);
}

/**
 * Log a warning message to the Taskasaurus output channel.
 */
export function logWarn(message: string): void {
  const timestamp = new Date().toISOString();
  getChannel().appendLine(`[${timestamp}] WARN: ${message}`);
}

/**
 * Log task source information for traceability.
 * @param taskLabel The task label
 * @param source Where the task came from (e.g., "tasks.json", "npm", "typescript")
 * @param folder The workspace folder name (if applicable)
 * @param included Whether the task was included or filtered out
 */
export function logTaskSource(
  taskLabel: string,
  source: string,
  folder: string | undefined,
  included: boolean,
): void {
  const folderInfo = folder ? ` [folder: ${folder}]` : "";
  const status = included ? "INCLUDED" : "FILTERED";
  logDebug(`Task "${taskLabel}" from source "${source}"${folderInfo} -> ${status}`);
}

/**
 * Log tasks.json file discovery.
 * @param folderName The workspace folder name
 * @param filePath The path to tasks.json
 * @param taskCount Number of tasks found
 */
export function logTasksJsonFound(folderName: string, filePath: string, taskCount: number): void {
  logInfo(`Found tasks.json in "${folderName}": ${filePath} (${taskCount} tasks)`);
}

/**
 * Log when tasks.json is not found in a folder.
 * @param folderName The workspace folder name
 */
export function logTasksJsonNotFound(folderName: string): void {
  logDebug(`No tasks.json found in "${folderName}"`);
}

/**
 * Log a summary of task filtering results.
 * @param totalFetched Total tasks from fetchTasks()
 * @param totalIncluded Tasks included after filtering
 * @param totalFiltered Tasks filtered out
 */
export function logFilteringSummary(
  totalFetched: number,
  totalIncluded: number,
  totalFiltered: number,
): void {
  logInfo(
    `Task filtering complete: ${totalFetched} fetched, ${totalIncluded} included, ${totalFiltered} filtered out`,
  );
}

/**
 * Dispose the output channel.
 */
export function disposeLogger(): void {
  if (outputChannel) {
    outputChannel.dispose();
    outputChannel = undefined;
  }
}
