/**
 * Core data model types for Protoceratop
 * All types are designed for multi-value support and flexible attribute handling
 */

// ============================================================================
// NODE AND EDGE DATA MODELS
// ============================================================================

/**
 * Node data structure - supports multi-value attributes and tags
 */
export interface NodeData {
  /** Unique identifier for the node */
  id: string
  /** Display label (defaults to id if not provided) */
  label?: string
  /** Dynamic attributes - can be string, array, or object (for JSON data) */
  attributes: Record<string, string | string[] | Record<string, any>>
  /** Tags for categorization and filtering (applied via style rules) */
  tags: string[]
  /** Indicates if this is a stub node (auto-created from links) */
  isStub?: boolean
  /** Source CSV filename(s) this node came from */
  _sources?: string[]
  /** Timestamp for timeline positioning (Unix timestamp in milliseconds) */
  timestamp?: number
}

/**
 * Edge data structure - connects two nodes
 */
export interface EdgeData {
  /** Unique edge identifier (auto-generated) */
  id?: string
  /** Source node ID */
  source: string
  /** Target node ID */
  target: string
  /** Source column name (for link mapping) */
  sourceColumn?: string
  /** Target column name (for link mapping) */
  targetColumn?: string
  /** Edge label (optional) */
  label?: string
}

// ============================================================================
// CSV IMPORT AND MAPPING
// ============================================================================

/**
 * Column role types for CSV mapping wizard
 * Note: Tags and labels are now applied via conditional formatting, not column mapping
 */
export type ColumnRole =
  | 'node_id'           // Unique identifier column (primary label)
  | 'attribute'         // Generic attribute column (default name = column name)
  | 'link_to_column'    // Links to other nodes via column value matching
  | 'timestamp'         // Timestamp for timeline positioning
  | 'ignore'            // Skip this column

/**
 * Column mapping configuration
 */
export interface ColumnMapping {
  /** Original column name from CSV */
  columnName: string
  /** Assigned role */
  role: ColumnRole
  /** For 'attribute' role: the attribute name to use */
  attributeName?: string
  /** For 'link_to_column': target column name to match against */
  linkTargetColumn?: string
}

/**
 * CSV file metadata and mapping
 */
export interface CSVFile {
  /** Original filename */
  name: string
  /** Raw CSV content (for save/load) */
  rawData: string
  /** Column mapping configuration */
  mapping: ColumnMapping[]
  /** Parsed rows count */
  rowCount?: number
  /** Upload timestamp */
  uploadedAt?: string
}

// ============================================================================
// STYLE RULES
// ============================================================================

/**
 * Condition operators for style rules
 */
export type StyleConditionOperator =
  | 'equals'              // Exact match
  | 'not_equals'          // Not equal
  | 'contains'            // Contains substring
  | 'regex_match'         // Matches regex pattern
  | 'regex_no_match'      // Does not match regex
  | 'exists'              // Attribute exists
  | 'empty'               // Attribute is empty or doesn't exist

/**
 * Target types for style rules
 */
export type StyleRuleTarget = 'nodes' | 'edges' | 'attributes'

/**
 * Node shapes supported by Cytoscape
 */
export type NodeShape =
  | 'ellipse'
  | 'triangle'
  | 'rectangle'
  | 'roundrectangle'
  | 'bottomroundrectangle'
  | 'cutrectangle'
  | 'barrel'
  | 'rhomboid'
  | 'diamond'
  | 'pentagon'
  | 'hexagon'
  | 'heptagon'
  | 'octagon'
  | 'star'
  | 'tag'
  | 'vee'

/**
 * Style properties - ONLY template assignments, no inline styling
 * Templates define all visual styling. Style rules only assign templates.
 */
export interface StyleProperties {
  /** Card template ID to apply (for nodes) */
  cardTemplateId?: string
  /** Attribute template ID to apply to a specific attribute */
  attributeTemplateId?: string
  /** Attribute name to target (when using attributeTemplateId) */
  targetAttribute?: string
  /** Edge template ID to apply (for edges) */
  edgeTemplateId?: string
  /** Tag to apply when condition matches (organizational) */
  applyTag?: string
  /** Group label - creates a visual group box (organizational) */
  groupLabel?: string
}

/**
 * Style rule definition
 */
export interface StyleRule {
  /** Unique identifier */
  id: string
  /** Human-readable name */
  name: string
  /** Enabled state */
  enabled: boolean
  /** Attribute to test (or 'any' for existence checks) */
  attribute: string
  /** Condition operator */
  operator: StyleConditionOperator
  /** Value to compare against (for operators that need it) */
  value?: string
  /** Apply to nodes, edges, or both */
  target: StyleRuleTarget
  /** Style properties to apply when condition matches */
  style: StyleProperties
  /** Order/priority (lower numbers = higher priority) */
  order: number
}

// ============================================================================
// ATTRIBUTE TEMPLATES
// ============================================================================

/**
 * Reusable styling template for attributes
 * Can be applied to any attribute in any card template
 */
export interface AttributeTemplate {
  /** Unique identifier */
  id: string
  /** Template name */
  name: string
  /** Template description */
  description?: string
  /** Is this the default template for all attributes */
  isDefault?: boolean
  /** Prefix to add before label */
  labelPrefix?: string
  /** Suffix to add after label */
  labelSuffix?: string
  /** Font size in px */
  fontSize?: number
  /** Font family */
  fontFamily?: string
  /** Text color */
  color?: string
  /** Font weight */
  fontWeight?: 'normal' | 'bold'
  /** Font style */
  fontStyle?: 'normal' | 'italic'
  /** Text decoration */
  textDecoration?: 'none' | 'underline' | 'line-through'
  /** Text shadow / glow effect */
  textShadow?: string
  /** Text outline width */
  textOutlineWidth?: number
  /** Text outline color */
  textOutlineColor?: string
  /** Background color for this attribute */
  backgroundColor?: string
  /** Background padding */
  backgroundPadding?: number
  /** Background border radius */
  borderRadius?: number
}

// ============================================================================
// EDGE TEMPLATES
// ============================================================================

/**
 * Reusable styling template for edges/lines
 */
export interface EdgeTemplate {
  /** Unique identifier */
  id: string
  /** Template name */
  name: string
  /** Template description */
  description?: string
  /** Is this the default template for all edges */
  isDefault?: boolean
  /** Line color */
  lineColor?: string
  /** Line width in pixels */
  lineWidth?: number
  /** Line style */
  lineStyle?: 'solid' | 'dotted' | 'dashed'
  /** Arrow shape */
  arrowShape?: 'triangle' | 'triangle-tee' | 'circle-triangle' | 'triangle-cross' | 'chevron' | 'none'
  /** Opacity (0-1) */
  opacity?: number
  /** Edge label */
  label?: string
  /** Label font size */
  labelFontSize?: number
  /** Label color */
  labelColor?: string
  /** Label background color */
  labelBackgroundColor?: string
}

// ============================================================================
// CARD TEMPLATES
// ============================================================================

/**
 * How an attribute should be displayed on a node
 */
export interface AttributeDisplay {
  /** Attribute name or pattern (use '__id__' for node ID) */
  attribute: string
  /** Custom display label (if different from attribute name) */
  displayLabel?: string
  /** Show this attribute */
  visible: boolean
  /** Display order */
  order: number
  /** Attribute template ID to use for styling */
  attributeTemplateId?: string
  /** Override specific properties from the attribute template */
  overrides?: {
    labelPrefix?: string
    labelSuffix?: string
    fontSize?: number
    fontFamily?: string
    color?: string
    fontWeight?: 'normal' | 'bold'
    fontStyle?: 'normal' | 'italic'
    textDecoration?: 'none' | 'underline' | 'line-through'
    textShadow?: string
    textOutlineWidth?: number
    textOutlineColor?: string
    backgroundColor?: string
    backgroundPadding?: number
    borderRadius?: number
  }
}

/**
 * Default text styling for card template
 * Applied to all attributes on the card (can be overridden per-attribute)
 */
export interface CardTextStyle {
  /** Font size in px */
  fontSize?: number
  /** Font family */
  fontFamily?: string
  /** Text color */
  color?: string
  /** Font weight */
  fontWeight?: 'normal' | 'bold'
  /** Font style */
  fontStyle?: 'normal' | 'italic'
  /** Text decoration */
  textDecoration?: 'none' | 'underline' | 'line-through'
  /** Text shadow / glow effect */
  textShadow?: string
  /** Text outline width */
  textOutlineWidth?: number
  /** Text outline color */
  textOutlineColor?: string
}

/**
 * Layout settings for card template
 */
export interface CardLayoutSettings {
  /** Maximum width of text on node */
  maxWidth?: number
  /** Line height multiplier */
  lineHeight?: number
  /** Padding around content */
  padding?: number
  /** Show attribute labels (name: value) or just values */
  showLabels?: boolean
  /** Separator between attributes */
  separator?: string
  /** Text alignment */
  textAlign?: 'left' | 'center' | 'right'
}

/**
 * Node visual styling within card template
 */
export interface NodeVisualStyle {
  /** Background/fill color */
  backgroundColor?: string
  /** Border color */
  borderColor?: string
  /** Border width in pixels */
  borderWidth?: number
  /** Node shape */
  shape?: NodeShape
  /** Size multiplier (e.g., 1.5 = 150%) */
  size?: number
  /** Icon emoji/unicode - replaces shape */
  icon?: string
  /** Custom image URL (data URL from uploaded PNG) - replaces shape */
  imageUrl?: string
  /** Icon color (for SVG icons) */
  iconColor?: string
  /** Opacity (0-1) */
  opacity?: number
}

/**
 * Card template definition - defines how a node appears
 */
export interface CardTemplate {
  /** Unique identifier */
  id: string
  /** Template name */
  name: string
  /** Template description */
  description?: string
  /** Node visual styling */
  nodeStyle?: NodeVisualStyle
  /** Default text styling for all attributes on this card */
  textStyle?: CardTextStyle
  /** Attribute displays */
  attributeDisplays: AttributeDisplay[]
  /** Layout settings */
  layout: CardLayoutSettings
  /** Merge mode: 'replace' or 'merge' */
  mergeMode: 'replace' | 'merge'
  /** Is this the default template */
  isDefault?: boolean
}

// ============================================================================
// GRAPH LAYOUT
// ============================================================================

/**
 * Supported layout algorithms
 */
export type LayoutType =
  | 'fcose'           // Fast Compound Spring Embedder (ideal for network topology)
  | 'dagre'           // Hierarchical DAG layout (ideal for internet mapping)
  | 'timeline'        // Timeline layout (positions nodes by timestamp on X-axis)
  | 'cose-bilkent'    // Force-directed (default)
  | 'cola'            // Constraint-based (avoids overlap)
  | 'breadthfirst'    // Hierarchical tree (avoids overlap)
  | 'concentric'      // Concentric circles (avoids overlap)
  | 'circle'          // Circular layout
  | 'grid'            // Grid layout (avoids overlap)
  | 'preset'          // Use saved positions

/**
 * Layout configuration
 */
export interface LayoutConfig {
  /** Layout algorithm */
  type: LayoutType
  /** Algorithm-specific options */
  options?: Record<string, unknown>
}

/**
 * Saved node positions (for preset layout)
 */
export interface NodePosition {
  /** Node ID */
  id: string
  /** X coordinate */
  x: number
  /** Y coordinate */
  y: number
}

// ============================================================================
// PROJECT STATE (for .protojson)
// ============================================================================

/**
 * Complete project state for save/load
 */
export interface ProjectState {
  /** Format version */
  version: string
  /** Project metadata */
  metadata?: {
    name?: string
    description?: string
    createdAt?: string
    modifiedAt?: string
  }
  /** Imported CSV files */
  csvFiles: CSVFile[]
  /** All nodes in the graph */
  nodes: NodeData[]
  /** All edges in the graph */
  edges: EdgeData[]
  /** Style rules */
  styleRules: StyleRule[]
  /** Attribute templates */
  attributeTemplates: AttributeTemplate[]
  /** Card templates */
  cardTemplates: CardTemplate[]
  /** Edge templates */
  edgeTemplates: EdgeTemplate[]
  /** Layout configuration */
  layoutConfig: LayoutConfig
  /** Saved node positions */
  nodePositions?: NodePosition[]
}

// ============================================================================
// UI STATE
// ============================================================================

/**
 * Selected node for detail panel
 */
export interface SelectedNode {
  /** Node ID */
  id: string
  /** Node data */
  data: NodeData
  /** Connected edge count */
  connectedEdges: number
}

/**
 * UI panel visibility state
 */
export interface UIPanelState {
  /** CSV upload wizard visible */
  uploadWizard: boolean
  /** Column mapping wizard visible */
  columnMapper: boolean
  /** Style rules panel visible */
  stylePanel: boolean
  /** Card template panel visible */
  cardTemplatePanel: boolean
  /** Attribute template panel visible */
  attributeTemplatePanel: boolean
  /** Edge template panel visible */
  edgeTemplatePanel: boolean
  /** Node detail panel visible */
  detailPanel: boolean
  /** Layout controls visible */
  layoutPanel: boolean
}

/**
 * Global UI state
 */
export interface UIState {
  /** Panel visibility */
  panels: UIPanelState
  /** Currently selected node */
  selectedNode: SelectedNode | null
  /** Dark mode enabled */
  darkMode: boolean
  /** Loading state */
  loading: boolean
  /** Error message (if any) */
  error: string | null
  /** Success message (if any) */
  success: string | null
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * CSV parsing result
 */
export interface ParsedCSV {
  /** Column headers */
  headers: string[]
  /** Parsed rows */
  rows: Record<string, string>[]
  /** Row count */
  rowCount: number
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Is valid */
  valid: boolean
  /** Error message (if invalid) */
  error?: string
}
