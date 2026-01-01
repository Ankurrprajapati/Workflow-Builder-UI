export type NodeType = 'start' | 'action' | 'branch' | 'end';

export interface WorkflowNode {
  id: string;
  type: NodeType;
  label: string;
  children: string[]; // Array of child node IDs
  branchLabels?: string[]; // For branch nodes: labels like "True", "False"
}

export interface WorkflowState {
  nodes: Record<string, WorkflowNode>;
  rootId: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface NodePosition {
  nodeId: string;
  position: Position;
  width: number;
  height: number;
}
