import { useEffect } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useGraphStore } from '@/stores/graphStore'
import { useProjectIO } from './useProjectIO'

/**
 * Keyboard shortcuts for the application
 *
 * Shortcuts:
 * - Escape: Close active panel / Clear selection
 * - Delete/Backspace: Delete selected node (with confirmation)
 * - Ctrl/Cmd + A: Select all nodes (future enhancement)
 * - Ctrl/Cmd + S: Save project
 * - Ctrl/Cmd + O: Open project
 * - Ctrl/Cmd + F: Open search panel
 * - Ctrl/Cmd + K: Open command palette (future)
 * - ?: Show keyboard shortcuts help
 */
export function useKeyboardShortcuts() {
  const { activePanel, setActivePanel, selectedNodeId, setSelectedNodeId } = useUIStore()
  const { nodes, removeNode } = useGraphStore()
  const { saveProject, handleLoadFile } = useProjectIO()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input/textarea
      const target = e.target as HTMLElement
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      // Escape - Close panel or clear selection
      if (e.key === 'Escape') {
        if (activePanel) {
          setActivePanel(null)
        } else if (selectedNodeId) {
          setSelectedNodeId(null)
        }
        return
      }

      // Don't process other shortcuts while typing
      if (isTyping) return

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modKey = isMac ? e.metaKey : e.ctrlKey

      // Delete/Backspace - Delete selected node
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
        e.preventDefault()
        const node = nodes.find((n) => n.id === selectedNodeId)
        if (node && confirm(`Delete node "${node.label}"?`)) {
          removeNode(selectedNodeId)
          setSelectedNodeId(null)
        }
        return
      }

      // Ctrl/Cmd + S - Save project
      if (modKey && e.key === 's') {
        e.preventDefault()
        if (nodes.length > 0) {
          saveProject()
        }
        return
      }

      // Ctrl/Cmd + O - Open project
      if (modKey && e.key === 'o') {
        e.preventDefault()
        handleLoadFile()
        return
      }

      // Ctrl/Cmd + F - Open search panel
      if (modKey && e.key === 'f') {
        e.preventDefault()
        setActivePanel(activePanel === 'search' ? null : 'search')
        return
      }

      // ? - Show help (Shift + /)
      if (e.key === '?' && !modKey) {
        e.preventDefault()
        // Future: Show keyboard shortcuts help modal
        console.log('Keyboard shortcuts help')
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activePanel, selectedNodeId, nodes, setActivePanel, setSelectedNodeId, removeNode, saveProject, handleLoadFile])
}
