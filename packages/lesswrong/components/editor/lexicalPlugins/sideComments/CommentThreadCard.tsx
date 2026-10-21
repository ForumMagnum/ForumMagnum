import React, { useMemo } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { Thread, Comment } from '@/components/lexical/commenting';
import { SUGGESTION_SUMMARY_KIND } from '@/components/editor/lexicalPlugins/suggestedEdits/Utils';
import { formatSuggestionSummary } from '@/components/editor/lexicalPlugins/suggestedEdits/suggestionSummaryUtils';
import { CommentsComposer, SuggestionStatusOrActions, acceptSuggestionThread, rejectSuggestionThread } from '@/components/lexical/plugins/CommentPlugin/CommentPluginComponents';
import ForumIcon from '@/components/common/ForumIcon';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import moment from 'moment';

const styles = defineStyles('CommentThreadCard', (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    '&:hover $resolveButton, &:hover $threadActions': {
      opacity: 1,
    },
  },
  alwaysShowActions: {
    '& $resolveButton, & $threadActions': {
      opacity: 1,
    },
  },
  suggestionContent: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.5,
    color: theme.palette.grey[800],
    whiteSpace: 'pre-wrap',
    fontStyle: 'italic',
  },
  commentsList: {
    listStyleType: 'none',
    padding: 0,
    margin: 0,
  },
  comment: {
    padding: '8px 12px',
  },
  commentHeader: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 2,
  },
  commentAuthor: {
    fontWeight: 600,
    fontSize: 12,
    color: theme.palette.grey[900],
  },
  commentTime: {
    fontSize: 11,
    color: theme.palette.grey[500],
  },
  commentContent: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.5,
    color: theme.palette.grey[800],
    whiteSpace: 'pre-wrap',
  },
  commentHeaderWithActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  commentHeaderLeft: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
    minWidth: 0,
  },
  threadActions: {
    opacity: 0,
    transition: 'opacity 0.15s ease-in-out',
    flexShrink: 0,
  },
  resolveButton: {
    padding: 0,
    height: 16,
    width: 16,
    cursor: 'pointer',
    background: 'unset',
    opacity: 0,
    transition: 'opacity 0.15s ease-in-out',
    color: theme.palette.grey[500],
    flexShrink: 0,
    '&:hover': {
      color: theme.palette.grey[800],
    },
  },
  resolveIcon: {
    height: 16,
    width: 16,
  },
  replyComposer: {
    position: 'relative',
    borderTop: theme.palette.greyBorder('1px', 0.08),
  },
}));

/**
 * The contents of a single comment or suggestion thread: the suggestion
 * summary (for suggestion threads), the comments, resolve/accept/reject
 * actions, and optionally a reply box. Used both for side comments in the
 * right margin and for the comment-thread popover shown at narrower widths.
 */
export const CommentThreadCard = ({
  thread,
  showReplyComposer,
  alwaysShowActions = false,
  submitAddComment,
  onResolve,
  commentsListClassName,
}: {
  thread: Thread;
  showReplyComposer: boolean;
  /** If false, the resolve/accept/reject buttons are only shown on hover */
  alwaysShowActions?: boolean;
  submitAddComment: (comment: Comment, isInlineComment: boolean, thread?: Thread) => void;
  onResolve: () => void;
  commentsListClassName?: string;
}) => {
  const classes = useStyles(styles);
  const [editor] = useLexicalComposerContext();
  const isSuggestion = thread.threadType === 'suggestion';

  const summaryComment = isSuggestion
    ? thread.comments.find((c) => c.commentKind === SUGGESTION_SUMMARY_KIND)
    : undefined;
  const summaryText = useMemo(
    () => summaryComment?.content ? formatSuggestionSummary(summaryComment.content) : null,
    [summaryComment?.content],
  );

  const visibleComments = thread.comments.filter(
    (c) => !c.deleted && c.commentKind !== SUGGESTION_SUMMARY_KIND,
  );

  const suggestionStatus = thread.status ?? 'open';

  return (
    <div className={classNames(classes.root, alwaysShowActions && classes.alwaysShowActions)}>
      <div className={commentsListClassName}>
        {isSuggestion && summaryComment && (
          <div className={classes.comment}>
            <div className={classes.commentHeaderWithActions}>
              <div className={classes.commentHeaderLeft}>
                <span className={classes.commentAuthor}>{summaryComment.author}</span>
                <span className={classes.commentTime}>
                  {moment(summaryComment.timeStamp).fromNow()}
                </span>
              </div>
              <div className={classes.threadActions} onClick={(e) => e.stopPropagation()}>
                <SuggestionStatusOrActions
                  status={suggestionStatus}
                  suggestionAuthorId={summaryComment.authorId}
                  onAccept={() => acceptSuggestionThread(editor, thread)}
                  onReject={() => rejectSuggestionThread(editor, thread)}
                />
              </div>
            </div>
            {summaryText && (
              <p className={classes.suggestionContent}>{summaryText}</p>
            )}
          </div>
        )}
        <ul className={classes.commentsList}>
          {visibleComments.map((comment, index) => (
            <li key={comment.id} className={classes.comment}>
              {index === 0 && !isSuggestion ? (
                <div className={classes.commentHeaderWithActions}>
                  <div className={classes.commentHeaderLeft}>
                    <span className={classes.commentAuthor}>{comment.author}</span>
                    <span className={classes.commentTime}>
                      {moment(comment.timeStamp).fromNow()}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={classes.resolveButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      onResolve();
                    }}
                    title="Resolve thread"
                  >
                    <ForumIcon icon="Check" className={classes.resolveIcon} />
                  </button>
                </div>
              ) : (
                <div className={classes.commentHeader}>
                  <span className={classes.commentAuthor}>{comment.author}</span>
                  <span className={classes.commentTime}>
                    {moment(comment.timeStamp).fromNow()}
                  </span>
                </div>
              )}
              <p className={classes.commentContent}>
                {comment.content}
              </p>
            </li>
          ))}
        </ul>
      </div>
      {showReplyComposer && (
        <div className={classes.replyComposer} onClick={(e) => e.stopPropagation()}>
          <CommentsComposer
            submitAddComment={submitAddComment}
            thread={thread}
            placeholder="Reply..."
          />
        </div>
      )}
    </div>
  );
};
