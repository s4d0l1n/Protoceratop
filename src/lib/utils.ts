import { type ClassValue, clsx } from 'clsx'

/**
 * Utility function to merge Tailwind CSS classes
 * @param inputs - Class names to merge
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}

/**
 * Generate a unique ID
 * @returns Unique identifier string
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Safely parse JSON with fallback
 * @param jsonString - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback
 */
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T
  } catch {
    return fallback
  }
}

/**
 * Format bytes to human-readable string
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
