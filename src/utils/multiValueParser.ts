/**
 * Multi-Value Parser
 * Handles intelligent splitting of CSV cell values into arrays
 *
 * Logic:
 * 1. Try parsing as JSON array first
 * 2. If that fails, split on common delimiters
 * 3. Strip surrounding brackets if present
 * 4. Deduplicate values
 */

/**
 * Parse a cell value that may contain multiple values
 * Returns an array of strings
 */
export function parseMultiValue(value: string | null | undefined): string[] {
  // Handle empty/null values
  if (!value || value.trim() === '') {
    return []
  }

  const trimmed = value.trim()

  // Step 1: Try parsing as JSON array
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return deduplicateAndClean(parsed.map((v) => String(v)))
      }
    } catch {
      // If JSON parse fails, continue with delimiter splitting
      // But first strip the brackets
      const withoutBrackets = trimmed.slice(1, -1).trim()
      if (withoutBrackets) {
        return splitByDelimiters(withoutBrackets)
      }
    }
  }

  // Step 2: Split by common delimiters
  return splitByDelimiters(trimmed)
}

/**
 * Split a string by common delimiters: , ; | \n
 */
function splitByDelimiters(value: string): string[] {
  // Try multiple delimiters and use the one that produces the most splits
  const delimiters = [',', ';', '|', '\n']

  let bestSplit: string[] = [value]
  let maxSplits = 0

  for (const delimiter of delimiters) {
    if (value.includes(delimiter)) {
      const parts = value.split(delimiter).map((part) => part.trim())
      if (parts.length > maxSplits) {
        maxSplits = parts.length
        bestSplit = parts
      }
    }
  }

  return deduplicateAndClean(bestSplit)
}

/**
 * Clean, deduplicate, and filter empty values
 */
function deduplicateAndClean(values: string[]): string[] {
  const cleaned = values
    .map((v) => v.trim())
    .filter((v) => v.length > 0)

  // Deduplicate (case-insensitive comparison, but keep original case)
  const seen = new Set<string>()
  const unique: string[] = []

  for (const value of cleaned) {
    const lowerValue = value.toLowerCase()
    if (!seen.has(lowerValue)) {
      seen.add(lowerValue)
      unique.push(value)
    }
  }

  return unique
}

/**
 * Check if a value should be treated as multi-value
 */
export function isMultiValue(value: string | null | undefined): boolean {
  if (!value) return false

  const trimmed = value.trim()

  // Check for JSON array
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return true
  }

  // Check for delimiters
  const delimiters = [',', ';', '|', '\n']
  return delimiters.some((delimiter) => trimmed.includes(delimiter))
}

/**
 * Convert a value to string, string array, or object based on content
 * Handles JSON objects and arrays intelligently
 */
export function parseAttributeValue(
  value: string | null | undefined
): string | string[] | Record<string, any> {
  if (!value || value.trim() === '') {
    return ''
  }

  const trimmed = value.trim()

  // Try to parse as JSON first (handles both objects and arrays)
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      const parsed = JSON.parse(trimmed)
      // If it's an object (key-value pairs), return it as-is
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, any>
      }
      // If it's an array, process it
      if (Array.isArray(parsed)) {
        const cleaned = parsed.map((v) => String(v)).filter((v) => v.length > 0)
        if (cleaned.length === 1) {
          return cleaned[0]!
        }
        return cleaned
      }
    } catch {
      // Not valid JSON, continue with normal parsing
    }
  }

  // Fall back to multi-value parsing
  const parsed = parseMultiValue(value)

  // Return single value as string, multiple values as array
  if (parsed.length === 0) {
    return ''
  } else if (parsed.length === 1) {
    return parsed[0]!
  } else {
    return parsed
  }
}
