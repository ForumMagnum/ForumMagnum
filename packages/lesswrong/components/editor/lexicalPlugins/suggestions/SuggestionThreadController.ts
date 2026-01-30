export type SuggestionSummaryType =
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
  | 'replace'
  | 'add-link'
  | 'delete-link'
  | 'insert-image'
  | 'delete-image'
  | 'insert-divider'
  | 'delete-divider';

export type SuggestionThreadInfo = {
  id: string;
  markID: string;
  status?: 'open' | 'accepted' | 'rejected' | 'archived';
  hasChildComments?: boolean;
};

export interface SuggestionThreadController {
  getAllThreads(): Promise<SuggestionThreadInfo[]>;
  createSuggestionThread(
    suggestionID: string,
    commentContent: string,
    suggestionType: SuggestionSummaryType,
  ): Promise<SuggestionThreadInfo | undefined>;
  reopenSuggestion(threadId: string): Promise<boolean>;
  setThreadStatus(
    threadId: string,
    status: 'open' | 'accepted' | 'rejected' | 'archived',
  ): Promise<boolean>;
  deleteSuggestionThread(threadId: string): Promise<boolean>;
  /**
   * Update the summary content for a suggestion thread.
   * Called when the suggestion's content changes (e.g., user continues typing).
   */
  updateSuggestionSummary(suggestionID: string, summaryContent: string): Promise<boolean>;
}
