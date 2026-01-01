import { useState, useCallback } from 'react';
import { WorkflowState, WorkflowNode, NodeType } from '../types/workflow';

const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const initialState: WorkflowState = {
  nodes: {
    'start': {
      id: 'start',
      type: 'start',
      label: 'Start',
      children: [],
    },
  },
  rootId: 'start',
};

interface HistoryEntry {
  state: WorkflowState;
}

export function useWorkflow() {
  const [state, setState] = useState<WorkflowState>(initialState);
  const [history, setHistory] = useState<HistoryEntry[]>([{ state: initialState }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const pushHistory = useCallback((newState: WorkflowState) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ state: newState });
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const addNode = useCallback((parentId: string, type: NodeType, branchIndex?: number) => {
    setState(prev => {
      const parent = prev.nodes[parentId];
      if (!parent) return prev;

      // Can't add children to End nodes
      if (parent.type === 'end') return prev;

      const newId = generateId();
      const newNode: WorkflowNode = {
        id: newId,
        type,
        label: type === 'action' ? 'New Action' : type === 'branch' ? 'Condition' : 'End',
        children: type === 'branch' ? [] : [],
        branchLabels: type === 'branch' ? ['True', 'False'] : undefined,
      };

      const newNodes = { ...prev.nodes, [newId]: newNode };

      // Handle different parent types
      if (parent.type === 'branch' && branchIndex !== undefined) {
        // Insert into specific branch
        const newChildren = [...parent.children];
        
        // If there's already a node at this branch, make the new node point to it
        if (newChildren[branchIndex]) {
          newNode.children = [newChildren[branchIndex]];
        }
        newChildren[branchIndex] = newId;
        
        newNodes[parentId] = { ...parent, children: newChildren };
      } else if (parent.type === 'action' || parent.type === 'start') {
        // For action/start nodes, insert between parent and its child
        if (parent.children.length > 0) {
          newNode.children = [...parent.children];
        }
        newNodes[parentId] = { ...parent, children: [newId] };
      } else {
        // Default: just append
        newNodes[parentId] = { 
          ...parent, 
          children: [...parent.children, newId] 
        };
      }

      const newState = { ...prev, nodes: newNodes };
      pushHistory(newState);
      return newState;
    });
  }, [pushHistory]);

  const deleteNode = useCallback((nodeId: string) => {
    if (nodeId === 'start') return; // Can't delete start node

    setState(prev => {
      const nodeToDelete = prev.nodes[nodeId];
      if (!nodeToDelete) return prev;

      // Find parent
      let parentId: string | null = null;
      let branchIndex: number = -1;

      for (const [id, node] of Object.entries(prev.nodes)) {
        const childIndex = node.children.indexOf(nodeId);
        if (childIndex !== -1) {
          parentId = id;
          branchIndex = childIndex;
          break;
        }
      }

      if (!parentId) return prev;

      const parent = prev.nodes[parentId];
      const newNodes = { ...prev.nodes };

      // Connect parent to deleted node's children
      if (parent.type === 'branch') {
        // For branch, replace the deleted node with its first child (if any)
        const newChildren = [...parent.children];
        newChildren[branchIndex] = nodeToDelete.children[0] || '';
        // Remove empty strings
        newNodes[parentId] = { 
          ...parent, 
          children: newChildren.filter(c => c !== '') 
        };
      } else {
        // For other types, connect to all children of deleted node
        newNodes[parentId] = { 
          ...parent, 
          children: nodeToDelete.children.length > 0 ? nodeToDelete.children : [] 
        };
      }

      // Remove the node
      delete newNodes[nodeId];

      const newState = { ...prev, nodes: newNodes };
      pushHistory(newState);
      return newState;
    });
  }, [pushHistory]);

  const updateNodeLabel = useCallback((nodeId: string, label: string) => {
    setState(prev => {
      const node = prev.nodes[nodeId];
      if (!node) return prev;

      const newNodes = {
        ...prev.nodes,
        [nodeId]: { ...node, label },
      };

      const newState = { ...prev, nodes: newNodes };
      pushHistory(newState);
      return newState;
    });
  }, [pushHistory]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setState(history[historyIndex - 1].state);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setState(history[historyIndex + 1].state);
    }
  }, [history, historyIndex]);

  const saveToConsole = useCallback(() => {
    console.log('=== Workflow Data Structure ===');
    console.log(JSON.stringify(state, null, 2));
    console.log('=== End Workflow Data ===');
  }, [state]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return {
    state,
    addNode,
    deleteNode,
    updateNodeLabel,
    undo,
    redo,
    canUndo,
    canRedo,
    saveToConsole,
  };
}
