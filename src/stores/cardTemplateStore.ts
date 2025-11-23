/**
 * Card Template Store - Manages card templates for node display
 */

import { create } from 'zustand'
import type { CardTemplate } from '../types'

interface CardTemplateStore {
  // State
  cardTemplates: CardTemplate[]

  // Operations
  addCardTemplate: (template: CardTemplate) => void
  updateCardTemplate: (id: string, updates: Partial<CardTemplate>) => void
  removeCardTemplate: (id: string) => void
  setDefaultTemplate: (id: string) => void
  importCardTemplates: (templates: CardTemplate[], merge?: boolean) => void
  exportCardTemplates: () => CardTemplate[]

  // Queries
  getCardTemplate: (id: string) => CardTemplate | undefined
  getDefaultTemplate: () => CardTemplate | undefined
}

// Create a basic default template
const createDefaultTemplate = (): CardTemplate => ({
  id: 'default',
  name: 'Default Template',
  description: 'Default card template for all nodes',
  attributeDisplays: [],
  textStyle: {},
  layout: {
    maxWidth: 240,
    lineHeight: 1.2,
    padding: 4,
    showLabels: false,
    separator: '\n',
    textAlign: 'center',
  },
  mergeMode: 'replace',
  isDefault: true,
})

export const useCardTemplateStore = create<CardTemplateStore>((set, get) => ({
  // Initial state with default template
  cardTemplates: [createDefaultTemplate()],

  // Operations
  addCardTemplate: (template) => {
    set((state) => ({
      cardTemplates: [...state.cardTemplates, template],
    }))
  },

  updateCardTemplate: (id, updates) => {
    set((state) => ({
      cardTemplates: state.cardTemplates.map((template) =>
        template.id === id ? { ...template, ...updates } : template
      ),
    }))
  },

  removeCardTemplate: (id) => {
    // Prevent removing the default template
    const template = get().getCardTemplate(id)
    if (template?.isDefault) {
      console.warn('Cannot remove default template')
      return
    }

    set((state) => ({
      cardTemplates: state.cardTemplates.filter((template) => template.id !== id),
    }))
  },

  setDefaultTemplate: (id) => {
    set((state) => ({
      cardTemplates: state.cardTemplates.map((template) => ({
        ...template,
        isDefault: template.id === id,
      })),
    }))
  },

  importCardTemplates: (templates, merge = false) => {
    if (merge) {
      // Merge with existing templates (avoid duplicates by ID)
      set((state) => {
        const existingIds = new Set(state.cardTemplates.map((t) => t.id))
        const newTemplates = templates.filter((t) => !existingIds.has(t.id))
        return {
          cardTemplates: [...state.cardTemplates, ...newTemplates],
        }
      })
    } else {
      // Replace all templates (but keep default if not provided)
      const hasDefault = templates.some((t) => t.isDefault)
      const defaultTemplate = hasDefault ? [] : [createDefaultTemplate()]
      set({ cardTemplates: [...defaultTemplate, ...templates] })
    }
  },

  exportCardTemplates: () => {
    return get().cardTemplates
  },

  // Queries
  getCardTemplate: (id) => {
    return get().cardTemplates.find((template) => template.id === id)
  },

  getDefaultTemplate: () => {
    return get().cardTemplates.find((template) => template.isDefault) || get().cardTemplates[0]
  },
}))
