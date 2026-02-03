import type { ElementFormatType, LexicalNode } from 'lexical'
import type { ProtonNode } from './ProtonNode'
import { $isSuggestionNode } from './ProtonNode'
import type { BlockType } from '@/components/editor/lexicalPlugins/suggestions/blockTypeSuggestionUtils'
import type { ListInfo } from '@/components/editor/lexicalPlugins/suggestions/$getListInfo'

export type SuggestionType =
  | 'insert'
  | 'delete'
  | 'property-change'
  | 'split'
  | 'join'
  | 'link-change'
  | 'style-change'
  | 'image-change'
  | 'indent-change'
  | 'insert-table'
  | 'delete-table'
  | 'insert-table-row'
  | 'duplicate-table-row'
  | 'delete-table-row'
  | 'insert-table-column'
  | 'delete-table-column'
  | 'duplicate-table-column'
  | 'block-type-change'
  | 'clear-formatting'
  | 'align-change'
  | 'insert-image'
  | 'delete-image'
  | 'insert-divider'
  | 'delete-divider';

export const SuggestionTypeToSummaryText = {
  insert: 'Insert',
  delete: 'Delete',
  'property-change': 'Property Change',
  split: 'Split',
  join: 'Join',
  'link-change': 'Link Change',
  'style-change': 'Style Change',
  'image-change': 'Image Change',
  'indent-change': 'Indent Change',
  'insert-table': 'Insert Table',
  'delete-table': 'Delete Table',
  'insert-table-row': 'Insert Table Row',
  'duplicate-table-row': 'Duplicate Table Row',
  'delete-table-row': 'Delete Table Row',
  'insert-table-column': 'Insert Table Column',
  'delete-table-column': 'Delete Table Column',
  'duplicate-table-column': 'Duplicate Table Column',
  'block-type-change': 'Block Type Change',
  'clear-formatting': 'Clear Formatting',
  'align-change': 'Align Change',
  'insert-image': 'Insert Image',
  'delete-image': 'Delete Image',
  'insert-divider': 'Insert Divider',
  'delete-divider': 'Delete Divider',
} satisfies Record<SuggestionType, string>;

export const ProtonNodeTypes = {
  Suggestion: 'suggestion',
} as const;

export const SuggestionTypesThatCanBeEmpty: SuggestionType[] = [
  'split',
  'join',
  'indent-change',
  'insert-table',
  'delete-table',
  'insert-table-row',
  'duplicate-table-row',
  'delete-table-row',
  'insert-table-column',
  'delete-table-column',
  'duplicate-table-column',
  'block-type-change',
  'align-change',
]

export const SuggestionTypesThatAffectWholeParent: SuggestionType[] = [
  'indent-change',
  'insert-table',
  'delete-table',
  'insert-table-row',
  'duplicate-table-row',
  'delete-table-row',
  'insert-table-column',
  'delete-table-column',
  'duplicate-table-column',
  'block-type-change',
  'align-change',
]

export function $isPlainInsertionSuggestion(suggestionType: SuggestionType): boolean {
  return suggestionType === 'insert' || suggestionType === 'insert-image' || suggestionType === 'insert-divider';
}

export function $isPlainDeletionSuggestion(suggestionType: SuggestionType): boolean {
  return suggestionType === 'delete' || suggestionType === 'delete-image' || suggestionType === 'delete-divider';
}

export function $isSuggestionThatAffectsWholeParent(node: LexicalNode): node is ProtonNode {
  return $isSuggestionNode(node) && SuggestionTypesThatAffectWholeParent.includes(node.getSuggestionTypeOrThrow())
}

export const TextEditingSuggestionTypes: SuggestionType[] = ['insert', 'delete', 'split', 'join']

export type SuggestionID = string

export type SuggestionProperties = {
  nodeType: typeof ProtonNodeTypes.Suggestion
  suggestionID: string
  suggestionType: SuggestionType
  /**
   * Pre-suggestion values for node properties
   * @example `__format` Used to store text format
   */
  nodePropertiesChanged?: Record<string, any>
}

export type BlockTypeChangeSuggestionProperties = {
  initialBlockType: BlockType
  initialFormatType?: ElementFormatType
  initialIndent?: number
  listInfo?: ListInfo
}

export type IndentChangeSuggestionProperties = {
  indent: number
}

export type PropertyChangeSuggestionProperties = {
  __format: number
}

export type LinkChangeSuggestionProperties = {
  __url: string | null
}

export type AlignChangeSuggestionProperties = {
  initialFormatType: ElementFormatType
}
