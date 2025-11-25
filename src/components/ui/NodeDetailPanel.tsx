import { X, ExternalLink, Tag, Database, Clock, FileText } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { useGraphStore } from '@/stores/graphStore'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

/**
 * Node detail panel - slide-out from right showing node information
 */
export function NodeDetailPanel() {
  const { selectedNodeId, setSelectedNodeId } = useUIStore()
  const { nodes, getNodeById, getConnectedEdges } = useGraphStore()

  if (!selectedNodeId) return null

  const node = getNodeById(selectedNodeId)
  if (!node) return null

  const connectedEdges = getConnectedEdges(selectedNodeId)
  const inDegree = connectedEdges.filter((e) => e.target === selectedNodeId).length
  const outDegree = connectedEdges.filter((e) => e.source === selectedNodeId).length

  // Get connected nodes
  const connectedNodeIds = new Set<string>()
  connectedEdges.forEach((edge) => {
    if (edge.source === selectedNodeId) connectedNodeIds.add(edge.target)
    if (edge.target === selectedNodeId) connectedNodeIds.add(edge.source)
  })
  const connectedNodes = Array.from(connectedNodeIds)
    .map((id) => nodes.find((n) => n.id === id))
    .filter((n): n is typeof nodes[0] => n !== undefined)

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-dark-secondary border-l border-dark shadow-2xl z-40 overflow-hidden flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-dark bg-dark-tertiary">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-3 h-3 rounded-full',
              node.isStub ? 'bg-slate-500' : 'bg-cyber-500'
            )}
          />
          <h2 className="text-lg font-bold text-slate-100">Node Details</h2>
        </div>
        <button
          onClick={() => setSelectedNodeId(null)}
          className="p-1.5 rounded-lg hover:bg-dark-secondary text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Node ID and Label */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ExternalLink className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
              Identifier
            </h3>
          </div>
          <div className="p-3 bg-dark/50 rounded-lg border border-dark">
            <p className="text-sm font-mono text-slate-200 break-all">{node.id}</p>
            {node.label !== node.id && (
              <p className="text-xs text-slate-400 mt-1">Label: {node.label}</p>
            )}
          </div>
        </div>

        {/* Stub Indicator */}
        {node.isStub && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <p className="text-sm text-yellow-400 font-medium">Stub Node</p>
            </div>
            <p className="text-xs text-yellow-400/70 mt-1">
              Auto-created from link reference. May be promoted when full data is loaded.
            </p>
          </div>
        )}

        {/* Tags */}
        {node.tags.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                Tags
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {node.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-cyber-500/20 border border-cyber-500/30 rounded text-xs text-cyber-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Attributes */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
              Attributes
            </h3>
            <span className="text-xs text-slate-600">
              ({Object.keys(node.attributes).length})
            </span>
          </div>
          <div className="space-y-2">
            {Object.keys(node.attributes).length === 0 ? (
              <p className="text-sm text-slate-600 italic">No attributes</p>
            ) : (
              Object.entries(node.attributes).map(([key, value]) => (
                <div
                  key={key}
                  className="p-3 bg-dark/50 rounded-lg border border-dark hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-slate-500">{key}</span>
                  </div>
                  <div className="mt-1">
                    {Array.isArray(value) ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {value.map((v, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-200 break-all font-mono">{String(value)}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Timestamp */}
        {node.timestamp && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                Timestamp
              </h3>
            </div>
            <div className="p-3 bg-dark/50 rounded-lg border border-dark">
              <p className="text-sm text-slate-200">
                {format(new Date(node.timestamp), 'PPpp')}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Unix: {node.timestamp}
              </p>
            </div>
          </div>
        )}

        {/* Source Files */}
        {node.sourceFiles.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                Source Files
              </h3>
            </div>
            <div className="space-y-1">
              {node.sourceFiles.map((file) => (
                <div
                  key={file}
                  className="px-3 py-2 bg-dark/50 rounded-lg border border-dark text-sm text-slate-300"
                >
                  {file}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connections */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
              Connections
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="text-xs text-green-400 mb-1">Incoming</div>
              <div className="text-2xl font-bold text-green-400">{inDegree}</div>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="text-xs text-blue-400 mb-1">Outgoing</div>
              <div className="text-2xl font-bold text-blue-400">{outDegree}</div>
            </div>
          </div>

          {/* Connected Nodes */}
          {connectedNodes.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-xs font-medium text-slate-500 mb-2">
                Connected Nodes ({connectedNodes.length})
              </h4>
              {connectedNodes.slice(0, 10).map((connectedNode) => (
                <button
                  key={connectedNode.id}
                  onClick={() => setSelectedNodeId(connectedNode.id)}
                  className="w-full px-3 py-2 bg-dark/50 rounded-lg border border-dark hover:border-cyber-500/50 hover:bg-cyber-500/10 transition-colors text-left group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300 truncate group-hover:text-cyber-400 transition-colors">
                      {connectedNode.label}
                    </span>
                    {connectedNode.isStub && (
                      <span className="text-xs text-slate-600">STUB</span>
                    )}
                  </div>
                </button>
              ))}
              {connectedNodes.length > 10 && (
                <p className="text-xs text-slate-600 text-center py-2">
                  +{connectedNodes.length - 10} more
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
