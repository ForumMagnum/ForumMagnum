import React, { useCallback } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import HoverOver from '@/components/common/HoverOver';
import { useDialog } from '@/components/common/withDialog';
import LLMScoreDialog from '../LLMScoreDialog';
import classNames from 'classnames';

const styles = defineStyles('LLMScoreBadge', (theme: ThemeType) => ({
  badge: {
    fontSize: 11,
    padding: '2px 6px',
    borderRadius: 3,
    cursor: 'pointer',
    transition: 'background-color 0.1s ease',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.grey[700],
    flexShrink: 0,
    '&:hover': {
      backgroundColor: theme.palette.grey[300],
    },
  },
}));

const LLMScoreBadge = ({
  documentId,
  automatedContentEvaluations,
  contentHtml,
  contentType,
  showWhenEmpty = false,
  stopPropagation = false,
  onLlmCheckComplete,
  className,
}: {
  documentId: string;
  automatedContentEvaluations: AutomatedContentEvaluationsFragment | null | undefined;
  contentHtml: string;
  contentType: 'Post' | 'Comment';
  showWhenEmpty?: boolean;
  stopPropagation?: boolean;
  onLlmCheckComplete?: () => void;
  className?: string;
}) => {
  const classes = useStyles(styles);
  const { openDialog } = useDialog();

  const score = automatedContentEvaluations?.pangramScore;
  const maxScore = automatedContentEvaluations?.pangramMaxScore;
  const hasScore = typeof score === 'number';

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
    openDialog({
      name: 'LLMScoreDialog',
      contents: ({ onClose }) => (
        <LLMScoreDialog
          onClose={onClose}
          documentId={documentId}
          automatedContentEvaluations={automatedContentEvaluations ?? null}
          contentHtml={contentHtml}
          contentType={contentType}
          onLlmCheckComplete={onLlmCheckComplete}
        />
      ),
    });
  }, [automatedContentEvaluations, documentId, contentHtml, contentType, stopPropagation, onLlmCheckComplete, openDialog]);

  if (!hasScore && !showWhenEmpty) return null;

  return (
    <HoverOver
      title={hasScore
        ? <div>Average: {score.toFixed(2)}, Max: {maxScore?.toFixed(2) ?? 'N/A'}</div>
        : <div>No LLM evaluation — click to run check</div>}
    >
      <span className={classNames(classes.badge, className)} onClick={handleClick}>
        LLM: {hasScore ? score.toFixed(2) : '—'}
      </span>
    </HoverOver>
  );
};

export default LLMScoreBadge;
