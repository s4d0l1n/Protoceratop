/**
 * Multi-value parser for CSV cells
 * Handles JSON arrays, delimited strings, and complex formats
 */

/**
 * Parse a cell value that may contain multiple values
 * @param value - Raw cell value from CSV
 * @returns Array of parsed values
 */
export function parseMultiValue(value: string): string[] {
  if (!value || value.trim() === '') {
    return []
  }

  const trimmed = value.trim()

  // Try parsing as JSON array first
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v).trim()).filter(Boolean)
      }
    } catch {
      // Fall through to delimiter parsing
    }
  }

  // Detect delimiter (comma, semicolon, pipe, newline)
  const delimiters = [',', ';', '|', '\n']
  let bestDelimiter = ','
  let maxSplits = 0

  for (const delimiter of delimiters) {
    const splits = trimmed.split(delimiter).length - 1
    if (splits > maxSplits) {
      maxSplits = splits
      bestDelimiter = delimiter
    }
  }

  // Split by best delimiter
  const parts = trimmed.split(bestDelimiter).map((part) => {
    // Strip surrounding brackets and quotes
    return part
      .trim()
      .replace(/^\[|\]$/g, '')
      .replace(/^["']|["']$/g, '')
      .trim()
  })

  // Deduplicate case-insensitively while preserving original case
  const seen = new Map<string, string>()
  for (const part of parts) {
    if (part && !seen.has(part.toLowerCase())) {
      seen.set(part.toLowerCase(), part)
    }
  }

  return Array.from(seen.values())
}

/**
 * Check if a value looks like it contains multiple values
 * @param value - Cell value to check
 * @returns True if value appears to be multi-valued
 */
export function isMultiValue(value: string): boolean {
  if (!value) return false

  const trimmed = value.trim()

  // Check for JSON array
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return true
  }

  // Check for common delimiters
  return /[,;|\n]/.test(trimmed)
}
