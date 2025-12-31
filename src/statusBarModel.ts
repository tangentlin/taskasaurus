import type { RootNode, ChildLeafNode, NodeId, UIState, TaskFeedback, TaskKey } from "./types";
import { taskKeyToId } from "./taskKey";

export type FeedbackMap = Map<string, TaskFeedback>;

export type VisibleItem = {
  nodeId: NodeId;
  label: string;
  tooltip: string;
  priority: number;
  commandArgs: { nodeId: string };
};

const COMMAND_ID = "taskasaurus.clickNode";

function getFeedbackIcon(feedback: TaskFeedback | undefined): string | undefined {
  if (!feedback) return undefined;
  switch (feedback.state) {
    case "running":
      return "$(loading~spin)";
    case "success":
      return "$(check)";
    case "error":
      return "$(error)";
  }
}

function getFeedbackForTaskKey(
  taskKey: TaskKey | undefined,
  feedbackMap: FeedbackMap,
): TaskFeedback | undefined {
  if (!taskKey) return undefined;
  return feedbackMap.get(taskKeyToId(taskKey));
}

export function computePriority(rootIndex: number, childIndex?: number): number {
  const rootPriority = 10000 - rootIndex * 100;
  if (childIndex === undefined) {
    return rootPriority;
  }
  return rootPriority - 50 - childIndex;
}

export function composeParentLabel(
  node: { label: string; iconId?: string },
  expanded: boolean,
  feedback?: TaskFeedback,
): string {
  const disclosure = expanded ? "$(chevron-down)" : "$(chevron-right)";
  const feedbackIcon = getFeedbackIcon(feedback);

  // Feedback icon takes precedence over task icon
  if (feedbackIcon) {
    return `${feedbackIcon} ${node.label} ${disclosure}`;
  }
  if (node.iconId) {
    return `$(${node.iconId}) ${node.label} ${disclosure}`;
  }
  return `${node.label} ${disclosure}`;
}

export function composeRootLeafLabel(
  node: { label: string; iconId?: string },
  feedback?: TaskFeedback,
): string {
  const feedbackIcon = getFeedbackIcon(feedback);

  // Feedback icon takes precedence over task icon
  if (feedbackIcon) {
    return `${feedbackIcon} ${node.label}`;
  }
  if (node.iconId) {
    return `$(${node.iconId}) ${node.label}`;
  }
  return node.label;
}

export function composeChildLeafLabel(node: ChildLeafNode, feedback?: TaskFeedback): string {
  const feedbackIcon = getFeedbackIcon(feedback);

  // Feedback icon replaces task icon but keeps child indicator
  if (feedbackIcon) {
    return `$(arrow-small-right) ${feedbackIcon} ${node.label}`;
  }
  if (node.iconId) {
    return `$(arrow-small-right) $(${node.iconId}) ${node.label}`;
  }
  return `$(arrow-small-right) ${node.label}`;
}

function composeParentTooltip(
  label: string,
  expanded: boolean,
  source?: string,
  folder?: string,
): string {
  const action = expanded ? "Collapse" : "Expand";
  let tooltip = `${action} group '${label}'`;
  if (source || folder) {
    const parts: string[] = [];
    if (source) parts.push(source);
    if (folder) parts.push(folder);
    tooltip += `\n(${parts.join(" • ")})`;
  }
  return tooltip;
}

function composeLeafTooltip(label: string, source?: string, folder?: string): string {
  let tooltip = `Run task '${label}'`;
  if (source || folder) {
    const parts: string[] = [];
    if (source) parts.push(source);
    if (folder) parts.push(folder);
    tooltip += `\n(${parts.join(" • ")})`;
  }
  return tooltip;
}

export function buildVisibleItems(
  roots: RootNode[],
  uiState: UIState,
  feedbackMap: FeedbackMap = new Map(),
): VisibleItem[] {
  const items: VisibleItem[] = [];

  for (let i = 0; i < roots.length; i++) {
    const node = roots[i];

    if (node.kind === "parent") {
      const expanded = uiState.expandedGroupId === node.id;
      const source = node.runnableTaskKey?.source;
      const folder = node.runnableTaskKey?.folder;
      const feedback = getFeedbackForTaskKey(node.runnableTaskKey, feedbackMap);

      items.push({
        nodeId: node.id,
        label: composeParentLabel(node, expanded, feedback),
        tooltip: composeParentTooltip(node.label, expanded, source, folder),
        priority: computePriority(i),
        commandArgs: { nodeId: node.id },
      });

      if (expanded) {
        for (let j = 0; j < node.children.length; j++) {
          const child = node.children[j];
          const childFeedback = getFeedbackForTaskKey(child.taskKey, feedbackMap);
          items.push({
            nodeId: child.id,
            label: composeChildLeafLabel(child, childFeedback),
            tooltip: composeLeafTooltip(child.label, child.taskKey.source, child.taskKey.folder),
            priority: computePriority(i, j),
            commandArgs: { nodeId: child.id },
          });
        }
      }
    } else {
      // rootLeaf
      const feedback = getFeedbackForTaskKey(node.taskKey, feedbackMap);
      items.push({
        nodeId: node.id,
        label: composeRootLeafLabel(node, feedback),
        tooltip: composeLeafTooltip(node.label, node.taskKey.source, node.taskKey.folder),
        priority: computePriority(i),
        commandArgs: { nodeId: node.id },
      });
    }
  }

  return items;
}

export { COMMAND_ID };
