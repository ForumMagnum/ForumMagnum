'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useMessages } from '@/components/common/withMessages';
import classNames from 'classnames';
import { highlightHtmlWithLlmDetectionScores } from '../sunshineDashboard/helpers';
import { Link } from '@/lib/reactRouterWrapper';
import FormatDate from '@/components/common/FormatDate';
import DescriptionIcon from '@/lib/vendor/@material-ui/icons/src/Description';
import MessageIcon from '@/lib/vendor/@material-ui/icons/src/Message';
import { htmlToTextDefault } from '@/lib/htmlToText';
import { truncate } from '@/lib/editor/ellipsize';
import PostsPageWrapper from '@/components/posts/PostsPage/PostsPageWrapper';
import CommentsNode from '@/components/comments/CommentsNode';

const styles = defineStyles('AIDetectionComparisonPage', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: theme.palette.background.default,
  },
  header: {
    padding: '12px 20px',
    borderBottom: theme.palette.border.normal,
    backgroundColor: theme.palette.background.paper,
    flexShrink: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: theme.palette.grey[600],
  },
  contentSection: {
    display: 'flex',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  // Left panel - list
  listPanel: {
    width: 500,
    flexShrink: 0,
    backgroundColor: theme.palette.background.paper,
    borderRight: theme.palette.border.normal,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  listHeader: {
    padding: '12px 16px',
    borderBottom: theme.palette.border.normal,
    position: 'sticky',
    top: 0,
    backgroundColor: theme.palette.background.paper,
    zIndex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listTitle: {
    fontSize: 13,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: theme.palette.grey[600],
    letterSpacing: '0.5px',
  },
  listCount: {
    fontSize: 12,
    color: theme.palette.grey[500],
  },
  listItems: {
    flex: 1,
  },
  // List item
  listItem: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '10px 16px',
    borderBottom: theme.palette.border.faint,
    cursor: 'pointer',
    transition: 'background-color 0.1s ease',
    '&:hover': {
      backgroundColor: theme.palette.grey[50],
    },
    ...theme.typography.commentStyle,
  },
  listItemFocused: {
    borderLeft: `3px solid ${theme.palette.primary.main}`,
    paddingLeft: 13,
    backgroundColor: theme.palette.grey[100],
  },
  itemIcon: {
    height: 14,
    width: 14,
    marginRight: 8,
    marginTop: 2,
    color: theme.palette.grey[500],
    flexShrink: 0,
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
  },
  itemTopRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: 500,
    color: theme.palette.grey[900],
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  },
  itemPreview: {
    fontSize: 12,
    color: theme.palette.grey[600],
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginBottom: 4,
  },
  itemMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 11,
    color: theme.palette.grey[500],
  },
  authorLink: {
    color: theme.palette.primary.main,
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  karma: {
    fontWeight: 500,
  },
  karmaPositive: {
    color: theme.palette.primary.main,
  },
  karmaNegative: {
    color: theme.palette.error.main,
  },
  itemScores: {
    display: 'flex',
    gap: 6,
    marginLeft: 'auto',
    flexShrink: 0,
  },
  scoreBadge: {
    fontSize: 10,
    padding: '2px 5px',
    borderRadius: 3,
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  saplingBadge: {
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.grey[700],
  },
  pangramBadge: {
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.grey[700],
  },
  scoreHigh: {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.dark,
  },
  scoreMedium: {
    backgroundColor: theme.palette.bookPromotion.starGold,
    color: theme.palette.error.dark,
  },
  scoreLow: {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.dark,
  },
  statusBadge: {
    fontSize: 10,
    padding: '2px 5px',
    borderRadius: 3,
    fontWeight: 600,
    textTransform: 'uppercase',
    flexShrink: 0,
  },
  rejectedBadge: {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.dark,
  },
  borderlineBadge: {
    backgroundColor: theme.palette.warning.main,
  },
  // Right panel - detail view
  detailPanel: {
    flex: 1,
    backgroundColor: theme.palette.background.paper,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  detailEmpty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: theme.palette.grey[500],
    fontSize: 14,
  },
  detailHeader: {
    padding: '16px 20px',
    borderBottom: theme.palette.border.normal,
    backgroundColor: theme.palette.grey[50],
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 8,
  },
  detailMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    fontSize: 13,
    color: theme.palette.grey[600],
  },
  detailAuthorLink: {
    color: theme.palette.primary.main,
    textDecoration: 'none',
    fontWeight: 500,
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  detailContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  embeddedContentWrapper: {
    flex: 1,
    overflowY: 'auto',
    borderBottom: theme.palette.border.normal,
    minHeight: 200,
  },
  embeddedContentLoading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    color: theme.palette.grey[500],
  },
  scoresSection: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
    padding: 20,
    flex: 1,
  },
  scorePanel: {
    border: `1px solid ${theme.palette.grey[200]}`,
    borderRadius: 8,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  scorePanelHeader: {
    padding: '10px 14px',
    backgroundColor: theme.palette.grey[100],
    borderBottom: `1px solid ${theme.palette.grey[200]}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scorePanelTitle: {
    fontSize: 14,
    fontWeight: 600,
  },
  scorePanelBody: {
    padding: 14,
    flex: 1,
  },
  scoreRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 8,
    fontSize: 13,
  },
  scoreLabel: {
    color: theme.palette.grey[600],
  },
  scoreValue: {
    fontWeight: 600,
  },
  scoreValueHigh: {
    color: theme.palette.error.main,
  },
  scoreValueMedium: {
    color: theme.palette.error.main,
  },
  scoreValueLow: {
    color: theme.palette.primary.main,
  },
  scoreValueNone: {
    color: theme.palette.grey[400],
    fontStyle: 'italic',
  },
  actionButton: {
    padding: '6px 12px',
    fontSize: 12,
    borderRadius: 4,
    border: `1px solid ${theme.palette.grey[300]}`,
    backgroundColor: theme.palette.background.paper,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    '&:hover': {
      backgroundColor: theme.palette.grey[100],
      borderColor: theme.palette.grey[400],
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  runButton: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    border: 'none',
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  highlightedContent: {
    marginTop: 12,
    padding: 12,
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.grey[200]}`,
    borderRadius: 4,
    maxHeight: 200,
    overflowY: 'auto',
    fontSize: 13,
    lineHeight: 1.6,
  },
  windowScoresList: {
    marginTop: 12,
    maxHeight: 250,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  windowScoreItem: {
    padding: '8px 10px',
    backgroundColor: theme.palette.grey[50],
    borderRadius: 4,
    border: `1px solid ${theme.palette.grey[200]}`,
    fontSize: 12,
  },
  windowScoreHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  windowScoreValue: {
    fontWeight: 600,
    padding: '2px 6px',
    borderRadius: 3,
    fontSize: 11,
  },
  windowScoreHigh: {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.dark,
  },
  windowScoreMedium: {
    backgroundColor: theme.palette.grey[300],
    color: theme.palette.grey[800],
  },
  windowScoreLow: {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.dark,
  },
  windowScoreText: {
    fontSize: 12,
    lineHeight: 1.4,
    color: theme.palette.grey[700],
    fontStyle: 'italic',
    wordBreak: 'break-word',
  },
  loadingState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    color: theme.palette.grey[500],
  },
  errorState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    color: theme.palette.error.main,
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    color: theme.palette.grey[500],
  },
  loadMoreButton: {
    padding: '12px 20px',
    fontSize: 13,
    border: `1px solid ${theme.palette.grey[300]}`,
    backgroundColor: theme.palette.background.paper,
    cursor: 'pointer',
    margin: 16,
    borderRadius: 4,
    textAlign: 'center',
    '&:hover': {
      backgroundColor: theme.palette.grey[100],
    },
  },
  keyboardHint: {
    fontSize: 11,
    color: theme.palette.grey[500],
    marginLeft: 8,
  },
}));

const AI_DETECTION_COMPARISON_QUERY = gql(`
  query AIDetectionComparisonQuery($limit: Int, $offset: Int) {
    getAIDetectionComparisonItems(limit: $limit, offset: $offset) {
      documentId
      collectionName
      title
      htmlPreview
      postedAt
      baseScore
      authorDisplayName
      authorSlug
      rejected
      automatedContentEvaluation {
        _id
        score
        sentenceScores {
          sentence
          score
        }
        aiChoice
        aiReasoning
        pangramScore
        pangramMaxScore
        pangramPrediction
        pangramWindowScores {
          text
          score
          startIndex
          endIndex
        }
      }
    }
  }
`);

const COMMENT_FOR_DETAIL_QUERY = gql(`
  query CommentForDetailQuery($commentId: String!) {
    comment(selector: { _id: $commentId }) {
      result {
        ...CommentsListWithParentMetadata
      }
    }
  }
`);

const RUN_PANGRAM_CHECK_MUTATION = gql(`
  mutation RunPangramCheckMutation($documentId: String!, $collectionName: ContentCollectionName!) {
    runPangramCheck(documentId: $documentId, collectionName: $collectionName) {
      _id
      pangramScore
      pangramMaxScore
      pangramPrediction
      pangramWindowScores {
        text
        score
        startIndex
        endIndex
      }
    }
  }
`);

interface ComparisonItem {
  documentId: string;
  collectionName: string;
  title: string | null;
  htmlPreview: string;
  postedAt: string;
  baseScore: number;
  authorDisplayName: string | null;
  authorSlug: string | null;
  rejected: boolean;
  automatedContentEvaluation: {
    _id: string;
    score: number | null;
    sentenceScores: { sentence: string; score: number }[] | null;
    aiChoice: string | null;
    aiReasoning: string | null;
    pangramScore: number | null;
    pangramMaxScore: number | null;
    pangramPrediction: string | null;
    pangramWindowScores: { text: string; score: number; startIndex: number; endIndex: number }[] | null;
  } | null;
}

function getScoreColorClass(
  score: number | null | undefined,
  classes: { scoreValueHigh: string; scoreValueMedium: string; scoreValueLow: string; scoreValueNone: string }
): string {
  if (score === null || score === undefined) return classes.scoreValueNone;
  if (score >= 0.7) return classes.scoreValueHigh;
  if (score >= 0.4) return classes.scoreValueMedium;
  return classes.scoreValueLow;
}

function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return '—';
  return score.toFixed(2);
}

function ListItem({
  item,
  isFocused,
  onClick,
}: {
  item: ComparisonItem;
  isFocused: boolean;
  onClick: () => void;
}) {
  const classes = useStyles(styles);
  const isPost = item.collectionName === 'Posts';
  const ace = item.automatedContentEvaluation;
  
  const contentText = htmlToTextDefault(item.htmlPreview);
  const truncatedText = truncate(contentText, 80, 'characters');
  
  const karma = item.baseScore;
  const karmaClass = karma < 0 ? classes.karmaNegative : karma > 0 ? classes.karmaPositive : '';

  return (
    <div
      className={classNames(classes.listItem, { [classes.listItemFocused]: isFocused })}
      onClick={onClick}
    >
      {isPost ? (
        <DescriptionIcon className={classes.itemIcon} />
      ) : (
        <MessageIcon className={classes.itemIcon} />
      )}
      
      <div className={classes.itemContent}>
        <div className={classes.itemTopRow}>
          <span className={classes.itemTitle}>
            {item.title || truncatedText}
          </span>
          {/* {item.rejected ? (
            <span className={classNames(classes.statusBadge, classes.rejectedBadge)}>
              Rejected
            </span>
          ) : (
            <span className={classNames(classes.statusBadge, classes.borderlineBadge)}>
              Borderline
            </span>
          )} */}
        </div>
        
        {isPost && (
          <div className={classes.itemPreview}>{truncatedText}</div>
        )}
        
        <div className={classes.itemMeta}>
          <span className={classNames(classes.karma, karmaClass)}>
            {karma > 0 ? '+' : ''}{karma}
          </span>
          {item.authorDisplayName && item.authorSlug ? (
            <Link
              to={`/users/${item.authorSlug}`}
              className={classes.authorLink}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              {item.authorDisplayName}
            </Link>
          ) : (
            <span>{item.authorDisplayName || 'Unknown'}</span>
          )}
          <FormatDate date={item.postedAt} />
          
          <div className={classes.itemScores}>
            {ace?.score !== null && ace?.score !== undefined && (
              <span className={classNames(
                classes.scoreBadge,
                classes.saplingBadge,
                ace.score >= 0.5 && classes.scoreHigh,
                ace.score >= 0.2 && ace.score < 0.5 && classes.scoreMedium,
              )}>
                S: {ace.score.toFixed(2)}
              </span>
            )}
            {ace?.pangramScore !== null && ace?.pangramScore !== undefined && (
              <span className={classNames(
                classes.scoreBadge,
                classes.pangramBadge,
                ace.pangramScore >= 0.5 && classes.scoreHigh,
                ace.pangramScore >= 0.2 && ace.pangramScore < 0.5 && classes.scoreMedium,
                ace.pangramScore < 0.2 && classes.scoreLow,
              )}>
                P: {ace.pangramScore.toFixed(2)}
              </span>
            )}
            {(ace?.pangramScore === null || ace?.pangramScore === undefined) && (
              <span className={classNames(classes.scoreBadge, classes.pangramBadge)}>
                P: —
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmbeddedContent({
  item,
}: {
  item: ComparisonItem;
}) {
  const classes = useStyles(styles);
  const isPost = item.collectionName === 'Posts';

  // For comments, fetch the full comment data
  const { data: commentData, loading: commentLoading } = useQuery(COMMENT_FOR_DETAIL_QUERY, {
    variables: { commentId: item.documentId },
    skip: isPost,
    ssr: false,
  });

  if (isPost) {
    return (
      <div className={classes.embeddedContentWrapper}>
        <PostsPageWrapper documentId={item.documentId} sequenceId={null} embedded />
      </div>
    );
  }

  // Comment loading state
  if (commentLoading) {
    return (
      <div className={classes.embeddedContentWrapper}>
        <div className={classes.embeddedContentLoading}>Loading comment...</div>
      </div>
    );
  }

  const comment = commentData?.comment?.result;
  if (!comment) {
    return (
      <div className={classes.embeddedContentWrapper}>
        <div className={classes.embeddedContentLoading}>Comment not found</div>
      </div>
    );
  }

  return (
    <div className={classes.embeddedContentWrapper}>
      <CommentsNode
        treeOptions={{
          condensed: false,
          post: comment.post || undefined,
          tag: comment.tag || undefined,
          showPostTitle: true,
        }}
        comment={comment}
        forceUnTruncated
        forceUnCollapsed
      />
    </div>
  );
}

function DetailView({
  item,
  onPangramUpdated,
}: {
  item: ComparisonItem | null;
  onPangramUpdated: () => void;
}) {
  const classes = useStyles(styles);
  const { flash } = useMessages();
  const [showSaplingHighlight, setShowSaplingHighlight] = useState(false);
  const [showPangramHighlight, setShowPangramHighlight] = useState(false);

  const [runPangramCheck, { loading: runningPangram }] = useMutation(RUN_PANGRAM_CHECK_MUTATION, {
    onCompleted: () => {
      flash({ messageString: 'Pangram check completed successfully' });
      onPangramUpdated();
    },
    onError: (error) => {
      flash({ messageString: `Pangram check failed: ${error.message}` });
    },
  });

  // Reset highlight state when item changes
  useEffect(() => {
    setShowSaplingHighlight(false);
    setShowPangramHighlight(false);
  }, [item?.documentId]);

  const handleRunPangram = useCallback(() => {
    if (!item) return;
    void runPangramCheck({
      variables: {
        documentId: item.documentId,
        collectionName: item.collectionName as 'Posts' | 'Comments',
      },
    });
  }, [runPangramCheck, item]);

  if (!item) {
    return (
      <div className={classes.detailPanel}>
        <div className={classes.detailEmpty}>
          Select an item to view details{' '}
          <span className={classes.keyboardHint}>(use ↑↓ arrows to navigate)</span>
        </div>
      </div>
    );
  }

  const ace = item.automatedContentEvaluation;
  const isPost = item.collectionName === 'Posts';

  const saplingHighlightedHtml = showSaplingHighlight && ace?.sentenceScores
    ? highlightHtmlWithLlmDetectionScores(item.htmlPreview, ace.sentenceScores)
    : null;

  return (
    <div className={classes.detailPanel}>
      <div className={classes.detailHeader}>
        <div className={classes.detailTitle}>
          {item.title || (isPost ? 'Untitled Post' : 'Comment')}
          {item.rejected && (
            <span className={classNames(classes.statusBadge, classes.rejectedBadge)} style={{ marginLeft: 12 }}>
              Rejected
            </span>
          )}
        </div>
        <div className={classes.detailMeta}>
          <span className={classNames(classes.karma, item.baseScore < 0 ? classes.karmaNegative : classes.karmaPositive)}>
            {item.baseScore > 0 ? '+' : ''}{item.baseScore} karma
          </span>
          {item.authorDisplayName && item.authorSlug ? (
            <Link to={`/users/${item.authorSlug}`} className={classes.detailAuthorLink}>
              {item.authorDisplayName}
            </Link>
          ) : (
            <span>{item.authorDisplayName || 'Unknown author'}</span>
          )}
          <FormatDate date={item.postedAt} />
          <span>{isPost ? 'Post' : 'Comment'}</span>
        </div>
      </div>

      <div className={classes.detailContent}>
        <EmbeddedContent item={item} />

        <div className={classes.scoresSection}>
          {/* Sapling Panel */}
          <div className={classes.scorePanel}>
            <div className={classes.scorePanelHeader}>
              <span className={classes.scorePanelTitle}>Sapling</span>
              {ace?.sentenceScores && ace.sentenceScores.length > 0 && (
                <button
                  className={classes.actionButton}
                  onClick={() => setShowSaplingHighlight(!showSaplingHighlight)}
                >
                  {showSaplingHighlight ? 'Hide' : 'Show'} Highlights
                </button>
              )}
            </div>
            <div className={classes.scorePanelBody}>
              <div className={classes.scoreRow}>
                <span className={classes.scoreLabel}>Score:</span>
                <span className={classNames(classes.scoreValue, getScoreColorClass(ace?.score, classes))}>
                  {formatScore(ace?.score)}
                </span>
              </div>
              <div className={classes.scoreRow}>
                <span className={classes.scoreLabel}>Sentences:</span>
                <span className={classes.scoreValue}>
                  {ace?.sentenceScores?.length ?? '—'}
                </span>
              </div>
              {ace?.aiChoice && (
                <div className={classes.scoreRow}>
                  <span className={classes.scoreLabel}>AI Choice:</span>
                  <span className={classes.scoreValue}>{ace.aiChoice}</span>
                </div>
              )}
              {saplingHighlightedHtml && (
                <div
                  className={classes.highlightedContent}
                  dangerouslySetInnerHTML={{ __html: saplingHighlightedHtml }}
                />
              )}
            </div>
          </div>

          {/* Pangram Panel */}
          <div className={classes.scorePanel}>
            <div className={classes.scorePanelHeader}>
              <span className={classes.scorePanelTitle}>Pangram</span>
              {ace?.pangramScore !== null && ace?.pangramScore !== undefined ? (
                ace?.pangramWindowScores && ace.pangramWindowScores.length > 0 && (
                  <button
                    className={classes.actionButton}
                    onClick={() => setShowPangramHighlight(!showPangramHighlight)}
                  >
                    {showPangramHighlight ? 'Hide' : 'Show'} Windows
                  </button>
                )
              ) : (
                <button
                  className={classNames(classes.actionButton, classes.runButton)}
                  onClick={handleRunPangram}
                  disabled={runningPangram}
                >
                  {runningPangram ? 'Running...' : 'Run Pangram'}
                </button>
              )}
            </div>
            <div className={classes.scorePanelBody}>
              <div className={classes.scoreRow}>
                <span className={classes.scoreLabel}>Avg Score:</span>
                <span className={classNames(classes.scoreValue, getScoreColorClass(ace?.pangramScore, classes))}>
                  {formatScore(ace?.pangramScore)}
                </span>
              </div>
              <div className={classes.scoreRow}>
                <span className={classes.scoreLabel}>Max Score:</span>
                <span className={classNames(classes.scoreValue, getScoreColorClass(ace?.pangramMaxScore, classes))}>
                  {formatScore(ace?.pangramMaxScore)}
                </span>
              </div>
              <div className={classes.scoreRow}>
                <span className={classes.scoreLabel}>Prediction:</span>
                <span className={classes.scoreValue}>
                  {ace?.pangramPrediction ?? '—'}
                </span>
              </div>
              <div className={classes.scoreRow}>
                <span className={classes.scoreLabel}>Windows:</span>
                <span className={classes.scoreValue}>
                  {ace?.pangramWindowScores?.length ?? '—'}
                </span>
              </div>
              {showPangramHighlight && ace?.pangramWindowScores && ace.pangramWindowScores.length > 0 && (
                <div className={classes.windowScoresList}>
                  {ace.pangramWindowScores
                    .slice()
                    .sort((a, b) => b.score - a.score)
                    .map((window, idx) => (
                      <div key={idx} className={classes.windowScoreItem}>
                        <div className={classes.windowScoreHeader}>
                          <span>Window {idx + 1}</span>
                          <span
                            className={classNames(
                              classes.windowScoreValue,
                              window.score >= 0.7 ? classes.windowScoreHigh :
                              window.score >= 0.4 ? classes.windowScoreMedium :
                              classes.windowScoreLow
                            )}
                          >
                            {(window.score * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className={classes.windowScoreText}>
                          {window.text}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const AIDetectionComparisonPage = () => {
  const classes = useStyles(styles);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const limit = 50;

  const { data, loading, error, refetch, fetchMore } = useQuery(AI_DETECTION_COMPARISON_QUERY, {
    variables: { limit, offset: 0 },
    ssr: false,
  });

  const items = useMemo(() => {
    return (data?.getAIDetectionComparisonItems ?? []) as ComparisonItem[];
  }, [data]);

  const focusedItem = items[focusedIndex] ?? null;

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't intercept if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, items.length - 1));
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items.length]);

  // Scroll focused item into view
  useEffect(() => {
    const focusedElement = document.querySelector(`.${classes.listItemFocused}`);
    if (focusedElement) {
      focusedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [focusedIndex, classes.listItemFocused]);

  const handleLoadMore = useCallback(() => {
    void fetchMore({
      variables: {
        limit,
        offset: items.length,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          getAIDetectionComparisonItems: [
            ...prev.getAIDetectionComparisonItems,
            ...fetchMoreResult.getAIDetectionComparisonItems,
          ],
        };
      },
    });
  }, [fetchMore, items.length, limit]);

  if (loading && items.length === 0) {
    return (
      <div className={classes.root}>
        <div className={classes.header}>
          <h1 className={classes.title}>AI Detection Comparison: Sapling vs Pangram</h1>
          <div className={classes.subtitle}>
            Comparing borderline content (Sapling &gt; 0.3, reviewed) and rejected content (Sapling 0.5-0.8)
          </div>
        </div>
        <div className={classes.loadingState}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={classes.root}>
        <div className={classes.header}>
          <h1 className={classes.title}>AI Detection Comparison: Sapling vs Pangram</h1>
        </div>
        <div className={classes.errorState}>Error: {error.message}</div>
      </div>
    );
  }

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <h1 className={classes.title}>AI Detection Comparison: Sapling vs Pangram</h1>
        <div className={classes.subtitle}>
          Comparing borderline content (Sapling &gt; 0.3, reviewed) and rejected content (Sapling 0.5-0.8){' '}
          <span className={classes.keyboardHint}>• Use ↑↓ or j/k to navigate</span>
        </div>
      </div>

      <div className={classes.contentSection}>
        <div className={classes.listPanel}>
          <div className={classes.listHeader}>
            <span className={classes.listTitle}>Content</span>
            <span className={classes.listCount}>{items.length} items</span>
          </div>

          {items.length === 0 ? (
            <div className={classes.emptyState}>No items found</div>
          ) : (
            <div className={classes.listItems}>
              {items.map((item, index) => (
                <ListItem
                  key={item.documentId}
                  item={item}
                  isFocused={index === focusedIndex}
                  onClick={() => setFocusedIndex(index)}
                />
              ))}
              {items.length >= limit && (
                <button className={classes.loadMoreButton} onClick={handleLoadMore}>
                  Load More
                </button>
              )}
            </div>
          )}
        </div>

        <DetailView
          item={focusedItem}
          onPangramUpdated={() => refetch()}
        />
      </div>
    </div>
  );
};

export default AIDetectionComparisonPage;
