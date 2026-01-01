import { useEffect } from 'react';
import { useWorkflow } from '../../hooks/useWorkflow';
import { Toolbar } from './Toolbar';
import { WorkflowCanvas } from './WorkflowCanvas';

export function WorkflowBuilder() {
  const {
    state,
    addNode,
    deleteNode,
    updateNodeLabel,
    undo,
    redo,
    canUndo,
    canRedo,
    saveToConsole,
  } = useWorkflow();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveToConsole();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, saveToConsole]);

  return (
    <div className="flex flex-col h-screen bg-background">
      <Toolbar
        onUndo={undo}
        onRedo={redo}
        onSave={saveToConsole}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      <WorkflowCanvas
        state={state}
        onAddNode={addNode}
        onDeleteNode={deleteNode}
        onUpdateLabel={updateNodeLabel}
      />
    </div>
  );
}
