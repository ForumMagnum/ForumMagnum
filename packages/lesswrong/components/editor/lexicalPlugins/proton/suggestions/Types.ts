import type { ElementFormatType, LexicalNode } from 'lexical'
import type { ProtonNode } from './ProtonNode'
import { $isSuggestionNode } from './ProtonNode'
import type { BlockType } from '../BlockTypePlugin'
import type { ListInfo } from '../customList/$getListInfo'

export enum ProtonNodeTypes {
  Suggestion = 'suggestion',
}

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
  nodeType: ProtonNodeTypes.Suggestion
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

export type SuggestionSummaryType =
  | SuggestionType
  | 'replace'
  | 'add-link'
  | 'delete-link'
  | 'insert-image'
  | 'delete-image'
  | 'insert-divider'
  | 'delete-divider'

  export type CommentThreadInterface = {
    id: string
    createTime: ServerTime
    modifyTime: ServerTime
    markID: string
    comments: CommentInterface[]
    isPlaceholder: boolean
    state: CommentThreadState
    type: CommentThreadType
    /**
     * We need a stable local ID to allow positioned threads to be
     * keyed in a where the placeholder element for a thread is keyed
     * with the same ID as the normal one to prevent react from creating
     * a new DOM element. On thread creation, we use the ID of the placeholder
     * for this and on subsequent reloads we just use the normal ID.
     */
    localID: string
  
    asPayload(): CommentThreadPayload
  }

  export interface EditorRequiresClientMethods {  
    getAllThreads(): Promise<CommentThreadInterface[]>
    createCommentThread(
      commentContent: string,
      markID?: string,
      createMarkNode?: boolean,
    ): Promise<CommentThreadInterface | undefined>
    createSuggestionThread(
      suggestionID: string,
      commentContent: string,
      suggestionType: SuggestionSummaryType,
    ): Promise<CommentThreadInterface | undefined>
  
    // resolveThread(threadId: string): Promise<boolean>
    // unresolveThread(threadId: string): Promise<boolean>
  
    acceptSuggestion(threadId: string, summary: string): Promise<boolean>
    rejectSuggestion(threadId: string, summary?: string): Promise<boolean>
    reopenSuggestion(threadId: string): Promise<boolean>
  
    // deleteThread(id: string): Promise<boolean>
    // markThreadAsRead(id: string): Promise<void>
  
    // handleAwarenessStateUpdate(states: SafeDocsUserState[]): Promise<void>
  
    // openLink(url: string): Promise<void>
  
    // /**
    //  * @param extraInfo
    //  *  - irrecoverable: If true, will destroy the application instance entirely and display a blocking modal.
    //  *                   Otherwise, will show a modal that can be dismissed.
    //  */
    // reportUserInterfaceError(
    //   error: Error,
    //   extraInfo?: { irrecoverable?: boolean; errorInfo?: ErrorInfo; lockEditor?: boolean },
    // ): Promise<void>
    // reportWordCount(wordCountInfo: WordCountInfoCollection): Promise<void>
    // updateFrameSize(size: number): void
    // showGenericAlertModal(message: string): void
    // showGenericInfoModal(props: { title: string; translatedMessage: string }): void
    // fetchExternalImageAsBase64(url: string): Promise<string | undefined>
    // getAppPlatform(): Promise<AppPlatform>
  
    // handleFileMenuAction(action: FileMenuAction): Promise<void>
  
    // checkIfFeatureFlagIsEnabled(featureFlag: FeatureFlag): Promise<boolean>
  }
