import { useState } from 'react'
import { X, ChevronDown, ChevronRight } from 'lucide-react'
import type { FontTemplate } from '@/types'

interface FontTemplateEditorProps {
  /** Template being edited (null for new) */
  template: FontTemplate | null
  /** Close editor */
  onClose: () => void
  /** Save callback */
  onSave: (template: FontTemplate) => void
}

const FONT_FAMILIES = [
  'sans-serif',
  'serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Verdana',
  'Tahoma',
  'Comic Sans MS',
]

/**
 * Font template editor component
 * CRUD interface for creating/editing font/text templates
 */
export function FontTemplateEditor({ template, onClose, onSave }: FontTemplateEditorProps) {
  // Basic properties
  const [name, setName] = useState(template?.name || '')
  const [description, setDescription] = useState(template?.description || '')
  const [fontFamily, setFontFamily] = useState(template?.fontFamily || 'sans-serif')
  const [fontSize, setFontSize] = useState(template?.fontSize || 1)
  const [fontWeight, setFontWeight] = useState<'normal' | 'bold' | 'lighter' | 'bolder'>(template?.fontWeight || 'normal')
  const [fontStyle, setFontStyle] = useState<'normal' | 'italic' | 'oblique'>(template?.fontStyle || 'normal')
  const [color, setColor] = useState(template?.color || '#ffffff')
  const [backgroundColor, setBackgroundColor] = useState(template?.backgroundColor || '')
  const [textDecoration, setTextDecoration] = useState<'none' | 'underline' | 'line-through' | 'overline'>(template?.textDecoration || 'none')
  const [textTransform, setTextTransform] = useState<'none' | 'uppercase' | 'lowercase' | 'capitalize'>(template?.textTransform || 'none')

  // Text shadow
  const [shadowEnabled, setShadowEnabled] = useState(template?.textShadow?.enabled || false)
  const [shadowColor, setShadowColor] = useState(template?.textShadow?.color || '#000000')
  const [shadowBlur, setShadowBlur] = useState(template?.textShadow?.blur || 2)
  const [shadowOffsetX, setShadowOffsetX] = useState(template?.textShadow?.offsetX || 1)
  const [shadowOffsetY, setShadowOffsetY] = useState(template?.textShadow?.offsetY || 1)

  // Effects
  const [glowEnabled, setGlowEnabled] = useState(template?.effects?.glow?.enabled || false)
  const [glowColor, setGlowColor] = useState(template?.effects?.glow?.color || '#06b6d4')
  const [glowIntensity, setGlowIntensity] = useState(template?.effects?.glow?.intensity || 1)

  const [gradientEnabled, setGradientEnabled] = useState(template?.effects?.gradient?.enabled || false)
  const [gradientStartColor, setGradientStartColor] = useState(template?.effects?.gradient?.startColor || '#06b6d4')
  const [gradientEndColor, setGradientEndColor] = useState(template?.effects?.gradient?.endColor || '#8b5cf6')
  const [gradientDirection, setGradientDirection] = useState<'horizontal' | 'vertical'>(template?.effects?.gradient?.direction || 'horizontal')

  // Expandable sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']))

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const handleSave = () => {
    if (!name.trim()) {
      return
    }

    const newTemplate: FontTemplate = {
      id: template?.id || `font-template-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      fontFamily,
      fontSize,
      fontWeight,
      fontStyle,
      color,
      backgroundColor: backgroundColor || undefined,
      textDecoration,
      textTransform,
      textShadow: shadowEnabled ? {
        enabled: true,
        color: shadowColor,
        blur: shadowBlur,
        offsetX: shadowOffsetX,
        offsetY: shadowOffsetY,
      } : undefined,
      effects: {
        glow: glowEnabled ? {
          enabled: true,
          color: glowColor,
          intensity: glowIntensity,
        } : undefined,
        gradient: gradientEnabled ? {
          enabled: true,
          startColor: gradientStartColor,
          endColor: gradientEndColor,
          direction: gradientDirection,
        } : undefined,
      },
      isDefault: template?.isDefault || false,
      createdAt: template?.createdAt || Date.now(),
    }

    onSave(newTemplate)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-secondary rounded-lg border border-dark max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark">
          <h2 className="text-xl font-bold text-slate-100">
            {template ? 'Edit' : 'Create'} Font Template
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-dark transition-colors text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Basic Info */}
          <section>
            <button
              onClick={() => toggleSection('basic')}
              className="flex items-center gap-2 w-full mb-3"
            >
              {expandedSections.has('basic') ? (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-slate-400" />
              )}
              <h3 className="text-lg font-semibold text-slate-100">Basic Info</h3>
            </button>

            {expandedSections.has('basic') && (
              <div className="space-y-3 pl-7">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Heading Style, Highlight Text"
                    className="w-full px-3 py-2 bg-dark border border-dark rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description..."
                    rows={2}
                    className="w-full px-3 py-2 bg-dark border border-dark rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyber-500"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Live Preview */}
          <section>
            <button
              onClick={() => toggleSection('preview')}
              className="flex items-center gap-2 w-full mb-3"
            >
              {expandedSections.has('preview') ? (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-slate-400" />
              )}
              <h3 className="text-lg font-semibold text-slate-100">Live Preview</h3>
            </button>

            {expandedSections.has('preview') && (
              <div className="pl-7">
                <div className="p-6 bg-dark border border-dark rounded-lg flex items-center justify-center">
                  <div
                    style={{
                      fontFamily: fontFamily,
                      fontSize: `${fontSize * 1.5}rem`,
                      fontWeight: fontWeight,
                      fontStyle: fontStyle,
                      color: gradientEnabled
                        ? 'transparent'
                        : color,
                      backgroundColor: backgroundColor || 'transparent',
                      textDecoration: textDecoration,
                      textTransform: textTransform,
                      textShadow: shadowEnabled
                        ? `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${shadowColor}`
                        : 'none',
                      filter: glowEnabled
                        ? `drop-shadow(0 0 ${glowIntensity * 10}px ${glowColor})`
                        : 'none',
                      backgroundImage: gradientEnabled
                        ? `linear-gradient(${gradientDirection === 'horizontal' ? 'to right' : 'to bottom'}, ${gradientStartColor}, ${gradientEndColor})`
                        : 'none',
                      backgroundClip: gradientEnabled ? 'text' : 'border-box',
                      WebkitBackgroundClip: gradientEnabled ? 'text' : 'border-box',
                      WebkitTextFillColor: gradientEnabled ? 'transparent' : 'inherit',
                      padding: backgroundColor ? '0.5rem 1rem' : '0',
                      borderRadius: backgroundColor ? '0.375rem' : '0',
                      display: 'inline-block',
                    }}
                  >
                    Sample Text
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Preview updates in real-time as you change settings below
                </p>
              </div>
            )}
          </section>

          {/* Font Properties */}
          <section>
            <button
              onClick={() => toggleSection('font')}
              className="flex items-center gap-2 w-full mb-3"
            >
              {expandedSections.has('font') ? (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-slate-400" />
              )}
              <h3 className="text-lg font-semibold text-slate-100">Font Properties</h3>
            </button>

            {expandedSections.has('font') && (
              <div className="space-y-3 pl-7">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Font Family
                  </label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full px-3 py-2 bg-dark border border-dark rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyber-500"
                  >
                    {FONT_FAMILIES.map((font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Font Size: {fontSize.toFixed(2)}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Font Weight
                    </label>
                    <select
                      value={fontWeight}
                      onChange={(e) => setFontWeight(e.target.value as any)}
                      className="w-full px-3 py-2 bg-dark border border-dark rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyber-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                      <option value="lighter">Lighter</option>
                      <option value="bolder">Bolder</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Font Style
                  </label>
                  <div className="flex gap-2">
                    {(['normal', 'italic', 'oblique'] as const).map((style) => (
                      <button
                        key={style}
                        onClick={() => setFontStyle(style)}
                        className={`px-4 py-2 rounded transition-colors ${
                          fontStyle === style
                            ? 'bg-cyber-500 text-white'
                            : 'bg-dark text-slate-300 hover:bg-dark-tertiary'
                        }`}
                      >
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Colors */}
          <section>
            <button
              onClick={() => toggleSection('colors')}
              className="flex items-center gap-2 w-full mb-3"
            >
              {expandedSections.has('colors') ? (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-slate-400" />
              )}
              <h3 className="text-lg font-semibold text-slate-100">Colors</h3>
            </button>

            {expandedSections.has('colors') && (
              <div className="space-y-3 pl-7">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Text Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="flex-1 px-3 py-2 bg-dark border border-dark rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Background Color (Highlight)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={backgroundColor || '#000000'}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      placeholder="Optional (leave empty for none)"
                      className="flex-1 px-3 py-2 bg-dark border border-dark rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyber-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Text Styling */}
          <section>
            <button
              onClick={() => toggleSection('styling')}
              className="flex items-center gap-2 w-full mb-3"
            >
              {expandedSections.has('styling') ? (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-slate-400" />
              )}
              <h3 className="text-lg font-semibold text-slate-100">Text Styling</h3>
            </button>

            {expandedSections.has('styling') && (
              <div className="space-y-3 pl-7">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Text Decoration
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['none', 'underline', 'line-through', 'overline'] as const).map((decoration) => (
                      <button
                        key={decoration}
                        onClick={() => setTextDecoration(decoration)}
                        className={`px-4 py-2 rounded transition-colors ${
                          textDecoration === decoration
                            ? 'bg-cyber-500 text-white'
                            : 'bg-dark text-slate-300 hover:bg-dark-tertiary'
                        }`}
                      >
                        {decoration === 'none' ? 'None' : decoration.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Text Transform
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['none', 'uppercase', 'lowercase', 'capitalize'] as const).map((transform) => (
                      <button
                        key={transform}
                        onClick={() => setTextTransform(transform)}
                        className={`px-4 py-2 rounded transition-colors ${
                          textTransform === transform
                            ? 'bg-cyber-500 text-white'
                            : 'bg-dark text-slate-300 hover:bg-dark-tertiary'
                        }`}
                      >
                        {transform.charAt(0).toUpperCase() + transform.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Effects */}
          <section>
            <button
              onClick={() => toggleSection('effects')}
              className="flex items-center gap-2 w-full mb-3"
            >
              {expandedSections.has('effects') ? (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-slate-400" />
              )}
              <h3 className="text-lg font-semibold text-slate-100">Effects</h3>
            </button>

            {expandedSections.has('effects') && (
              <div className="space-y-3 pl-7">
                {/* Text Shadow */}
                <div className="p-3 bg-dark border border-dark rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shadowEnabled}
                      onChange={(e) => setShadowEnabled(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm font-medium text-slate-300">Text Shadow</span>
                  </label>

                  {shadowEnabled && (
                    <div className="mt-3 space-y-2">
                      <div className="flex gap-2 items-center">
                        <label className="text-xs text-slate-400 w-20">Color:</label>
                        <input
                          type="color"
                          value={shadowColor}
                          onChange={(e) => setShadowColor(e.target.value)}
                          className="w-10 h-8 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={shadowColor}
                          onChange={(e) => setShadowColor(e.target.value)}
                          className="flex-1 px-2 py-1 bg-dark-secondary border border-dark rounded text-xs text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400">Blur: {shadowBlur}px</label>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={shadowBlur}
                          onChange={(e) => setShadowBlur(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-slate-400">Offset X: {shadowOffsetX}px</label>
                          <input
                            type="range"
                            min="-10"
                            max="10"
                            value={shadowOffsetX}
                            onChange={(e) => setShadowOffsetX(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400">Offset Y: {shadowOffsetY}px</label>
                          <input
                            type="range"
                            min="-10"
                            max="10"
                            value={shadowOffsetY}
                            onChange={(e) => setShadowOffsetY(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Glow Effect */}
                <div className="p-3 bg-dark border border-dark rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={glowEnabled}
                      onChange={(e) => setGlowEnabled(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm font-medium text-slate-300">Glow Effect</span>
                  </label>

                  {glowEnabled && (
                    <div className="mt-3 space-y-2">
                      <div className="flex gap-2 items-center">
                        <label className="text-xs text-slate-400 w-20">Color:</label>
                        <input
                          type="color"
                          value={glowColor}
                          onChange={(e) => setGlowColor(e.target.value)}
                          className="w-10 h-8 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={glowColor}
                          onChange={(e) => setGlowColor(e.target.value)}
                          className="flex-1 px-2 py-1 bg-dark-secondary border border-dark rounded text-xs text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400">Intensity: {glowIntensity.toFixed(1)}x</label>
                        <input
                          type="range"
                          min="0.5"
                          max="5"
                          step="0.1"
                          value={glowIntensity}
                          onChange={(e) => setGlowIntensity(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Gradient Effect */}
                <div className="p-3 bg-dark border border-dark rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gradientEnabled}
                      onChange={(e) => setGradientEnabled(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm font-medium text-slate-300">Gradient Text</span>
                  </label>

                  {gradientEnabled && (
                    <div className="mt-3 space-y-2">
                      <div className="flex gap-2 items-center">
                        <label className="text-xs text-slate-400 w-20">Start:</label>
                        <input
                          type="color"
                          value={gradientStartColor}
                          onChange={(e) => setGradientStartColor(e.target.value)}
                          className="w-10 h-8 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={gradientStartColor}
                          onChange={(e) => setGradientStartColor(e.target.value)}
                          className="flex-1 px-2 py-1 bg-dark-secondary border border-dark rounded text-xs text-slate-100"
                        />
                      </div>
                      <div className="flex gap-2 items-center">
                        <label className="text-xs text-slate-400 w-20">End:</label>
                        <input
                          type="color"
                          value={gradientEndColor}
                          onChange={(e) => setGradientEndColor(e.target.value)}
                          className="w-10 h-8 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={gradientEndColor}
                          onChange={(e) => setGradientEndColor(e.target.value)}
                          className="flex-1 px-2 py-1 bg-dark-secondary border border-dark rounded text-xs text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Direction:</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setGradientDirection('horizontal')}
                            className={`flex-1 px-3 py-1 rounded text-xs transition-colors ${
                              gradientDirection === 'horizontal'
                                ? 'bg-cyber-500 text-white'
                                : 'bg-dark-secondary text-slate-400 hover:bg-dark-tertiary'
                            }`}
                          >
                            Horizontal
                          </button>
                          <button
                            onClick={() => setGradientDirection('vertical')}
                            className={`flex-1 px-3 py-1 rounded text-xs transition-colors ${
                              gradientDirection === 'vertical'
                                ? 'bg-cyber-500 text-white'
                                : 'bg-dark-secondary text-slate-400 hover:bg-dark-tertiary'
                            }`}
                          >
                            Vertical
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Preview */}
          <section>
            <h3 className="text-lg font-semibold text-slate-100 mb-3">Preview</h3>
            <div className="p-6 bg-dark border border-dark rounded-lg flex items-center justify-center">
              <div
                style={{
                  fontFamily,
                  fontSize: `${fontSize}rem`,
                  fontWeight,
                  fontStyle,
                  color,
                  backgroundColor: backgroundColor || 'transparent',
                  textDecoration,
                  textTransform,
                  textShadow: shadowEnabled
                    ? `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${shadowColor}`
                    : 'none',
                  padding: backgroundColor ? '0.25rem 0.5rem' : '0',
                  borderRadius: backgroundColor ? '0.25rem' : '0',
                }}
              >
                Sample Text
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-dark">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-dark text-slate-300 hover:bg-dark-tertiary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-2 rounded-lg bg-cyber-500 text-white hover:bg-cyber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {template ? 'Update' : 'Create'} Template
          </button>
        </div>
      </div>
    </div>
  )
}
