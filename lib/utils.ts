import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function for merging Tailwind CSS class names.
 * Combines clsx for conditional classes and tailwind-merge for deduplication.
 *
 * This function intelligently merges Tailwind classes, resolving conflicts
 * (e.g., if both 'px-2' and 'px-4' are provided, only 'px-4' will be applied).
 *
 * @param {...ClassValue[]} inputs - Class names, objects, or arrays to merge
 * @returns {string} Merged and deduplicated class string
 *
 * @example
 * // Basic usage
 * cn('px-2 py-1', 'px-4') // Returns: 'py-1 px-4'
 *
 * @example
 * // Conditional classes
 * cn('base-class', { 'active-class': isActive, 'disabled-class': isDisabled })
 *
 * @example
 * // With arrays
 * cn(['class1', 'class2'], 'class3')
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
