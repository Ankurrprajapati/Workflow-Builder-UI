interface ToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function Toolbar({ onUndo, onRedo, onSave, canUndo, canRedo }: ToolbarProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card">
      <div className="flex items-center gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`toolbar-button ${!canUndo ? 'opacity-40 cursor-not-allowed' : ''}`}
          title="Undo (Ctrl+Z)"
        >
          ↶ Undo
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`toolbar-button ${!canRedo ? 'opacity-40 cursor-not-allowed' : ''}`}
          title="Redo (Ctrl+Y)"
        >
          ↷ Redo
        </button>
      </div>

      <div className="flex-1" />

      <button
        onClick={onSave}
        className="toolbar-button primary"
        title="Save workflow to console"
      >
        💾 Save to Console
      </button>
    </div>
  );
}
