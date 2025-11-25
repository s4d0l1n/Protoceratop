/**
 * Project import/export functionality for .raptorjson files
 */

import type { ProjectState } from '@/types'

/**
 * Export project state to JSON file
 */
export function exportProject(state: ProjectState): void {
  const json = JSON.stringify(state, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${state.name || 'project'}_${Date.now()}.raptorjson`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Import project from .raptorjson file
 */
export async function importProject(file: File): Promise<ProjectState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const state = JSON.parse(content) as ProjectState

        // Validate project structure
        if (!state.version || !state.csvFiles || !state.nodes || !state.edges) {
          throw new Error('Invalid project file format')
        }

        resolve(state)
      } catch (error) {
        reject(new Error(`Failed to parse project file: ${error}`))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read project file'))
    }

    reader.readAsText(file)
  })
}

/**
 * Create project state snapshot from stores
 */
export function createProjectSnapshot(stores: {
  projectName: string
  description: string
  version: string
  createdAt: number
  modifiedAt: number
  csvFiles: ProjectState['csvFiles']
  nodes: ProjectState['nodes']
  edges: ProjectState['edges']
  cardTemplates: ProjectState['cardTemplates']
  edgeTemplates: ProjectState['edgeTemplates']
  styleRules: ProjectState['styleRules']
  layoutConfig: ProjectState['layoutConfig']
}): ProjectState {
  return {
    version: '1.0.0',
    name: stores.projectName,
    description: stores.description,
    createdAt: stores.createdAt,
    modifiedAt: Date.now(),
    csvFiles: stores.csvFiles,
    nodes: stores.nodes,
    edges: stores.edges,
    cardTemplates: stores.cardTemplates,
    edgeTemplates: stores.edgeTemplates,
    styleRules: stores.styleRules,
    layoutConfig: stores.layoutConfig,
  }
}
