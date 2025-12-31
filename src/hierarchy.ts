import type * as vscode from "vscode";
import type {
  TaskKey,
  RootNode,
  RootLeafNode,
  ParentNode,
  ChildLeafNode,
  IconMap,
  NodeId,
} from "./types";
import { createTaskKey, taskKeyToId } from "./taskKey";

type TaskInfo = {
  task: vscode.Task;
  taskKey: TaskKey;
  label: string;
  groupName: string | undefined;
  iconId: string | undefined;
  originalIndex: number;
};

function parseGroupName(label: string): string | undefined {
  const colonIndex = label.indexOf(":");
  if (colonIndex === -1) {
    return undefined;
  }
  return label.substring(0, colonIndex).trim();
}

function getTaskIconId(task: vscode.Task, iconMap: IconMap): string | undefined {
  // Try runtime icon first (if available on the task object)
  const taskAny = task as unknown as Record<string, unknown>;
  if (taskAny.icon && typeof taskAny.icon === "object") {
    const icon = taskAny.icon as { id?: string };
    if (icon.id) {
      return icon.id;
    }
  }

  // Fall back to iconMap (from tasks.json parsing)
  return iconMap.get(task.name);
}

function generateNodeId(kind: string, key: TaskKey | string): NodeId {
  if (typeof key === "string") {
    return `${kind}::${key}`;
  }
  return `${kind}::${taskKeyToId(key)}`;
}

export function buildHierarchy(tasks: vscode.Task[], iconMap: IconMap): RootNode[] {
  // Step 1: Build TaskInfo for each task
  const taskInfos: TaskInfo[] = tasks.map((task, index) => ({
    task,
    taskKey: createTaskKey(task),
    label: task.name,
    groupName: parseGroupName(task.name),
    iconId: getTaskIconId(task, iconMap),
    originalIndex: index,
  }));

  // Step 2: Count how many tasks belong to each potential group
  // Tasks with "Group: something" contribute to group "Group"
  const groupCounts = new Map<string, number>();
  for (const info of taskInfos) {
    if (info.groupName !== undefined) {
      groupCounts.set(info.groupName, (groupCounts.get(info.groupName) ?? 0) + 1);
    }
  }

  // Step 3: Determine which groups are valid (2+ children with colons)
  const validGroups = new Set<string>();
  for (const [groupName, count] of groupCounts) {
    if (count >= 2) {
      validGroups.add(groupName);
    }
  }

  // Step 3b: Find tasks whose label exactly matches a valid group name
  // These need to be included in the group as runnable children
  const exactMatchTasks = new Set<TaskInfo>();
  for (const info of taskInfos) {
    if (info.groupName === undefined && validGroups.has(info.label)) {
      exactMatchTasks.add(info);
    }
  }

  // Step 4: Build nodes
  const groupMap = new Map<
    string,
    {
      children: ChildLeafNode[];
      runnableTask?: TaskInfo;
    }
  >();

  const rootLeaves: RootLeafNode[] = [];

  for (const info of taskInfos) {
    // Check if this task belongs to a valid group:
    // 1. Has a groupName (colon prefix) that matches a valid group, OR
    // 2. Task label exactly matches a valid group name (exactMatchTasks)
    const belongsToGroup =
      (info.groupName !== undefined && validGroups.has(info.groupName)) ||
      exactMatchTasks.has(info);

    if (belongsToGroup) {
      // Determine the group name
      const groupName = info.groupName ?? info.label;

      let group = groupMap.get(groupName);
      if (!group) {
        group = { children: [] };
        groupMap.set(groupName, group);
      }

      // Check if task label equals group name exactly (runnable parent)
      // This happens when label is exactly "Test" and we have "Test: unit", "Test: e2e"
      if (info.label === groupName) {
        group.runnableTask = info;
      }

      // Add as child (even if it's the runnable task - it appears at top of children)
      const childNode: ChildLeafNode = {
        id: generateNodeId("childLeaf", info.taskKey),
        kind: "childLeaf",
        label: info.label,
        taskKey: info.taskKey,
        iconId: info.iconId,
      };
      group.children.push(childNode);
    } else {
      // Root leaf: either no colon, or only one task with this group name
      const rootLeaf: RootLeafNode = {
        id: generateNodeId("rootLeaf", info.taskKey),
        kind: "rootLeaf",
        label: info.label,
        taskKey: info.taskKey,
        iconId: info.iconId,
      };
      rootLeaves.push(rootLeaf);
    }
  }

  // Step 5: Convert group map to ParentNodes
  const parents: ParentNode[] = [];
  for (const [groupName, group] of groupMap) {
    // Sort children alphabetically by full task label
    group.children.sort((a, b) => {
      const cmp = a.label.toLowerCase().localeCompare(b.label.toLowerCase());
      return cmp !== 0 ? cmp : a.label.localeCompare(b.label);
    });

    // If there's a runnable task matching the group name, move it to the top
    if (group.runnableTask) {
      const runnableIndex = group.children.findIndex(
        (c) =>
          c.label === group.runnableTask!.label &&
          c.taskKey.source === group.runnableTask!.taskKey.source,
      );
      if (runnableIndex > 0) {
        const [runnableChild] = group.children.splice(runnableIndex, 1);
        group.children.unshift(runnableChild);
      }
    }

    const parent: ParentNode = {
      id: generateNodeId("parent", groupName),
      kind: "parent",
      label: groupName,
      iconId: group.runnableTask?.iconId,
      children: group.children,
      runnableTaskKey: group.runnableTask?.taskKey,
    };
    parents.push(parent);
  }

  // Step 6: Combine and sort all root nodes
  const rootNodes: RootNode[] = [...rootLeaves, ...parents];

  // Sort alphabetically by display label (case-insensitive), stable tie-break by original order
  rootNodes.sort((a, b) => {
    const cmp = a.label.toLowerCase().localeCompare(b.label.toLowerCase());
    if (cmp !== 0) return cmp;
    // Stable tie-break: use the label itself for consistent ordering
    return a.label.localeCompare(b.label);
  });

  return rootNodes;
}

export function disambiguateLabels(nodes: RootNode[]): void {
  // Find duplicate labels across folders
  const labelToNodes = new Map<string, RootNode[]>();

  const collectNodes = (node: RootNode): void => {
    const existing = labelToNodes.get(node.label) ?? [];
    existing.push(node);
    labelToNodes.set(node.label, existing);

    if (node.kind === "parent") {
      for (const child of node.children) {
        const childExisting = labelToNodes.get(child.label) ?? [];
        childExisting.push(child as unknown as RootNode);
        labelToNodes.set(child.label, childExisting);
      }
    }
  };

  for (const node of nodes) {
    collectNodes(node);
  }

  // For each label with duplicates from different folders, add suffix
  for (const [label, nodesWithLabel] of labelToNodes) {
    if (nodesWithLabel.length < 2) continue;

    // Check if they're from different folders
    const folders = new Set<string | undefined>();
    for (const n of nodesWithLabel) {
      const folder = "taskKey" in n ? n.taskKey.folder : undefined;
      folders.add(folder);
    }

    if (folders.size < 2) continue;

    // Disambiguate by appending folder name
    for (const n of nodesWithLabel) {
      const folder = "taskKey" in n ? n.taskKey.folder : undefined;
      if (folder) {
        (n as { label: string }).label = `${label}【${folder}】`;
      }
    }
  }
}
