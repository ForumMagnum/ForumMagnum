import React, { useCallback } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import FormatDate from '@/components/common/FormatDate';
import DescriptionIcon from '@/lib/vendor/@material-ui/icons/src/Description';
import MessageIcon from '@/lib/vendor/@material-ui/icons/src/Message';
import ReplayIcon from '@/lib/vendor/@material-ui/icons/src/Replay';
import { htmlToTextDefault } from '@/lib/htmlToText';
import { truncate } from '@/lib/editor/ellipsize';
import RejectContentButton from '../RejectContentButton';
import { useDialog } from '@/components/common/withDialog';
import { DialogContent } from '@/components/widgets/DialogContent';
import LWDialog from '@/components/common/LWDialog';
import { highlightHtmlWithPangramWindowScores } from '../helpers';
import KeystrokeDisplay from './KeystrokeDisplay';
import HoverOver from '@/components/common/HoverOver';
import type { InboxAction } from './inboxReducer';
import { useRerunLlmCheck } from './useRerunLlmCheck';

const styles = defineStyles('ModerationContentItem', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 20px',
    borderBottom: theme.palette.border.faint,
    cursor: 'pointer',
    transition: 'background-color 0.1s ease',
    '&:hover': {
      backgroundColor: theme.palette.grey[50],
    },
    ...theme.typography.commentStyle,
    overflow: 'hidden',
    minWidth: 0,
  },
  focused: {
    borderLeft: `3px solid ${theme.palette.primary.main}`,
    paddingLeft: 17,
    backgroundColor: theme.palette.grey[100],
  },
  icon: {
    height: 14,
    width: 14,
    marginRight: 8,
    color: theme.palette.grey[500],
    flexShrink: 0,
  },
  karma: {
    fontSize: 13,
    marginRight: 12,
    minWidth: 32,
    textAlign: 'right',
    flexShrink: 0,
    fontWeight: 500,
  },
  karmaPositive: {
    color: theme.palette.primary.main,
  },
  karmaNegative: {
    color: theme.palette.error.main,
  },
  karmaLow: {
    color: theme.palette.grey[600],
  },
  postedAt: {
    fontSize: 13,
    color: theme.palette.grey[600],
    marginRight: 12,
    minWidth: 24,
    flexShrink: 0,
  },
  contentPreview: {
    flex: 1,
    minWidth: 220,
    overflow: 'hidden',
    marginRight: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: 500,
    color: theme.palette.grey[900],
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginBottom: 2,
  },
  text: {
    fontSize: 13,
    color: theme.palette.grey[600],
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  status: {
    fontSize: 11,
    padding: '2px 6px',
    borderRadius: 3,
    marginLeft: 8,
    textTransform: 'uppercase',
    fontWeight: 600,
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  reviewed: {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.dark,
  },
  rejectedStatus: {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.dark,
  },
  rejectButtonContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
    flexShrink: 0,
  },
  automatedEvaluations: {
    display: 'flex',
    gap: 6,
    marginLeft: 8,
    flexShrink: 0,
  },
  evaluationBadge: {
    fontSize: 11,
    padding: '2px 6px',
    borderRadius: 3,
    cursor: 'pointer',
    transition: 'background-color 0.1s ease',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.grey[700],
    '&:hover': {
      backgroundColor: theme.palette.grey[300],
    },
  },
  rejectedReasonTooltipContents: {
    maxHeight: 300,
    overflowY: 'auto',
    '& ul': {
      marginBlockStart: 0,
      marginBlockEnd: 0,
    }
  },
  rejectionInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    flexShrink: 0,
    maxWidth: 168,
  },
  rejectionTopRow: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
  },
  rejectionReasonPreview: {
    marginLeft: 8,
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

type ContentItem = SunshinePostsList | SunshineCommentsList;

const isPost = (item: ContentItem): item is SunshinePostsList => {
  return 'title' in item && item.title !== null;
};

const ModerationContentItem = ({
  item,
  isFocused,
  isRunningLlmCheck,
  onOpen,
  dispatch,
}: {
  item: ContentItem;
  isFocused: boolean;
  isRunningLlmCheck: boolean;
  onOpen: () => void;
  dispatch: React.Dispatch<InboxAction>;
}) => {
  const classes = useStyles(styles);
  const { openDialog } = useDialog();

  const karma = item.baseScore ?? 0;
  const karmaClass = karma < 0 ? classes.karmaNegative : karma < 3 ? classes.karmaLow : classes.karmaPositive;

  const itemIsPost = isPost(item);
  const contentHtml = item.contents?.html ?? '';
  const contentText = htmlToTextDefault(contentHtml);
  const truncatedText = truncate(contentText, 100, 'characters');

  const contentWrapper = itemIsPost 
    ? { collectionName: 'Posts' as const, document: item }
    : { collectionName: 'Comments' as const, document: item };

  const automatedContentEvaluations = 'automatedContentEvaluations' in item ? item.automatedContentEvaluations : null;
  const score = automatedContentEvaluations?.pangramScore;
  const maxScore = automatedContentEvaluations?.pangramMaxScore;

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

  const handleLLMScoreClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!automatedContentEvaluations) return;
    const highlightedHtml = highlightHtmlWithPangramWindowScores(
      contentHtml,
      automatedContentEvaluations.pangramWindowScores ?? []
    );

    openDialog({
      name: 'LLMScoreDialog',
      contents: ({ onClose }) => (
        <LWDialog open={true} onClose={onClose}>
          <DialogContent>
            <div>
              <p>LLM Score Average: {score?.toFixed(2) ?? 'N/A'}, Max: {maxScore?.toFixed(2) ?? 'N/A'}</p>
              {automatedContentEvaluations.pangramPrediction && (
                <p>Prediction: <strong>{automatedContentEvaluations.pangramPrediction}</strong></p>
              )}
              <p>{itemIsPost ? 'Post' : 'Comment'} with highlighted windows:</p>
              <div dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
            </div>
          </DialogContent>
        </LWDialog>
      ),
    });
  }, [automatedContentEvaluations, contentHtml, openDialog, itemIsPost, score, maxScore]);

  const evaluationBadge = typeof score === 'number' ? (
    <HoverOver title={<p>Average: {score.toFixed(2)}, Max: {maxScore?.toFixed(2) ?? 'N/A'}</p>}>
      <span className={classes.evaluationBadge} onClick={handleLLMScoreClick}>
        LLM: {score.toFixed(2)}
      </span>
    </HoverOver>
  ) : null;

  const rejectedReasonText = item.rejectedReason 
    ? truncate(htmlToTextDefault(item.rejectedReason), 80, 'characters')
    : '[No reason provided]';

  return (
    <div
      className={classNames(classes.root, {
        [classes.focused]: isFocused,
      })}
      onClick={e => { e.stopPropagation(); onOpen(); }}
    >
      {itemIsPost ? (
        <DescriptionIcon className={classes.icon} />
      ) : (
        <MessageIcon className={classes.icon} />
      )}
      
      <div className={classNames(classes.karma, karmaClass)}>
        {karma}
      </div>
      
      <div className={classes.postedAt}>
        <FormatDate date={item.postedAt} />
      </div>

      <div className={classes.contentPreview}>
        {itemIsPost && (
          <div className={classes.title}>{item.title}</div>
        )}
        <div className={classes.text}>{truncatedText}</div>
      </div>

      {item.reviewedByUserId && (
        <div className={classNames(classes.status, classes.reviewed)}>
          Reviewed
        </div>
      )}
      
      {item.rejected && (
        <div className={classes.rejectionInfo}>
          <div className={classes.rejectionTopRow}>
            <HoverOver
              title={<div className={classes.rejectedReasonTooltipContents} dangerouslySetInnerHTML={{ __html: item.rejectedReason ?? '[No reason provided]' }} />}
              placement="auto-end"
              clickable
            >
              <div className={classNames(classes.status, classes.rejectedStatus)}>
                {score && score >= 0.5 ? 'Autorejected' : 'Rejected'}
              </div>
            </HoverOver>
            {evaluationBadge}
          </div>
          <div className={classes.rejectionReasonPreview}>{rejectedReasonText}</div>
        </div>
      )}

      {!item.rejected && automatedContentEvaluations && (
        <div className={classes.automatedEvaluations}>
          {evaluationBadge}
        </div>
      )}

      {!item.rejected && showRerunButton && (
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

      {!item.rejected && item.authorIsUnreviewed && (
        <div className={classes.rejectButtonContainer} onClick={(e) => e.stopPropagation()}>
          <RejectContentButton contentWrapper={contentWrapper} />
          <KeystrokeDisplay keystroke="R" />
        </div>
      )}
    </div>
  );
};

export default ModerationContentItem;

