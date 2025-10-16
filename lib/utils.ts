/**
 * @fileoverview Utility functions for common operations.
 * Currently provides className merging for Tailwind CSS.
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind CSS class names intelligently, handling conflicts.
 * Combines clsx for conditional classes with tailwind-merge for deduplication.
 * 
 * @param {...ClassValue[]} inputs - Class names, objects, or arrays to merge
 * @returns {string} Merged and deduplicated class string
 * 
 * @example
 * ```tsx
 * // Basic usage
 * cn('px-2 py-1', 'px-4') // => 'py-1 px-4' (px-4 overrides px-2)
 * 
 * // Conditional classes
 * cn('base-class', isActive && 'active-class', { 'error': hasError })
 * 
 * // In components
 * <div className={cn('default-styles', className)} />
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
