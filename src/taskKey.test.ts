import { describe, it, expect } from "vitest";
import { createTaskKey, taskKeyToId, taskKeysEqual, resolveTask } from "./taskKey";
import type * as vscode from "vscode";

function mockTask(
  name: string,
  source = "Workspace",
  folderName?: string,
  type = "shell",
): vscode.Task {
  const scope = folderName
    ? ({ name: folderName, uri: { fsPath: `/mock/${folderName}` } } as vscode.WorkspaceFolder)
    : undefined;

  return {
    name,
    source,
    scope,
    definition: { type },
    isBackground: false,
    presentationOptions: {},
    problemMatchers: [],
    runOptions: {},
  } as unknown as vscode.Task;
}

describe("createTaskKey", () => {
  it("creates a key from a basic task", () => {
    const task = mockTask("Build", "Workspace", "myProject", "shell");
    const key = createTaskKey(task);

    expect(key.label).toBe("Build");
    expect(key.source).toBe("Workspace");
    expect(key.folder).toBe("myProject");
    expect(key.definitionType).toBe("shell");
  });

  it("handles task without folder", () => {
    const task = mockTask("Build", "npm");
    const key = createTaskKey(task);

    expect(key.folder).toBeUndefined();
  });
});

describe("taskKeyToId", () => {
  it("generates a unique id from key components", () => {
    const key = { label: "Build", source: "Workspace", folder: "api", definitionType: "shell" };
    const id = taskKeyToId(key);

    expect(id).toBe("Build::Workspace::api::shell");
  });

  it("omits optional fields when not present", () => {
    const key = { label: "Build", source: "npm" };
    const id = taskKeyToId(key);

    expect(id).toBe("Build::npm");
  });
});

describe("taskKeysEqual", () => {
  it("returns true for equal keys", () => {
    const a = { label: "Build", source: "Workspace", folder: "api", definitionType: "shell" };
    const b = { label: "Build", source: "Workspace", folder: "api", definitionType: "shell" };

    expect(taskKeysEqual(a, b)).toBe(true);
  });

  it("returns false when labels differ", () => {
    const a = { label: "Build", source: "Workspace" };
    const b = { label: "Test", source: "Workspace" };

    expect(taskKeysEqual(a, b)).toBe(false);
  });

  it("returns false when folders differ", () => {
    const a = { label: "Build", source: "Workspace", folder: "api" };
    const b = { label: "Build", source: "Workspace", folder: "web" };

    expect(taskKeysEqual(a, b)).toBe(false);
  });
});

describe("resolveTask", () => {
  it("finds a matching task", () => {
    const tasks = [mockTask("Build", "Workspace", "api"), mockTask("Test", "Workspace", "api")];
    const key = { label: "Test", source: "Workspace", folder: "api", definitionType: "shell" };

    const result = resolveTask(tasks, key);

    expect(result).toBeDefined();
    expect(result?.name).toBe("Test");
  });

  it("returns undefined when no match", () => {
    const tasks = [mockTask("Build", "Workspace", "api")];
    const key = { label: "NotFound", source: "Workspace" };

    const result = resolveTask(tasks, key);

    expect(result).toBeUndefined();
  });
});
