/**
 * Edge Template Store - Manages edge/line templates for styling
 */

import { create } from 'zustand'
import type { EdgeTemplate } from '../types'

interface EdgeTemplateStore {
  // State
  edgeTemplates: EdgeTemplate[]

  // Operations
  addEdgeTemplate: (template: EdgeTemplate) => void
  updateEdgeTemplate: (id: string, updates: Partial<EdgeTemplate>) => void
  removeEdgeTemplate: (id: string) => void
  setDefaultTemplate: (id: string) => void
  importEdgeTemplates: (templates: EdgeTemplate[], merge?: boolean) => void
  exportEdgeTemplates: () => EdgeTemplate[]

  // Queries
  getEdgeTemplate: (id: string) => EdgeTemplate | undefined
  getDefaultTemplate: () => EdgeTemplate | undefined
}

// Create a basic default template
const createDefaultTemplate = (): EdgeTemplate => ({
  id: 'default',
  name: 'Default Edge Style',
  description: 'Default styling for all edges',
  isDefault: true,
  lineColor: '#999999',
  lineWidth: 2,
  lineStyle: 'solid',
  arrowShape: 'triangle',
  opacity: 1,
})

export const useEdgeTemplateStore = create<EdgeTemplateStore>((set, get) => ({
  // Initial state with default template
  edgeTemplates: [createDefaultTemplate()],

  // Operations
  addEdgeTemplate: (template) => {
    set((state) => ({
      edgeTemplates: [...state.edgeTemplates, template],
    }))
  },

  updateEdgeTemplate: (id, updates) => {
    set((state) => ({
      edgeTemplates: state.edgeTemplates.map((template) =>
        template.id === id ? { ...template, ...updates } : template
      ),
    }))
  },

  removeEdgeTemplate: (id) => {
    // Prevent removing the default template
    const template = get().getEdgeTemplate(id)
    if (template?.isDefault) {
      console.warn('Cannot remove default template')
      return
    }

    set((state) => ({
      edgeTemplates: state.edgeTemplates.filter((template) => template.id !== id),
    }))
  },

  setDefaultTemplate: (id) => {
    set((state) => ({
      edgeTemplates: state.edgeTemplates.map((template) => ({
        ...template,
        isDefault: template.id === id,
      })),
    }))
  },

  importEdgeTemplates: (templates, merge = false) => {
    if (merge) {
      // Merge with existing templates (avoid duplicates by ID)
      set((state) => {
        const existingIds = new Set(state.edgeTemplates.map((t) => t.id))
        const newTemplates = templates.filter((t) => !existingIds.has(t.id))
        return {
          edgeTemplates: [...state.edgeTemplates, ...newTemplates],
        }
      })
    } else {
      // Replace all templates (but keep default if not provided)
      const hasDefault = templates.some((t) => t.isDefault)
      const defaultTemplate = hasDefault ? [] : [createDefaultTemplate()]
      set({ edgeTemplates: [...defaultTemplate, ...templates] })
    }
  },

  exportEdgeTemplates: () => {
    return get().edgeTemplates
  },

  // Queries
  getEdgeTemplate: (id) => {
    return get().edgeTemplates.find((template) => template.id === id)
  },

  getDefaultTemplate: () => {
    return get().edgeTemplates.find((template) => template.isDefault) || get().edgeTemplates[0]
  },
}))
