import type { RootNode, ChildLeafNode, NodeId, UIState } from './types';

export type VisibleItem = {
  nodeId: NodeId;
  label: string;
  tooltip: string;
  priority: number;
  commandArgs: { nodeId: string };
};

const COMMAND_ID = 'taskasaurus.clickNode';

export function computePriority(rootIndex: number, childIndex?: number): number {
  const rootPriority = 10000 - rootIndex * 100;
  if (childIndex === undefined) {
    return rootPriority;
  }
  return rootPriority - 50 - childIndex;
}

export function composeParentLabel(node: { label: string; iconId?: string }, expanded: boolean): string {
  const disclosure = expanded ? '$(chevron-down)' : '$(chevron-right)';
  if (node.iconId) {
    return `$(${node.iconId}) ${node.label} ${disclosure}`;
  }
  return `${node.label} ${disclosure}`;
}

export function composeRootLeafLabel(node: { label: string; iconId?: string }): string {
  if (node.iconId) {
    return `$(${node.iconId}) ${node.label}`;
  }
  return node.label;
}

export function composeChildLeafLabel(node: ChildLeafNode): string {
  if (node.iconId) {
    return `$(arrow-small-right) $(${node.iconId}) ${node.label}`;
  }
  return `$(arrow-small-right) ${node.label}`;
}

function composeParentTooltip(label: string, expanded: boolean, source?: string, folder?: string): string {
  const action = expanded ? 'Collapse' : 'Expand';
  let tooltip = `${action} group '${label}'`;
  if (source || folder) {
    const parts: string[] = [];
    if (source) parts.push(source);
    if (folder) parts.push(folder);
    tooltip += `\n(${parts.join(' • ')})`;
  }
  return tooltip;
}

function composeLeafTooltip(label: string, source?: string, folder?: string): string {
  let tooltip = `Run task '${label}'`;
  if (source || folder) {
    const parts: string[] = [];
    if (source) parts.push(source);
    if (folder) parts.push(folder);
    tooltip += `\n(${parts.join(' • ')})`;
  }
  return tooltip;
}

export function buildVisibleItems(roots: RootNode[], uiState: UIState): VisibleItem[] {
  const items: VisibleItem[] = [];

  for (let i = 0; i < roots.length; i++) {
    const node = roots[i];

    if (node.kind === 'parent') {
      const expanded = uiState.expandedGroupId === node.id;
      const source = node.runnableTaskKey?.source;
      const folder = node.runnableTaskKey?.folder;

      items.push({
        nodeId: node.id,
        label: composeParentLabel(node, expanded),
        tooltip: composeParentTooltip(node.label, expanded, source, folder),
        priority: computePriority(i),
        commandArgs: { nodeId: node.id },
      });

      if (expanded) {
        for (let j = 0; j < node.children.length; j++) {
          const child = node.children[j];
          items.push({
            nodeId: child.id,
            label: composeChildLeafLabel(child),
            tooltip: composeLeafTooltip(child.label, child.taskKey.source, child.taskKey.folder),
            priority: computePriority(i, j),
            commandArgs: { nodeId: child.id },
          });
        }
      }
    } else {
      // rootLeaf
      items.push({
        nodeId: node.id,
        label: composeRootLeafLabel(node),
        tooltip: composeLeafTooltip(node.label, node.taskKey.source, node.taskKey.folder),
        priority: computePriority(i),
        commandArgs: { nodeId: node.id },
      });
    }
  }

  return items;
}

export { COMMAND_ID };
