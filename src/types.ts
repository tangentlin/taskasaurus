export type NodeId = string;

export type TaskKey = {
  label: string;
  source: string;
  folder?: string;
  definitionType?: string;
};

export type RootLeafNode = {
  id: NodeId;
  kind: "rootLeaf";
  label: string;
  taskKey: TaskKey;
  iconId?: string;
};

export type ParentNode = {
  id: NodeId;
  kind: "parent";
  label: string;
  iconId?: string;
  children: ChildLeafNode[];
  runnableTaskKey?: TaskKey;
};

export type ChildLeafNode = {
  id: NodeId;
  kind: "childLeaf";
  label: string;
  taskKey: TaskKey;
  iconId?: string;
};

export type RootNode = RootLeafNode | ParentNode;
export type Node = RootNode | ChildLeafNode;

export type IconMap = Map<string, string>;

export type UIState = {
  expandedGroupId?: NodeId;
  lastInteractionAt?: number;
  collapseTimer?: ReturnType<typeof setTimeout>;
};
