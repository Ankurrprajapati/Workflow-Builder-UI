import { useState, useRef, useEffect } from 'react';
import { WorkflowNode as WorkflowNodeType, NodeType } from '../../types/workflow';

interface WorkflowNodeProps {
  node: WorkflowNodeType;
  onAddNode: (type: NodeType, branchIndex?: number) => void;
  onDeleteNode: () => void;
  onUpdateLabel: (label: string) => void;
  isStart?: boolean;
}

const nodeTypeIcons: Record<NodeType, string> = {
  start: '▶',
  action: '⚡',
  branch: '◆',
  end: '■',
};

const nodeTypeClasses: Record<NodeType, string> = {
  start: 'node-start',
  action: 'node-action',
  branch: 'node-branch',
  end: 'node-end',
};

const badgeClasses: Record<NodeType, string> = {
  start: 'badge-start',
  action: 'badge-action',
  branch: 'badge-branch',
  end: 'badge-end',
};

export function WorkflowNodeComponent({ 
  node, 
  onAddNode, 
  onDeleteNode, 
  onUpdateLabel,
  isStart = false 
}: WorkflowNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.label);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [menuBranchIndex, setMenuBranchIndex] = useState<number | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowAddMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveLabel = () => {
    onUpdateLabel(editValue.trim() || node.label);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveLabel();
    } else if (e.key === 'Escape') {
      setEditValue(node.label);
      setIsEditing(false);
    }
  };

  const handleAddClick = (branchIndex?: number) => {
    setMenuBranchIndex(branchIndex);
    setShowAddMenu(true);
  };

  const handleSelectNodeType = (type: NodeType) => {
    onAddNode(type, menuBranchIndex);
    setShowAddMenu(false);
    setMenuBranchIndex(undefined);
  };

  const canAddChildren = node.type !== 'end';

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div className={`node-card ${nodeTypeClasses[node.type]} min-w-[180px] max-w-[240px]`}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <span className={`badge ${badgeClasses[node.type]}`}>
            <span className="mr-1">{nodeTypeIcons[node.type]}</span>
            {node.type.charAt(0).toUpperCase() + node.type.slice(1)}
          </span>
          {!isStart && (
            <button
              onClick={onDeleteNode}
              className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Delete node"
            >
              ×
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-3 py-3">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveLabel}
              onKeyDown={handleKeyDown}
              className="input-field text-sm"
            />
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              className="cursor-pointer text-sm font-medium text-foreground hover:text-primary transition-colors"
              title="Click to edit"
            >
              {node.label}
            </div>
          )}
        </div>
      </div>

      {/* Add Button(s) */}
      {canAddChildren && (
        <div className="relative mt-2">
          {node.type === 'branch' ? (
            <div className="flex gap-8">
              {(node.branchLabels || ['True', 'False']).map((label, index) => (
                <div key={index} className="flex flex-col items-center">
                  <span className={`branch-label mb-2 ${index === 0 ? 'branch-true' : 'branch-false'}`}>
                    {label}
                  </span>
                  <button
                    onClick={() => handleAddClick(index)}
                    className="add-button"
                    title={`Add to ${label} branch`}
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <button
              onClick={() => handleAddClick()}
              className="add-button"
              title="Add node"
            >
              +
            </button>
          )}

          {/* Add Node Menu */}
          {showAddMenu && (
            <div ref={menuRef} className="dropdown-menu top-full mt-2 left-1/2 -translate-x-1/2">
              <button
                onClick={() => handleSelectNodeType('action')}
                className="dropdown-item flex items-center gap-2"
              >
                <span className="text-primary">⚡</span>
                Action
              </button>
              <button
                onClick={() => handleSelectNodeType('branch')}
                className="dropdown-item flex items-center gap-2"
              >
                <span style={{ color: 'hsl(280, 65%, 60%)' }}>◆</span>
                Branch
              </button>
              <button
                onClick={() => handleSelectNodeType('end')}
                className="dropdown-item flex items-center gap-2"
              >
                <span className="text-destructive">■</span>
                End
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
