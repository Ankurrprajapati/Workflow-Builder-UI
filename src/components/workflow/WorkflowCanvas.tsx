import { useCallback, useRef, useEffect, useState } from 'react';
import { WorkflowState, NodeType } from '../../types/workflow';
import { WorkflowNodeComponent } from './WorkflowNode';

interface WorkflowCanvasProps {
  state: WorkflowState;
  onAddNode: (parentId: string, type: NodeType, branchIndex?: number) => void;
  onDeleteNode: (nodeId: string) => void;
  onUpdateLabel: (nodeId: string, label: string) => void;
}

interface NodeLayout {
  nodeId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  children: { nodeId: string; branchIndex?: number }[];
}

export function WorkflowCanvas({ 
  state, 
  onAddNode, 
  onDeleteNode, 
  onUpdateLabel 
}: WorkflowCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [layouts, setLayouts] = useState<NodeLayout[]>([]);
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 });

  // Calculate layouts for all nodes
  const calculateLayouts = useCallback(() => {
    const NODE_WIDTH = 200;
    const NODE_HEIGHT = 100;
    const HORIZONTAL_GAP = 80;
    const VERTICAL_GAP = 100;

    const nodeLayouts: Map<string, NodeLayout> = new Map();
    const levelWidths: Map<number, number> = new Map();
    const nodeLevel: Map<string, number> = new Map();
    const nodeLevelIndex: Map<string, number> = new Map();

    // BFS to calculate levels
    const queue: { nodeId: string; level: number }[] = [{ nodeId: state.rootId, level: 0 }];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { nodeId, level } = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const node = state.nodes[nodeId];
      if (!node) continue;

      nodeLevel.set(nodeId, level);
      
      const currentLevelWidth = levelWidths.get(level) || 0;
      nodeLevelIndex.set(nodeId, currentLevelWidth);
      levelWidths.set(level, currentLevelWidth + 1);

      for (const childId of node.children) {
        if (childId && state.nodes[childId]) {
          queue.push({ nodeId: childId, level: level + 1 });
        }
      }
    }

    // Calculate positions
    const maxLevel = Math.max(...Array.from(levelWidths.keys()), 0);
    let maxWidth = 0;

    for (const [level, width] of levelWidths.entries()) {
      maxWidth = Math.max(maxWidth, width);
    }

    for (const nodeId of visited) {
      const node = state.nodes[nodeId];
      if (!node) continue;

      const level = nodeLevel.get(nodeId) || 0;
      const levelIndex = nodeLevelIndex.get(nodeId) || 0;
      const levelWidth = levelWidths.get(level) || 1;

      const totalLevelWidth = levelWidth * (NODE_WIDTH + HORIZONTAL_GAP) - HORIZONTAL_GAP;
      const startX = (maxWidth * (NODE_WIDTH + HORIZONTAL_GAP) - totalLevelWidth) / 2;

      const x = startX + levelIndex * (NODE_WIDTH + HORIZONTAL_GAP) + NODE_WIDTH / 2;
      const y = level * (NODE_HEIGHT + VERTICAL_GAP) + NODE_HEIGHT / 2 + 40;

      const children = node.children
        .filter(childId => childId && state.nodes[childId])
        .map((childId, index) => ({
          nodeId: childId,
          branchIndex: node.type === 'branch' ? index : undefined,
        }));

      nodeLayouts.set(nodeId, {
        nodeId,
        x,
        y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        children,
      });
    }

    const layoutArray = Array.from(nodeLayouts.values());
    setLayouts(layoutArray);

    // Calculate SVG size
    const canvasWidth = Math.max(maxWidth * (NODE_WIDTH + HORIZONTAL_GAP) + 100, 800);
    const canvasHeight = (maxLevel + 1) * (NODE_HEIGHT + VERTICAL_GAP) + 200;
    setSvgSize({ width: canvasWidth, height: canvasHeight });
  }, [state]);

  useEffect(() => {
    calculateLayouts();
  }, [calculateLayouts]);

  // Generate connection paths
  const connections: { 
    startX: number; 
    startY: number; 
    endX: number; 
    endY: number;
    branchIndex?: number;
  }[] = [];

  for (const layout of layouts) {
    const NODE_HEIGHT = 100;
    
    for (const child of layout.children) {
      const childLayout = layouts.find(l => l.nodeId === child.nodeId);
      if (childLayout) {
        connections.push({
          startX: layout.x,
          startY: layout.y + NODE_HEIGHT / 2,
          endX: childLayout.x,
          endY: childLayout.y - NODE_HEIGHT / 2,
          branchIndex: child.branchIndex,
        });
      }
    }
  }

  return (
    <div 
      ref={containerRef}
      className="relative flex-1 overflow-auto canvas-grid"
    >
      <div 
        className="relative"
        style={{ 
          minWidth: svgSize.width, 
          minHeight: svgSize.height,
          margin: '0 auto',
        }}
      >
        {/* SVG for connections */}
        <svg 
          className="absolute inset-0 pointer-events-none"
          width={svgSize.width}
          height={svgSize.height}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="hsl(215, 20%, 55%)"
              />
            </marker>
          </defs>
          {connections.map((conn, index) => {
            const midY = (conn.startY + conn.endY) / 2;
            const path = `M ${conn.startX} ${conn.startY} C ${conn.startX} ${midY}, ${conn.endX} ${midY}, ${conn.endX} ${conn.endY}`;
            
            return (
              <path
                key={index}
                d={path}
                className="connection-line"
                markerEnd="url(#arrowhead)"
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {layouts.map(layout => {
          const node = state.nodes[layout.nodeId];
          if (!node) return null;

          return (
            <div
              key={layout.nodeId}
              className="absolute"
              style={{
                left: layout.x - layout.width / 2,
                top: layout.y - layout.height / 2,
                width: layout.width,
              }}
            >
              <WorkflowNodeComponent
                node={node}
                isStart={layout.nodeId === state.rootId}
                onAddNode={(type, branchIndex) => onAddNode(layout.nodeId, type, branchIndex)}
                onDeleteNode={() => onDeleteNode(layout.nodeId)}
                onUpdateLabel={(label) => onUpdateLabel(layout.nodeId, label)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
