/**
 * Icon Picker Component
 * Displays available icons from the Tabler Icons library for selection
 */

import { useState } from 'react'
import {
  AVAILABLE_ICONS,
  ICON_CATEGORIES,
  getIconsByCategory,
  searchIcons,
  type IconDefinition,
  type IconCategory,
} from '../utils/iconLibrary'

interface IconPickerProps {
  onSelect: (iconPath: string) => void
  onClose: () => void
  currentIcon?: string
}

export function IconPicker({ onSelect, onClose, currentIcon }: IconPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<IconCategory | 'All'>('All')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter icons based on category and search
  const filteredIcons = (() => {
    if (searchQuery) {
      return searchIcons(searchQuery)
    }
    if (selectedCategory === 'All') {
      return AVAILABLE_ICONS
    }
    return getIconsByCategory(selectedCategory)
  })()

  const handleSelectIcon = (icon: IconDefinition) => {
    onSelect(icon.path)
    onClose()
  }

  const handleClearIcon = () => {
    onSelect('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">Select Icon</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search icons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
          />
        </div>

        {/* Category tabs */}
        <div className="px-4 pt-3 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <div className="flex gap-2 pb-3">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1 rounded text-sm whitespace-nowrap ${
                selectedCategory === 'All'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All ({AVAILABLE_ICONS.length})
            </button>
            {ICON_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded text-sm whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {category} ({getIconsByCategory(category).length})
              </button>
            ))}
          </div>
        </div>

        {/* Icon grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-6 gap-3">
            {filteredIcons.map((icon) => (
              <button
                key={icon.path}
                onClick={() => handleSelectIcon(icon)}
                className={`p-3 rounded-lg border-2 transition-all hover:scale-105 flex flex-col items-center gap-2 ${
                  currentIcon === icon.path
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500'
                }`}
                title={icon.description}
              >
                <img src={icon.path} alt={icon.name} className="w-8 h-8" />
                <span className="text-xs text-center line-clamp-2">{icon.name}</span>
              </button>
            ))}
          </div>

          {filteredIcons.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              No icons found matching &quot;{searchQuery}&quot;
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Icons from <a href="https://tabler.io/icons" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Tabler Icons</a> (MIT License)
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClearIcon}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-sm"
            >
              Clear Icon
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
