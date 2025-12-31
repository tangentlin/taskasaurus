import { describe, it, expect } from "vitest";
import {
  buildVisibleItems,
  computePriority,
  composeParentLabel,
  composeRootLeafLabel,
  composeChildLeafLabel,
  COMMAND_ID,
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

  it("sets correct commandArgs with nodeId", () => {
    const roots = [createRootLeaf("Build")];
    const items = buildVisibleItems(roots, {});

    expect(items[0].commandArgs).toEqual({ nodeId: "rootLeaf::Build" });
  });

  it("exports correct COMMAND_ID", () => {
    expect(COMMAND_ID).toBe("taskasaurus.clickNode");
  });
});
