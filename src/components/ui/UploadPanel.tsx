import { X } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { useCSVStore } from '@/stores/csvStore'
import { FileUploadZone } from './FileUploadZone'

/**
 * Upload panel modal for CSV file management
 */
export function UploadPanel() {
  const { activePanel, setActivePanel } = useUIStore()
  const { files } = useCSVStore()

  if (activePanel !== 'upload') return null

  const hasUnprocessedFiles = files.some((f) => !f.processed)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-secondary border border-dark rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Upload CSV Files</h2>
            <p className="text-sm text-slate-400 mt-1">
              Import your data to begin analysis
            </p>
          </div>
          <button
            onClick={() => setActivePanel(null)}
            className="p-2 rounded-lg hover:bg-dark-tertiary text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <FileUploadZone />

          {hasUnprocessedFiles && (
            <div className="mt-6 p-4 bg-cyber-500/10 border border-cyber-500/30 rounded-lg">
              <p className="text-sm text-cyber-400">
                You have unprocessed files. Click on a file to configure column mapping.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-dark flex justify-end gap-3">
          <button
            onClick={() => setActivePanel(null)}
            className="px-4 py-2 rounded-lg bg-dark-tertiary hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Close
          </button>
          {hasUnprocessedFiles && (
            <button
              onClick={() => {
                // Will open column mapper for first unprocessed file
                const firstUnprocessed = files.find((f) => !f.processed)
                if (firstUnprocessed) {
                  setActivePanel('column-mapper')
                }
              }}
              className="px-4 py-2 rounded-lg bg-cyber-500 hover:bg-cyber-600 text-white font-medium transition-colors"
            >
              Configure Mapping
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
