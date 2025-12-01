import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignHorizontalJustifyCenter,
  AlignVerticalSpaceAround,
  AlignHorizontalSpaceAround,
  Lock,
  Unlock
} from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { useGraphStore } from '@/stores/graphStore'

interface ArrangementToolbarProps {
  onAlign: (direction: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void
  onDistribute: (axis: 'horizontal' | 'vertical') => void
  onToggleLock: () => void
  isLocked: boolean
}

/**
 * Toolbar for manual node arrangement tools
 * Shows when multiple nodes are selected
 */
export function ArrangementToolbar({ onAlign, onDistribute, onToggleLock, isLocked }: ArrangementToolbarProps) {
  const { selectedNodeIds } = useUIStore()

  // Only show if 2 or more nodes are selected
  if (selectedNodeIds.size < 2) return null

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-dark-secondary border border-dark rounded-lg shadow-2xl p-2 flex items-center gap-1">
        <div className="text-xs text-slate-400 px-2 border-r border-dark">
          {selectedNodeIds.size} nodes selected
        </div>

        {/* Alignment tools */}
        <div className="flex items-center gap-1 px-2 border-r border-dark">
          <span className="text-xs text-slate-400 mr-1">Align:</span>
          <button
            onClick={() => onAlign('left')}
            className="p-1.5 hover:bg-dark rounded transition-colors text-slate-300 hover:text-slate-100"
            title="Align left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onAlign('center')}
            className="p-1.5 hover:bg-dark rounded transition-colors text-slate-300 hover:text-slate-100"
            title="Align center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => onAlign('right')}
            className="p-1.5 hover:bg-dark rounded transition-colors text-slate-300 hover:text-slate-100"
            title="Align right"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-dark mx-1" />
          <button
            onClick={() => onAlign('top')}
            className="p-1.5 hover:bg-dark rounded transition-colors text-slate-300 hover:text-slate-100"
            title="Align top"
          >
            <AlignLeft className="w-4 h-4 rotate-90" />
          </button>
          <button
            onClick={() => onAlign('middle')}
            className="p-1.5 hover:bg-dark rounded transition-colors text-slate-300 hover:text-slate-100"
            title="Align middle"
          >
            <AlignVerticalJustifyCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => onAlign('bottom')}
            className="p-1.5 hover:bg-dark rounded transition-colors text-slate-300 hover:text-slate-100"
            title="Align bottom"
          >
            <AlignRight className="w-4 h-4 rotate-90" />
          </button>
        </div>

        {/* Distribution tools */}
        <div className="flex items-center gap-1 px-2 border-r border-dark">
          <span className="text-xs text-slate-400 mr-1">Distribute:</span>
          <button
            onClick={() => onDistribute('horizontal')}
            className="p-1.5 hover:bg-dark rounded transition-colors text-slate-300 hover:text-slate-100"
            title="Distribute horizontally"
          >
            <AlignHorizontalSpaceAround className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDistribute('vertical')}
            className="p-1.5 hover:bg-dark rounded transition-colors text-slate-300 hover:text-slate-100"
            title="Distribute vertically"
          >
            <AlignVerticalSpaceAround className="w-4 h-4" />
          </button>
        </div>

        {/* Lock/Unlock */}
        <div className="flex items-center gap-1 px-2">
          <button
            onClick={onToggleLock}
            className={`p-1.5 hover:bg-dark rounded transition-colors ${
              isLocked ? 'text-amber-400 hover:text-amber-300' : 'text-slate-300 hover:text-slate-100'
            }`}
            title={isLocked ? 'Unlock positions' : 'Lock positions'}
          >
            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
        </div>

        {/* Clear selection */}
        <button
          onClick={() => useUIStore.getState().setSelectedNodeIds(new Set())}
          className="ml-1 px-3 py-1.5 text-xs bg-dark hover:bg-dark-tertiary text-slate-400 hover:text-slate-200 rounded transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  )
}
