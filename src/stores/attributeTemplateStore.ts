/**
 * Attribute Template Store - Manages attribute templates for styling
 */

import { create } from 'zustand'
import type { AttributeTemplate } from '../types'

interface AttributeTemplateStore {
  // State
  attributeTemplates: AttributeTemplate[]

  // Operations
  addAttributeTemplate: (template: AttributeTemplate) => void
  updateAttributeTemplate: (id: string, updates: Partial<AttributeTemplate>) => void
  removeAttributeTemplate: (id: string) => void
  setDefaultTemplate: (id: string) => void
  importAttributeTemplates: (templates: AttributeTemplate[], merge?: boolean) => void
  exportAttributeTemplates: () => AttributeTemplate[]

  // Queries
  getAttributeTemplate: (id: string) => AttributeTemplate | undefined
  getDefaultTemplate: () => AttributeTemplate | undefined
}

// Create a basic default template
const createDefaultTemplate = (): AttributeTemplate => ({
  id: 'default',
  name: 'Default Style',
  description: 'Default styling for all attributes',
  isDefault: true,
  fontSize: 12,
  color: '#ffffff',
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
})

export const useAttributeTemplateStore = create<AttributeTemplateStore>((set, get) => ({
  // Initial state with default template
  attributeTemplates: [createDefaultTemplate()],

  // Operations
  addAttributeTemplate: (template) => {
    set((state) => ({
      attributeTemplates: [...state.attributeTemplates, template],
    }))
  },

  updateAttributeTemplate: (id, updates) => {
    set((state) => ({
      attributeTemplates: state.attributeTemplates.map((template) =>
        template.id === id ? { ...template, ...updates } : template
      ),
    }))
  },

  removeAttributeTemplate: (id) => {
    // Prevent removing the default template
    const template = get().getAttributeTemplate(id)
    if (template?.isDefault) {
      console.warn('Cannot remove default template')
      return
    }

    set((state) => ({
      attributeTemplates: state.attributeTemplates.filter((template) => template.id !== id),
    }))
  },

  setDefaultTemplate: (id) => {
    set((state) => ({
      attributeTemplates: state.attributeTemplates.map((template) => ({
        ...template,
        isDefault: template.id === id,
      })),
    }))
  },

  importAttributeTemplates: (templates, merge = false) => {
    if (merge) {
      // Merge with existing templates (avoid duplicates by ID)
      set((state) => {
        const existingIds = new Set(state.attributeTemplates.map((t) => t.id))
        const newTemplates = templates.filter((t) => !existingIds.has(t.id))
        return {
          attributeTemplates: [...state.attributeTemplates, ...newTemplates],
        }
      })
    } else {
      // Replace all templates (but keep default if not provided)
      const hasDefault = templates.some((t) => t.isDefault)
      const defaultTemplate = hasDefault ? [] : [createDefaultTemplate()]
      set({ attributeTemplates: [...defaultTemplate, ...templates] })
    }
  },

  exportAttributeTemplates: () => {
    return get().attributeTemplates
  },

  // Queries
  getAttributeTemplate: (id) => {
    return get().attributeTemplates.find((template) => template.id === id)
  },

  getDefaultTemplate: () => {
    return get().attributeTemplates.find((template) => template.isDefault) || get().attributeTemplates[0]
  },
}))
