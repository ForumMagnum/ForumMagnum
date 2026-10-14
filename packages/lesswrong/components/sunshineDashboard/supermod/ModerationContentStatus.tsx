import React, { useCallback, useMemo } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import ReplayIcon from '@/lib/vendor/@material-ui/icons/src/Replay';
import { htmlToTextDefault } from '@/lib/htmlToText';
import { truncate } from '@/lib/editor/ellipsize';
import RejectContentButton from '../RejectContentButton';
import HoverOver from '@/components/common/HoverOver';
import type { InboxAction } from './inboxReducer';
import { useRerunLlmCheck } from './useRerunLlmCheck';
import LLMScoreBadge from './LLMScoreBadge';
import { extractRejectionReasonSummary } from '@/lib/rejectionReasonSummary';
import { PANGRAM_AUTOREJECT_THRESHOLD } from '@/lib/collections/automatedContentEvaluations/constants';
import { isAwaitingReview, type ContentItem } from './helpers';

const styles = defineStyles('ModerationContentStatus', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    gap: 8,
  },
  status: {
    fontSize: 11,
    padding: '2px 6px',
    borderRadius: 3,
    textTransform: 'uppercase',
    fontWeight: 600,
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  live: {
    color: theme.palette.primary.main,
  },
  inactive: {
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.grey[700],
  },
  rejectedStatus: {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.contrastText,
  },
  rejectedReasonStatus: {
    maxWidth: 240,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textTransform: 'none',
  },
  rejectButtonContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  automatedEvaluations: {
    display: 'flex',
    gap: 6,
    flexShrink: 0,
  },
  rejectedReasonTooltipContents: {
    maxHeight: 300,
    overflowY: 'auto',
    '& ul': {
      marginBlockStart: 0,
      marginBlockEnd: 0,
      paddingInlineStart: 16,
    }
  },
  rejectionInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    flexShrink: 0,
    maxWidth: 168,
  },
  rejectionReasonPreview: {
    fontSize: 11,
    color: theme.palette.grey[600],
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 300,
  },
  rerunButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '2px 6px',
    borderRadius: 3,
    fontSize: 11,
    fontWeight: 500,
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.grey[700],
    cursor: 'pointer',
    transition: 'background-color 0.1s ease',
    border: 'none',
    whiteSpace: 'nowrap',
    '&:hover': {
      backgroundColor: theme.palette.grey[300],
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  rerunIcon: {
    width: 12,
    height: 12,
  },
  rerunIconSpinning: {
    animation: '$spin 1s linear infinite',
  },
  '@keyframes spin': {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
}));

const isPost = (item: ContentItem): item is SunshinePostsList => {
  return !('postId' in item);
};

const ModerationContentStatus = ({
  item,
  isRunningLlmCheck,
  onReject,
  dispatch,
  className,
}: {
  item: ContentItem;
  isRunningLlmCheck: boolean;
  /** Selects this item and opens the sidebar's reject composer for it. */
  onReject?: () => void;
  dispatch: React.Dispatch<InboxAction>;
  className?: string;
}) => {
  const classes = useStyles(styles);

  const itemIsPost = isPost(item);
  const contentHtml = item.contents?.html ?? '';

  const contentWrapper = itemIsPost
    ? { collectionName: 'Posts' as const, document: item }
    : { collectionName: 'Comments' as const, document: item };

  const automatedContentEvaluations = 'automatedContentEvaluations' in item ? item.automatedContentEvaluations : null;
  const score = automatedContentEvaluations?.pangramScore;

  // Show the rerun button when there's no ACE or when ACE is missing the Pangram score
  const showRerunButton = !automatedContentEvaluations || automatedContentEvaluations.pangramScore === null;

  const collectionName = itemIsPost ? 'Posts' as const : 'Comments' as const;
  const { handleRerunLlmCheck } = useRerunLlmCheck(
    item._id,
    collectionName,
    dispatch
  );

  const onRerunClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    void handleRerunLlmCheck();
  }, [handleRerunLlmCheck]);

  const evaluationBadge = (
    <LLMScoreBadge
      documentId={item._id}
      automatedContentEvaluations={automatedContentEvaluations}
      contentHtml={contentHtml}
      contentType={itemIsPost ? 'Post' : 'Comment'}
      stopPropagation
    />
  );

  const rejectedReasonSummary = useMemo(
    () => item.rejectedReason ? extractRejectionReasonSummary(item.rejectedReason) : [],
    [item.rejectedReason]
  );

  // Autorejections all share one boilerplate reason, so don't show it.
  const isAutorejected = !!score && score > PANGRAM_AUTOREJECT_THRESHOLD;
  const rejectionLabel = isAutorejected
    ? 'Autorejected'
    : (rejectedReasonSummary[0] ?? 'Rejected');

  const inactiveLabel = itemIsPost
    ? (item.draft ? 'Draft' : null)
    : (item.deleted ? 'Deleted' : null);
  const isLive = !item.rejected && !inactiveLabel && !isAwaitingReview(item);

  const rejectedReasonText = item.rejectedReason
    ? truncate(htmlToTextDefault(item.rejectedReason), 80, 'characters')
    : '[No reason provided]';

  return (
    <div className={classNames(classes.root, className)}>
      {automatedContentEvaluations && (
        <div className={classes.automatedEvaluations}>
          {evaluationBadge}
        </div>
      )}

      {showRerunButton && (
        <button
          className={classes.rerunButton}
          onClick={onRerunClick}
          disabled={isRunningLlmCheck}
          title={automatedContentEvaluations ? "Re-run LLM check (score missing)" : "Run LLM check"}
        >
          <ReplayIcon className={classNames(classes.rerunIcon, { [classes.rerunIconSpinning]: isRunningLlmCheck })} />
          {isRunningLlmCheck ? 'Checking...' : 'LLM'}
        </button>
      )}

      {item.rejected && (
        <div className={classes.rejectionInfo}>
          <HoverOver
            title={<div className={classes.rejectedReasonTooltipContents}>
              {rejectedReasonSummary.length > 1
                ? <ul>{rejectedReasonSummary.map((sentence, i) => <li key={i}>{sentence}</li>)}</ul>
                : (rejectedReasonSummary[0] ?? '[No reason provided]')}
            </div>}
            placement="auto-end"
            clickable
          >
            <div className={classNames(classes.status, classes.rejectedStatus, {
              [classes.rejectedReasonStatus]: !isAutorejected,
            })}>
              {rejectionLabel}
            </div>
          </HoverOver>
          {isAutorejected && <div className={classes.rejectionReasonPreview}>{rejectedReasonText}</div>}
        </div>
      )}

      {inactiveLabel && <div className={classNames(classes.status, classes.inactive)}>{inactiveLabel}</div>}
      {isLive && <div className={classNames(classes.status, classes.live)}>Live</div>}

      {isAwaitingReview(item) && (
        <div className={classes.rejectButtonContainer} onClick={(e) => e.stopPropagation()}>
          <RejectContentButton contentWrapper={contentWrapper} onReject={onReject} />
        </div>
      )}
    </div>
  );
};

export default ModerationContentStatus;
