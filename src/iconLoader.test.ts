import { describe, it, expect } from "vitest";
import {
  parseTasksJson,
  buildIconMapFromTasks,
  buildHiddenSetFromTasks,
  TaskDefinition,
} from "./iconParser";

describe("parseTasksJson", () => {
  it("parses valid tasks.json", () => {
    const json = `{
      "version": "2.0.0",
      "tasks": [
        { "label": "Build", "icon": { "id": "tools" } },
        { "label": "Test", "icon": { "id": "beaker" } }
      ]
    }`;

    const tasks = parseTasksJson(json);
    expect(tasks).toHaveLength(2);
    expect(tasks[0].label).toBe("Build");
    expect(tasks[0].icon?.id).toBe("tools");
  });

  it("parses JSONC with comments", () => {
    const json = `{
      // This is a comment
      "version": "2.0.0",
      "tasks": [
        { "label": "Build", "icon": { "id": "tools" } }
      ]
    }`;

    const tasks = parseTasksJson(json);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].label).toBe("Build");
  });

  it("parses JSONC with trailing commas", () => {
    const json = `{
      "version": "2.0.0",
      "tasks": [
        { "label": "Build", "icon": { "id": "tools" }, },
      ],
    }`;

    const tasks = parseTasksJson(json);
    expect(tasks).toHaveLength(1);
  });

  it("returns empty array for invalid JSON", () => {
    const tasks = parseTasksJson("not valid json");
    expect(tasks).toEqual([]);
  });

  it("returns empty array if no tasks array", () => {
    const json = `{ "version": "2.0.0" }`;
    const tasks = parseTasksJson(json);
    expect(tasks).toEqual([]);
  });

  it("handles tasks without icons", () => {
    const json = `{
      "tasks": [
        { "label": "Build" },
        { "label": "Test", "icon": { "id": "beaker" } }
      ]
    }`;

    const tasks = parseTasksJson(json);
    expect(tasks).toHaveLength(2);
    expect(tasks[0].icon).toBeUndefined();
    expect(tasks[1].icon?.id).toBe("beaker");
  });
});

describe("buildIconMapFromTasks", () => {
  it("builds map from single folder", () => {
    const tasks: TaskDefinition[] = [
      { label: "Build", icon: { id: "tools" } },
      { label: "Test", icon: { id: "beaker" } },
    ];

    const iconMap = buildIconMapFromTasks([tasks]);

    expect(iconMap.size).toBe(2);
    expect(iconMap.get("Build")).toBe("tools");
    expect(iconMap.get("Test")).toBe("beaker");
  });

  it("skips tasks without labels", () => {
    const tasks: TaskDefinition[] = [
      { icon: { id: "tools" } },
      { label: "Test", icon: { id: "beaker" } },
    ];

    const iconMap = buildIconMapFromTasks([tasks]);

    expect(iconMap.size).toBe(1);
    expect(iconMap.get("Test")).toBe("beaker");
  });

  it("skips tasks without icon id", () => {
    const tasks: TaskDefinition[] = [
      { label: "Build", icon: { color: "red" } },
      { label: "Test", icon: { id: "beaker" } },
    ];

    const iconMap = buildIconMapFromTasks([tasks]);

    expect(iconMap.size).toBe(1);
    expect(iconMap.get("Test")).toBe("beaker");
  });

  it("first folder wins for duplicate labels", () => {
    const folder1Tasks: TaskDefinition[] = [{ label: "Build", icon: { id: "tools" } }];
    const folder2Tasks: TaskDefinition[] = [{ label: "Build", icon: { id: "gear" } }];

    const iconMap = buildIconMapFromTasks([folder1Tasks, folder2Tasks]);

    expect(iconMap.size).toBe(1);
    expect(iconMap.get("Build")).toBe("tools");
  });

  it("merges tasks from multiple folders", () => {
    const folder1Tasks: TaskDefinition[] = [{ label: "Build", icon: { id: "tools" } }];
    const folder2Tasks: TaskDefinition[] = [{ label: "Test", icon: { id: "beaker" } }];

    const iconMap = buildIconMapFromTasks([folder1Tasks, folder2Tasks]);

    expect(iconMap.size).toBe(2);
    expect(iconMap.get("Build")).toBe("tools");
    expect(iconMap.get("Test")).toBe("beaker");
  });

  it("returns empty map for empty input", () => {
    const iconMap = buildIconMapFromTasks([]);
    expect(iconMap.size).toBe(0);
  });
});

describe("parseTasksJson with hide property", () => {
  it("parses hide property", () => {
    const json = `{
      "tasks": [
        { "label": "Build", "hide": true },
        { "label": "Test", "hide": false },
        { "label": "Run" }
      ]
    }`;

    const tasks = parseTasksJson(json);
    expect(tasks).toHaveLength(3);
    expect(tasks[0].hide).toBe(true);
    expect(tasks[1].hide).toBe(false);
    expect(tasks[2].hide).toBeUndefined();
  });
});

describe("buildHiddenSetFromTasks", () => {
  it("builds set of hidden task labels", () => {
    const tasks: TaskDefinition[] = [
      { label: "Build", hide: true },
      { label: "Test", hide: false },
      { label: "Run" },
    ];

    const hiddenSet = buildHiddenSetFromTasks([tasks]);

    expect(hiddenSet.size).toBe(1);
    expect(hiddenSet.has("Build")).toBe(true);
    expect(hiddenSet.has("Test")).toBe(false);
    expect(hiddenSet.has("Run")).toBe(false);
  });

  it("skips tasks without labels", () => {
    const tasks: TaskDefinition[] = [{ hide: true }, { label: "Test", hide: true }];

    const hiddenSet = buildHiddenSetFromTasks([tasks]);

    expect(hiddenSet.size).toBe(1);
    expect(hiddenSet.has("Test")).toBe(true);
  });

  it("collects hidden tasks from multiple folders", () => {
    const folder1Tasks: TaskDefinition[] = [{ label: "Build", hide: true }];
    const folder2Tasks: TaskDefinition[] = [{ label: "Watch", hide: true }];

    const hiddenSet = buildHiddenSetFromTasks([folder1Tasks, folder2Tasks]);

    expect(hiddenSet.size).toBe(2);
    expect(hiddenSet.has("Build")).toBe(true);
    expect(hiddenSet.has("Watch")).toBe(true);
  });

  it("returns empty set when no hidden tasks", () => {
    const tasks: TaskDefinition[] = [{ label: "Build" }, { label: "Test", hide: false }];

    const hiddenSet = buildHiddenSetFromTasks([tasks]);

    expect(hiddenSet.size).toBe(0);
  });

  it("returns empty set for empty input", () => {
    const hiddenSet = buildHiddenSetFromTasks([]);
    expect(hiddenSet.size).toBe(0);
  });
});
