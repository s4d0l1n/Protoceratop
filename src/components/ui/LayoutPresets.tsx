import { useState } from 'react'
import { Save, FolderOpen, Trash2, X } from 'lucide-react'
import { toast } from '@/components/ui/Toast'
import type { LayoutType } from '@/components/ui/LayoutSwitcher'

interface LayoutPreset {
  id: string
  name: string
  layout: LayoutType
  timestamp: number
}

interface LayoutPresetsProps {
  currentLayout: LayoutType
  onLoadPreset: (layout: LayoutType) => void
  isOpen: boolean
  onClose: () => void
}

const PRESETS_STORAGE_KEY = 'raptorgraph-layout-presets'

/**
 * Layout Presets Panel
 * Allows users to save and load favorite layout configurations
 */
export function LayoutPresets({ currentLayout, onLoadPreset, isOpen, onClose }: LayoutPresetsProps) {
  const [presets, setPresets] = useState<LayoutPreset[]>(() => {
    try {
      const stored = localStorage.getItem(PRESETS_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [presetName, setPresetName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const savePreset = () => {
    if (!presetName.trim()) {
      toast.error('Please enter a preset name')
      return
    }

    const newPreset: LayoutPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      layout: currentLayout,
      timestamp: Date.now(),
    }

    const updatedPresets = [...presets, newPreset]
    setPresets(updatedPresets)
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets))

    toast.success(`Saved layout preset: ${presetName}`)
    setPresetName('')
    setIsSaving(false)
  }

  const loadPreset = (preset: LayoutPreset) => {
    onLoadPreset(preset.layout)
    toast.success(`Loaded preset: ${preset.name}`)
  }

  const deletePreset = (id: string) => {
    const updatedPresets = presets.filter(p => p.id !== id)
    setPresets(updatedPresets)
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets))
    toast.success('Deleted preset')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-dark-secondary border border-dark rounded-lg shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark bg-dark-tertiary">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-200">Layout Presets</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-dark rounded transition-colors text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Save New Preset */}
          <div className="border border-dark rounded-lg p-3 bg-dark">
            <div className="flex items-center gap-2 mb-2">
              <Save className="w-4 h-4 text-green-400" />
              <h3 className="text-sm font-medium text-slate-200">Save Current Layout</h3>
            </div>

            {!isSaving ? (
              <button
                onClick={() => setIsSaving(true)}
                className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors text-sm font-medium"
              >
                Save as Preset
              </button>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Enter preset name..."
                  className="w-full px-3 py-2 bg-dark-secondary border border-dark rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') savePreset()
                    if (e.key === 'Escape') setIsSaving(false)
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={savePreset}
                    className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors text-sm font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsSaving(false)
                      setPresetName('')
                    }}
                    className="px-3 py-2 bg-dark-tertiary hover:bg-dark text-slate-400 rounded transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Current layout: <span className="font-medium text-slate-300">{currentLayout}</span>
                </div>
              </div>
            )}
          </div>

          {/* Saved Presets List */}
          <div>
            <h3 className="text-sm font-medium text-slate-200 mb-2">Saved Presets</h3>

            {presets.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No saved presets yet.
                <br />
                Save your first preset above!
              </div>
            ) : (
              <div className="space-y-2">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between p-3 bg-dark border border-dark rounded-lg hover:bg-dark-tertiary transition-colors"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-200">{preset.name}</div>
                      <div className="text-xs text-slate-400">
                        Layout: <span className="text-slate-300">{preset.layout}</span>
                        {' • '}
                        {new Date(preset.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => loadPreset(preset)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-xs font-medium"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => deletePreset(preset.id)}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded transition-colors"
                        title="Delete preset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-dark bg-dark text-xs text-slate-400">
          {presets.length} preset{presets.length !== 1 ? 's' : ''} saved
        </div>
      </div>
    </div>
  )
}
