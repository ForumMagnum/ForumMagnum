import type { SuggestionThreadController, SuggestionThreadInfo, SuggestionSummaryType } from './SuggestionThreadController';
import { createComment, Thread, type CommentStore, type Comment, createThread } from '@/components/lexical/commenting';
import { hasChildComments } from '@/components/editor/lexicalPlugins/suggestedEdits/Utils';

const getSuggestionThreadInfo = (thread: Thread): SuggestionThreadInfo => ({
  id: thread.id,
  markID: thread.markID ?? thread.id,
  status: thread.status,
  hasChildComments: hasChildComments(thread),
});

const createSuggestionSummaryComment = (summary: string, author: string, authorId: string): Comment => {
  return createComment(summary, author, authorId, undefined, undefined, false, 'suggestionSummary');
};

export function createSuggestionThreadController({
  commentStore,
  authorId,
  authorName,
}: {
  commentStore: CommentStore
  authorId: string
  authorName: string
}): SuggestionThreadController {
  return {
    getAllThreads: async () => {
      return commentStore
        .getThreadsByType('suggestion')
        .map(getSuggestionThreadInfo);
    },
    createSuggestionThread: async (suggestionID, commentContent, _suggestionType: SuggestionSummaryType) => {
      const existing = commentStore.getThreadByMarkID(suggestionID);
      if (existing) {
        return getSuggestionThreadInfo(existing);
      }
      const summaryComment = createSuggestionSummaryComment(commentContent, authorName, authorId);
      const thread = createThread('', [summaryComment], undefined, {
        markID: suggestionID,
        status: 'open',
        threadType: 'suggestion',
      });
      commentStore.addComment(thread);
      return getSuggestionThreadInfo(thread);
    },
    reopenSuggestion: async (threadId) => {
      commentStore.updateThreadStatus(threadId, 'open');
      return true;
    },
    setThreadStatus: async (threadId, status) => {
      commentStore.updateThreadStatus(threadId, status);
      return true;
    },
    deleteSuggestionThread: async (threadId) => {
      const thread = commentStore.getComments().find(
        (comment): comment is Thread => comment.type === 'thread' && comment.id === threadId,
      );
      if (!thread) {
        return false;
      }
      commentStore.deleteCommentOrThread(thread);
      return true;
    },
    updateSuggestionSummary: async (suggestionID, summaryContent) => {
      const thread = commentStore.getThreadByMarkID(suggestionID);
      if (!thread) {
        return false;
      }
      const firstComment = thread.comments[0];
      if (firstComment && firstComment.content === summaryContent) {
        return true;
      }
      commentStore.updateThread(thread.id, { firstCommentContent: summaryContent });
      return true;
    },
  };
}
