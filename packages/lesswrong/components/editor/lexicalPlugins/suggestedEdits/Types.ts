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
import type { ElementFormatType, LexicalNode } from 'lexical'
import type { ProtonNode } from './ProtonNode'
import { $isSuggestionNode } from './ProtonNode'
import type { BlockType } from '@/components/editor/lexicalPlugins/suggestions/blockTypeSuggestionUtils'
import type { ListInfo } from '@/components/editor/lexicalPlugins/suggestions/$getListInfo'

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
