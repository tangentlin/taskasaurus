import { describe, it, expect } from "vitest";
import {
  buildVisibleItems,
  computePriority,
  computeDisplayLabel,
  composeParentLabel,
  composeRootLeafLabel,
  composeChildLeafLabel,
  COMMAND_ID,
  FeedbackMap,
  ShortLabelConfig,
} from "./statusBarModel";
import type { RootNode, UIState } from "./types";

describe("computePriority", () => {
  it("computes root priority", () => {
    expect(computePriority(0)).toBe(10000);
    expect(computePriority(1)).toBe(9900);
    expect(computePriority(2)).toBe(9800);
  });

  it("computes child priority under parent", () => {
    // First root, first child
    expect(computePriority(0, 0)).toBe(10000 - 50 - 0);
    // First root, second child
    expect(computePriority(0, 1)).toBe(10000 - 50 - 1);
    // Second root, first child
    expect(computePriority(1, 0)).toBe(9900 - 50 - 0);
  });

  it("ensures children appear between parents", () => {
    const parent1 = computePriority(0);
    const child1_0 = computePriority(0, 0);
    const child1_1 = computePriority(0, 1);
    const parent2 = computePriority(1);

    expect(parent1).toBeGreaterThan(child1_0);
    expect(child1_0).toBeGreaterThan(child1_1);
    expect(child1_1).toBeGreaterThan(parent2);
  });
});

describe("composeParentLabel", () => {
  it("includes chevron-right when collapsed", () => {
    const label = composeParentLabel({ label: "Test" }, false);
    expect(label).toBe("Test $(chevron-right)");
  });

  it("includes chevron-down when expanded", () => {
    const label = composeParentLabel({ label: "Test" }, true);
    expect(label).toBe("Test $(chevron-down)");
  });

  it("includes task icon when present", () => {
    const label = composeParentLabel({ label: "Build", iconId: "tools" }, false);
    expect(label).toBe("$(tools) Build $(chevron-right)");
  });
});

describe("composeRootLeafLabel", () => {
  it("returns plain label without icon", () => {
    const label = composeRootLeafLabel({ label: "Build" });
    expect(label).toBe("Build");
  });

  it("includes task icon when present", () => {
    const label = composeRootLeafLabel({ label: "Build", iconId: "tools" });
    expect(label).toBe("$(tools) Build");
  });
});

describe("composeChildLeafLabel", () => {
  it("includes arrow indicator", () => {
    const label = composeChildLeafLabel({
      id: "test",
      kind: "childLeaf",
      label: "Test: unit",
      taskKey: { label: "Test: unit", source: "Workspace" },
    });
    expect(label).toBe("$(arrow-small-right) Test: unit");
  });

  it("includes both arrow and task icon", () => {
    const label = composeChildLeafLabel({
      id: "test",
      kind: "childLeaf",
      label: "Test: unit",
      taskKey: { label: "Test: unit", source: "Workspace" },
      iconId: "beaker",
    });
    expect(label).toBe("$(arrow-small-right) $(beaker) Test: unit");
  });
});

describe("buildVisibleItems", () => {
  const createRootLeaf = (label: string, folder?: string): RootNode => ({
    id: `rootLeaf::${label}`,
    kind: "rootLeaf",
    label,
    taskKey: { label, source: "Workspace", folder },
  });

  const createParent = (label: string, children: string[]): RootNode => ({
    id: `parent::${label}`,
    kind: "parent",
    label,
    children: children.map((c) => ({
      id: `childLeaf::${c}`,
      kind: "childLeaf",
      label: c,
      taskKey: { label: c, source: "Workspace" },
    })),
  });

  it("returns empty array for no roots", () => {
    const items = buildVisibleItems([], {});
    expect(items).toEqual([]);
  });

  it("renders root leaves", () => {
    const roots = [createRootLeaf("Build"), createRootLeaf("Run")];
    const items = buildVisibleItems(roots, {});

    expect(items).toHaveLength(2);
    expect(items[0].label).toBe("Build");
    expect(items[1].label).toBe("Run");
  });

  it("renders collapsed parent without children", () => {
    const roots = [createParent("Test", ["Test: unit", "Test: e2e"])];
    const items = buildVisibleItems(roots, {});

    expect(items).toHaveLength(1);
    expect(items[0].label).toBe("Test $(chevron-right)");
  });

  it("renders expanded parent with children", () => {
    const roots = [createParent("Test", ["Test: unit", "Test: e2e"])];
    const uiState: UIState = { expandedGroupId: "parent::Test" };
    const items = buildVisibleItems(roots, uiState);

    expect(items).toHaveLength(3);
    expect(items[0].label).toBe("Test $(chevron-down)");
    expect(items[1].label).toBe("$(arrow-small-right) Test: unit");
    expect(items[2].label).toBe("$(arrow-small-right) Test: e2e");
  });

  it("maintains correct priority ordering", () => {
    const roots = [
      createRootLeaf("Alpha"),
      createParent("Beta", ["Beta: one", "Beta: two"]),
      createRootLeaf("Gamma"),
    ];
    const uiState: UIState = { expandedGroupId: "parent::Beta" };
    const items = buildVisibleItems(roots, uiState);

    // Alpha (10000) > Beta (9900) > Beta:one (9850) > Beta:two (9849) > Gamma (9800)
    expect(items.map((i) => i.priority)).toEqual([10000, 9900, 9850, 9849, 9800]);
  });

  it("includes correct tooltips", () => {
    const roots = [createRootLeaf("Build")];
    const items = buildVisibleItems(roots, {});

    expect(items[0].tooltip).toBe("Run task 'Build'\n(Workspace)");
  });

  it("includes folder in tooltip for multi-root", () => {
    const roots = [createRootLeaf("Build", "api")];
    const items = buildVisibleItems(roots, {});

    expect(items[0].tooltip).toBe("Run task 'Build'\n(Workspace • api)");
  });

  it("uses detail as tooltip when provided", () => {
    const roots: RootNode[] = [
      {
        id: "rootLeaf::Build",
        kind: "rootLeaf",
        label: "Build",
        taskKey: { label: "Build", source: "Workspace", detail: "Build the entire project" },
      },
    ];
    const items = buildVisibleItems(roots, {});

    expect(items[0].tooltip).toBe("Build the entire project");
  });

  it("uses default tooltip when detail is empty string", () => {
    const roots: RootNode[] = [
      {
        id: "rootLeaf::Build",
        kind: "rootLeaf",
        label: "Build",
        taskKey: { label: "Build", source: "Workspace", detail: "" },
      },
    ];
    const items = buildVisibleItems(roots, {});

    expect(items[0].tooltip).toBe("Run task 'Build'\n(Workspace)");
  });

  it("uses default tooltip when detail is undefined", () => {
    const roots: RootNode[] = [
      {
        id: "rootLeaf::Build",
        kind: "rootLeaf",
        label: "Build",
        taskKey: { label: "Build", source: "Workspace", detail: undefined },
      },
    ];
    const items = buildVisibleItems(roots, {});

    expect(items[0].tooltip).toBe("Run task 'Build'\n(Workspace)");
  });

  it("sets correct commandArgs with nodeId", () => {
    const roots = [createRootLeaf("Build")];
    const items = buildVisibleItems(roots, {});

    expect(items[0].commandArgs).toEqual({ nodeId: "rootLeaf::Build" });
  });

  it("exports correct COMMAND_ID", () => {
    expect(COMMAND_ID).toBe("taskasaurus.clickNode");
  });
});

describe("feedback icons in labels", () => {
  it("shows running spinner on root leaf", () => {
    const label = composeRootLeafLabel({ label: "Build" }, { state: "running" });
    expect(label).toBe("$(loading~spin) Build");
  });

  it("shows check on success for root leaf", () => {
    const label = composeRootLeafLabel({ label: "Build" }, { state: "success" });
    expect(label).toBe("$(check) Build");
  });

  it("shows error on failure for root leaf", () => {
    const label = composeRootLeafLabel({ label: "Build" }, { state: "error" });
    expect(label).toBe("$(error) Build");
  });

  it("feedback icon replaces task icon on root leaf", () => {
    const label = composeRootLeafLabel({ label: "Build", iconId: "tools" }, { state: "running" });
    expect(label).toBe("$(loading~spin) Build");
  });

  it("shows running spinner on child leaf", () => {
    const label = composeChildLeafLabel(
      {
        id: "test",
        kind: "childLeaf",
        label: "Test: unit",
        taskKey: { label: "Test: unit", source: "Workspace" },
      },
      { state: "running" },
    );
    expect(label).toBe("$(arrow-small-right) $(loading~spin) Test: unit");
  });

  it("shows running spinner on parent with runnable task", () => {
    const label = composeParentLabel({ label: "Test" }, false, { state: "running" });
    expect(label).toBe("$(loading~spin) Test $(chevron-right)");
  });
});

describe("buildVisibleItems with feedback", () => {
  const createRootLeaf = (label: string): RootNode => ({
    id: `rootLeaf::${label}`,
    kind: "rootLeaf",
    label,
    taskKey: { label, source: "Workspace" },
  });

  it("applies feedback to root leaf", () => {
    const roots = [createRootLeaf("Build")];
    const feedbackMap: FeedbackMap = new Map([["Build::Workspace", { state: "running" }]]);
    const items = buildVisibleItems(roots, {}, feedbackMap);

    expect(items[0].label).toBe("$(loading~spin) Build");
  });

  it("applies feedback to multiple tasks independently", () => {
    const roots = [createRootLeaf("Build"), createRootLeaf("Test")];
    const feedbackMap: FeedbackMap = new Map([
      ["Build::Workspace", { state: "success" }],
      ["Test::Workspace", { state: "error" }],
    ]);
    const items = buildVisibleItems(roots, {}, feedbackMap);

    expect(items[0].label).toBe("$(check) Build");
    expect(items[1].label).toBe("$(error) Test");
  });

  it("shows no feedback icon when task not in feedback map", () => {
    const roots = [createRootLeaf("Build"), createRootLeaf("Test")];
    const feedbackMap: FeedbackMap = new Map([["Build::Workspace", { state: "running" }]]);
    const items = buildVisibleItems(roots, {}, feedbackMap);

    expect(items[0].label).toBe("$(loading~spin) Build");
    expect(items[1].label).toBe("Test");
  });
});

describe("computeDisplayLabel", () => {
  const defaultConfig: ShortLabelConfig = {
    globalDefault: true,
    delimiter: "/",
    groupOverrides: new Map(),
  };

  it("strips group prefix when enabled", () => {
    expect(computeDisplayLabel("Test/unit", "Test", defaultConfig)).toBe("unit");
  });

  it("returns full label when disabled", () => {
    const config: ShortLabelConfig = { ...defaultConfig, globalDefault: false };
    expect(computeDisplayLabel("Test/unit", "Test", config)).toBe("Test/unit");
  });

  it("returns full label when config is undefined", () => {
    expect(computeDisplayLabel("Test/unit", "Test", undefined)).toBe("Test/unit");
  });

  it("does not strip when child label has no prefix match", () => {
    expect(computeDisplayLabel("Test", "Test", defaultConfig)).toBe("Test");
  });

  it("preserves disambiguation suffix after stripping", () => {
    expect(computeDisplayLabel("Test/unit【api】", "Test", defaultConfig)).toBe("unit【api】");
  });

  it("handles multi-slash labels (strips only group prefix)", () => {
    expect(computeDisplayLabel("Build/docker/prod", "Build", defaultConfig)).toBe("docker/prod");
  });

  it("respects per-group override to disable", () => {
    const config: ShortLabelConfig = {
      ...defaultConfig,
      groupOverrides: new Map([["Test", false]]),
    };
    expect(computeDisplayLabel("Test/unit", "Test", config)).toBe("Test/unit");
  });

  it("respects per-group override to enable when global is off", () => {
    const config: ShortLabelConfig = {
      globalDefault: false,
      delimiter: "/",
      groupOverrides: new Map([["Test", true]]),
    };
    expect(computeDisplayLabel("Test/unit", "Test", config)).toBe("unit");
  });

  it("uses custom delimiter", () => {
    const config: ShortLabelConfig = { ...defaultConfig, delimiter: ":" };
    expect(computeDisplayLabel("Test:unit", "Test", config)).toBe("unit");
  });
});

describe("composeChildLeafLabel with displayLabel", () => {
  it("uses displayLabel when provided", () => {
    const label = composeChildLeafLabel(
      {
        id: "test",
        kind: "childLeaf",
        label: "Test/unit",
        taskKey: { label: "Test/unit", source: "Workspace" },
      },
      undefined,
      "unit",
    );
    expect(label).toBe("$(arrow-small-right) unit");
  });

  it("uses displayLabel with icon", () => {
    const label = composeChildLeafLabel(
      {
        id: "test",
        kind: "childLeaf",
        label: "Test/unit",
        taskKey: { label: "Test/unit", source: "Workspace" },
        iconId: "beaker",
      },
      undefined,
      "unit",
    );
    expect(label).toBe("$(arrow-small-right) $(beaker) unit");
  });

  it("uses displayLabel with feedback icon", () => {
    const label = composeChildLeafLabel(
      {
        id: "test",
        kind: "childLeaf",
        label: "Test/unit",
        taskKey: { label: "Test/unit", source: "Workspace" },
      },
      { state: "running" },
      "unit",
    );
    expect(label).toBe("$(arrow-small-right) $(loading~spin) unit");
  });

  it("falls back to node.label when displayLabel not provided", () => {
    const label = composeChildLeafLabel({
      id: "test",
      kind: "childLeaf",
      label: "Test/unit",
      taskKey: { label: "Test/unit", source: "Workspace" },
    });
    expect(label).toBe("$(arrow-small-right) Test/unit");
  });
});

describe("buildVisibleItems with shortLabelConfig", () => {
  const createParent = (label: string, children: string[]): RootNode => ({
    id: `parent::${label}`,
    kind: "parent",
    label,
    children: children.map((c) => ({
      id: `childLeaf::${c}`,
      kind: "childLeaf",
      label: c,
      taskKey: { label: c, source: "Workspace" },
    })),
  });

  const defaultConfig: ShortLabelConfig = {
    globalDefault: true,
    delimiter: "/",
    groupOverrides: new Map(),
  };

  it("strips prefixes from child labels when enabled", () => {
    const roots = [createParent("Test", ["Test/unit", "Test/e2e"])];
    const uiState: UIState = { expandedGroupId: "parent::Test" };
    const items = buildVisibleItems(roots, uiState, new Map(), defaultConfig);

    expect(items[1].label).toBe("$(arrow-small-right) unit");
    expect(items[2].label).toBe("$(arrow-small-right) e2e");
  });

  it("shows full labels when disabled", () => {
    const config: ShortLabelConfig = { ...defaultConfig, globalDefault: false };
    const roots = [createParent("Test", ["Test/unit", "Test/e2e"])];
    const uiState: UIState = { expandedGroupId: "parent::Test" };
    const items = buildVisibleItems(roots, uiState, new Map(), config);

    expect(items[1].label).toBe("$(arrow-small-right) Test/unit");
    expect(items[2].label).toBe("$(arrow-small-right) Test/e2e");
  });

  it("tooltips always use full labels regardless of shortLabelConfig", () => {
    const roots = [createParent("Test", ["Test/unit", "Test/e2e"])];
    const uiState: UIState = { expandedGroupId: "parent::Test" };
    const items = buildVisibleItems(roots, uiState, new Map(), defaultConfig);

    expect(items[1].tooltip).toBe("Run task 'Test/unit'\n(Workspace)");
    expect(items[2].tooltip).toBe("Run task 'Test/e2e'\n(Workspace)");
  });

  it("per-group override disables stripping for one group", () => {
    const config: ShortLabelConfig = {
      ...defaultConfig,
      groupOverrides: new Map([["Check", false]]),
    };
    const roots = [
      createParent("Test", ["Test/unit", "Test/e2e"]),
      createParent("Check", ["Check/lint", "Check/style"]),
    ];
    const uiState: UIState = { expandedGroupId: "parent::Test" };
    const items = buildVisibleItems(roots, uiState, new Map(), config);

    // Test group: short labels (global default on, no override)
    expect(items[1].label).toBe("$(arrow-small-right) unit");
    expect(items[2].label).toBe("$(arrow-small-right) e2e");

    // Expand Check group instead
    const uiState2: UIState = { expandedGroupId: "parent::Check" };
    const items2 = buildVisibleItems(roots, uiState2, new Map(), config);

    // Check group: full labels (override to false)
    expect(items2[2].label).toBe("$(arrow-small-right) Check/lint");
    expect(items2[3].label).toBe("$(arrow-small-right) Check/style");
  });

  it("preserves disambiguation suffix with short labels", () => {
    const roots: RootNode[] = [
      {
        id: "parent::Test",
        kind: "parent",
        label: "Test",
        children: [
          {
            id: "childLeaf::Test/unit【api】",
            kind: "childLeaf",
            label: "Test/unit【api】",
            taskKey: { label: "Test/unit【api】", source: "Workspace", folder: "api" },
          },
        ],
      },
    ];
    const uiState: UIState = { expandedGroupId: "parent::Test" };
    const items = buildVisibleItems(roots, uiState, new Map(), defaultConfig);

    expect(items[1].label).toBe("$(arrow-small-right) unit【api】");
  });

  it("shows full label when no config provided (backwards compat)", () => {
    const roots = [createParent("Test", ["Test/unit", "Test/e2e"])];
    const uiState: UIState = { expandedGroupId: "parent::Test" };
    const items = buildVisibleItems(roots, uiState);

    expect(items[1].label).toBe("$(arrow-small-right) Test/unit");
    expect(items[2].label).toBe("$(arrow-small-right) Test/e2e");
  });

  it("short labels work with feedback icons", () => {
    const roots = [createParent("Test", ["Test/unit"])];
    const uiState: UIState = { expandedGroupId: "parent::Test" };
    const feedbackMap: FeedbackMap = new Map([["Test/unit::Workspace", { state: "running" }]]);
    const items = buildVisibleItems(roots, uiState, feedbackMap, defaultConfig);

    expect(items[1].label).toBe("$(arrow-small-right) $(loading~spin) unit");
  });
});

describe("buildVisibleItems with revealedChildCount", () => {
  const createParent = (label: string, children: string[]): RootNode => ({
    id: `parent::${label}`,
    kind: "parent",
    label,
    children: children.map((c) => ({
      id: `childLeaf::${c}`,
      kind: "childLeaf",
      label: c,
      taskKey: { label: c, source: "Workspace" },
    })),
  });

  it("limits children to revealedChildCount", () => {
    const roots = [createParent("Test", ["Test/a", "Test/b", "Test/c"])];
    const uiState: UIState = { expandedGroupId: "parent::Test", revealedChildCount: 1 };
    const items = buildVisibleItems(roots, uiState);

    expect(items).toHaveLength(2); // parent + 1 child
    expect(items[1].label).toBe("$(arrow-small-right) Test/a");
  });

  it("shows two children when revealedChildCount is 2", () => {
    const roots = [createParent("Test", ["Test/a", "Test/b", "Test/c"])];
    const uiState: UIState = { expandedGroupId: "parent::Test", revealedChildCount: 2 };
    const items = buildVisibleItems(roots, uiState);

    expect(items).toHaveLength(3); // parent + 2 children
    expect(items[1].label).toBe("$(arrow-small-right) Test/a");
    expect(items[2].label).toBe("$(arrow-small-right) Test/b");
  });

  it("shows all children when revealedChildCount is undefined", () => {
    const roots = [createParent("Test", ["Test/a", "Test/b", "Test/c"])];
    const uiState: UIState = { expandedGroupId: "parent::Test" };
    const items = buildVisibleItems(roots, uiState);

    expect(items).toHaveLength(4); // parent + 3 children
  });

  it("clamps to actual child count when revealedChildCount exceeds it", () => {
    const roots = [createParent("Test", ["Test/a", "Test/b"])];
    const uiState: UIState = { expandedGroupId: "parent::Test", revealedChildCount: 10 };
    const items = buildVisibleItems(roots, uiState);

    expect(items).toHaveLength(3); // parent + 2 children (all of them)
  });
});
