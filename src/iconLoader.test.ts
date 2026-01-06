import { describe, it, expect } from "vitest";
import { parseTasksJson, buildTasksMetadata, TaskDefinition } from "./iconParser";

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

describe("buildTasksMetadata", () => {
  describe("iconMap", () => {
    it("builds map from single folder", () => {
      const tasks: TaskDefinition[] = [
        { label: "Build", icon: { id: "tools" } },
        { label: "Test", icon: { id: "beaker" } },
      ];

      const { iconMap } = buildTasksMetadata([tasks]);

      expect(iconMap.size).toBe(2);
      expect(iconMap.get("Build")).toBe("tools");
      expect(iconMap.get("Test")).toBe("beaker");
    });

    it("skips tasks without labels", () => {
      const tasks: TaskDefinition[] = [
        { icon: { id: "tools" } },
        { label: "Test", icon: { id: "beaker" } },
      ];

      const { iconMap } = buildTasksMetadata([tasks]);

      expect(iconMap.size).toBe(1);
      expect(iconMap.get("Test")).toBe("beaker");
    });

    it("skips tasks without icon id", () => {
      const tasks: TaskDefinition[] = [
        { label: "Build", icon: { color: "red" } },
        { label: "Test", icon: { id: "beaker" } },
      ];

      const { iconMap } = buildTasksMetadata([tasks]);

      expect(iconMap.size).toBe(1);
      expect(iconMap.get("Test")).toBe("beaker");
    });

    it("first folder wins for duplicate labels", () => {
      const folder1Tasks: TaskDefinition[] = [{ label: "Build", icon: { id: "tools" } }];
      const folder2Tasks: TaskDefinition[] = [{ label: "Build", icon: { id: "gear" } }];

      const { iconMap } = buildTasksMetadata([folder1Tasks, folder2Tasks]);

      expect(iconMap.size).toBe(1);
      expect(iconMap.get("Build")).toBe("tools");
    });

    it("merges tasks from multiple folders", () => {
      const folder1Tasks: TaskDefinition[] = [{ label: "Build", icon: { id: "tools" } }];
      const folder2Tasks: TaskDefinition[] = [{ label: "Test", icon: { id: "beaker" } }];

      const { iconMap } = buildTasksMetadata([folder1Tasks, folder2Tasks]);

      expect(iconMap.size).toBe(2);
      expect(iconMap.get("Build")).toBe("tools");
      expect(iconMap.get("Test")).toBe("beaker");
    });
  });

  describe("hiddenLabels", () => {
    it("builds set of hidden task labels", () => {
      const tasks: TaskDefinition[] = [
        { label: "Build", hide: true },
        { label: "Test", hide: false },
        { label: "Run" },
      ];

      const { hiddenLabels } = buildTasksMetadata([tasks]);

      expect(hiddenLabels.size).toBe(1);
      expect(hiddenLabels.has("Build")).toBe(true);
      expect(hiddenLabels.has("Test")).toBe(false);
      expect(hiddenLabels.has("Run")).toBe(false);
    });

    it("skips tasks without labels", () => {
      const tasks: TaskDefinition[] = [{ hide: true }, { label: "Test", hide: true }];

      const { hiddenLabels } = buildTasksMetadata([tasks]);

      expect(hiddenLabels.size).toBe(1);
      expect(hiddenLabels.has("Test")).toBe(true);
    });

    it("collects hidden tasks from multiple folders", () => {
      const folder1Tasks: TaskDefinition[] = [{ label: "Build", hide: true }];
      const folder2Tasks: TaskDefinition[] = [{ label: "Watch", hide: true }];

      const { hiddenLabels } = buildTasksMetadata([folder1Tasks, folder2Tasks]);

      expect(hiddenLabels.size).toBe(2);
      expect(hiddenLabels.has("Build")).toBe(true);
      expect(hiddenLabels.has("Watch")).toBe(true);
    });

    it("returns empty set when no hidden tasks", () => {
      const tasks: TaskDefinition[] = [{ label: "Build" }, { label: "Test", hide: false }];

      const { hiddenLabels } = buildTasksMetadata([tasks]);

      expect(hiddenLabels.size).toBe(0);
    });
  });

  describe("definedLabels", () => {
    it("collects all task labels", () => {
      const tasks: TaskDefinition[] = [
        { label: "Build" },
        { label: "Test" },
        { label: "Run" },
      ];

      const { definedLabels } = buildTasksMetadata([tasks]);

      expect(definedLabels.size).toBe(3);
      expect(definedLabels.has("Build")).toBe(true);
      expect(definedLabels.has("Test")).toBe(true);
      expect(definedLabels.has("Run")).toBe(true);
    });

    it("skips tasks without labels", () => {
      const tasks: TaskDefinition[] = [{ label: "Build" }, { icon: { id: "tools" } }];

      const { definedLabels } = buildTasksMetadata([tasks]);

      expect(definedLabels.size).toBe(1);
      expect(definedLabels.has("Build")).toBe(true);
    });

    it("includes hidden tasks in defined labels", () => {
      const tasks: TaskDefinition[] = [
        { label: "Build", hide: true },
        { label: "Test" },
      ];

      const { definedLabels } = buildTasksMetadata([tasks]);

      expect(definedLabels.size).toBe(2);
      expect(definedLabels.has("Build")).toBe(true);
      expect(definedLabels.has("Test")).toBe(true);
    });

    it("collects labels from multiple folders", () => {
      const folder1Tasks: TaskDefinition[] = [{ label: "Build" }];
      const folder2Tasks: TaskDefinition[] = [{ label: "Test" }];

      const { definedLabels } = buildTasksMetadata([folder1Tasks, folder2Tasks]);

      expect(definedLabels.size).toBe(2);
      expect(definedLabels.has("Build")).toBe(true);
      expect(definedLabels.has("Test")).toBe(true);
    });

    it("deduplicates labels across folders", () => {
      const folder1Tasks: TaskDefinition[] = [{ label: "Build" }];
      const folder2Tasks: TaskDefinition[] = [{ label: "Build" }, { label: "Test" }];

      const { definedLabels } = buildTasksMetadata([folder1Tasks, folder2Tasks]);

      expect(definedLabels.size).toBe(2);
    });
  });

  describe("empty input", () => {
    it("returns empty collections for empty input", () => {
      const { iconMap, hiddenLabels, definedLabels } = buildTasksMetadata([]);

      expect(iconMap.size).toBe(0);
      expect(hiddenLabels.size).toBe(0);
      expect(definedLabels.size).toBe(0);
    });
  });

  describe("combined behavior", () => {
    it("extracts all metadata in single pass", () => {
      const tasks: TaskDefinition[] = [
        { label: "Build", icon: { id: "tools" } },
        { label: "Test", icon: { id: "beaker" }, hide: true },
        { label: "Run" },
      ];

      const { iconMap, hiddenLabels, definedLabels } = buildTasksMetadata([tasks]);

      // All labels should be in definedLabels
      expect(definedLabels.size).toBe(3);

      // Only Test is hidden
      expect(hiddenLabels.size).toBe(1);
      expect(hiddenLabels.has("Test")).toBe(true);

      // Both Build and Test have icons
      expect(iconMap.size).toBe(2);
      expect(iconMap.get("Build")).toBe("tools");
      expect(iconMap.get("Test")).toBe("beaker");
    });
  });
});
