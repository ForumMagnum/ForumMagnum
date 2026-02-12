import type { SuggestionSummaryType } from '@/components/editor/lexicalPlugins/suggestions/SuggestionThreadController'
import type { BlockTypeChangeSuggestionProperties } from './Types'

/**
 * Centralized configuration for suggestion summary display text.
 * 
 * This is the single source of truth for how suggestion types are displayed to users.
 */
export const SuggestionSummaryText: Record<SuggestionSummaryType, string> = {
  // Basic text operations
  insert: 'Insert',
  delete: 'Delete',
  replace: 'Replace',
  
  // Paragraph operations
  split: 'Split Paragraph',
  join: 'Join Paragraphs',
  
  // Formatting
  'property-change': 'Format Change',
  'style-change': 'Style Change',
  'clear-formatting': 'Clear Formatting',
  'align-change': 'Alignment Change',
  
  // Links
  'link-change': 'Link Change',
  'add-link': 'Add Link',
  'delete-link': 'Remove Link',
  
  // Images
  'image-change': 'Image Change',
  'insert-image': 'Insert Image',
  'delete-image': 'Delete Image',
  
  // Dividers
  'insert-divider': 'Insert Divider',
  'delete-divider': 'Delete Divider',
  
  // Tables
  'insert-table': 'Insert Table',
  'delete-table': 'Delete Table',
  'insert-table-row': 'Insert Row',
  'duplicate-table-row': 'Duplicate Row',
  'delete-table-row': 'Delete Row',
  'insert-table-column': 'Insert Column',
  'delete-table-column': 'Delete Column',
  'duplicate-table-column': 'Duplicate Column',
  
  // Indentation
  'indent-change': 'Indent Change',
  
  // Block type changes - generic fallback
  'block-type-change': 'Block Type Change',
  
  // List operations - from non-list
  'insert-bullet-list': 'Insert Bullet List',
  'insert-numbered-list': 'Insert Numbered List',
  'insert-check-list': 'Insert Check List',
  
  // List operations - changing between list types
  'change-to-bullet-list': 'Change to Bullet List',
  'change-to-numbered-list': 'Change to Numbered List',
  'change-to-check-list': 'Change to Check List',
  
  // List removal
  'remove-list': 'Remove List',
  
  // Blockquote operations
  'insert-blockquote': 'Insert Blockquote',
  'remove-blockquote': 'Remove Blockquote',
}

/**
 * Determines the appropriate summary type for a block-type-change suggestion
 * based on the initial and target block types.
 */
export function getBlockTypeChangeSummaryType(
  props: BlockTypeChangeSuggestionProperties | undefined
): SuggestionSummaryType {
  if (!props?.targetBlockType) {
    return 'block-type-change'
  }
  
  const { initialBlockType, targetBlockType } = props
  const isFromList = initialBlockType === 'bullet' || initialBlockType === 'number' || initialBlockType === 'check'
  const isToList = targetBlockType === 'bullet' || targetBlockType === 'number' || targetBlockType === 'check'
  
  // List to list: "Change to X List"
  if (isFromList && isToList) {
    switch (targetBlockType) {
      case 'bullet':
        return 'change-to-bullet-list'
      case 'number':
        return 'change-to-numbered-list'
      case 'check':
        return 'change-to-check-list'
    }
  }
  
  // Non-list to list: "Insert X List"
  if (!isFromList && isToList) {
    switch (targetBlockType) {
      case 'bullet':
        return 'insert-bullet-list'
      case 'number':
        return 'insert-numbered-list'
      case 'check':
        return 'insert-check-list'
    }
  }
  
  // List to paragraph: "Remove List"
  if (isFromList && targetBlockType === 'paragraph') {
    return 'remove-list'
  }
  
  // Blockquote operations
  if (targetBlockType === 'quote') {
    return 'insert-blockquote'
  }
  
  if (initialBlockType === 'quote' && targetBlockType === 'paragraph') {
    return 'remove-blockquote'
  }
  
  return 'block-type-change'
}

/**
 * Gets the display text for a suggestion summary type.
 */
export function getSuggestionSummaryText(type: SuggestionSummaryType): string {
  return SuggestionSummaryText[type] ?? type
}

export interface SuggestionSummaryItem {
  type: SuggestionSummaryType
  content: string
  replaceWith?: string
}

/**
 * Formats a suggestion summary for display to the user.
 * 
 * @param summary - Either a JSON string (from storage) or a parsed array
 * @returns A human-readable summary string
 */
export function formatSuggestionSummary(summary: string | SuggestionSummaryItem[]): string {
  let items: SuggestionSummaryItem[]
  
  if (typeof summary === 'string') {
    try {
      items = JSON.parse(summary)
      if (!Array.isArray(items) || items.length === 0) {
        return 'Suggestion'
      }
    } catch {
      return summary
    }
  } else {
    items = summary
  }
  
  const first = items[0]
  if (!first) {
    return 'Suggestion'
  }
  
  const { type, content, replaceWith } = first
  const summaryText = getSuggestionSummaryText(type)
  
  if (replaceWith) {
    return `${summaryText}: ${content} → ${replaceWith}`
  }
  
  const trimmedContent = content.trim()
  return trimmedContent
    ? `${summaryText}: ${trimmedContent}`
    : summaryText
}
