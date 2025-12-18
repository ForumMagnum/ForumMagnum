"use client";
import React, { useState, useCallback } from 'react';
import LWDialog from '@/components/common/LWDialog';
import { DialogContent } from '@/components/widgets/DialogContent';
import { highlightHtmlWithPangramWindowScores } from './helpers';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useMessages } from '@/components/common/withMessages';

const styles = defineStyles('LLMScoreDialog', (theme: ThemeType) => ({
  contentContainer: {
    // Constrain images to prevent horizontal scrolling
    '& img': {
      maxWidth: '100%',
      height: 'auto',
    },
  },
  runCheckContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    padding: 24,
  },
  runCheckButton: {
    padding: '12px 24px',
    fontSize: 16,
    fontWeight: 500,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    border: 'none',
    borderRadius: theme.borderRadius.default,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
  },
  description: {
    color: theme.palette.text.dim,
    textAlign: 'center',
    maxWidth: 400,
  },
}));

const RUN_LLM_CHECK_MUTATION = gql(`
  mutation RunLlmCheckForDocument($documentId: String!, $collectionName: ContentCollectionName!) {
    runLlmCheckForDocument(documentId: $documentId, collectionName: $collectionName) {
      ...AutomatedContentEvaluationsFragment
    }
  }
`);

type LLMScoreDialogProps = {
  onClose: () => void;
  /** Required when automatedContentEvaluations is null, to allow running the check */
  documentId: string;
  automatedContentEvaluations: null;
  contentHtml: string;
  contentType: 'Post';
  onLlmCheckComplete?: () => void;
} | {
  onClose: () => void;
  documentId?: string;
  automatedContentEvaluations: AutomatedContentEvaluationsFragment;
  contentHtml: string;
  contentType: 'Post' | 'Comment';
  onLlmCheckComplete?: () => void;
};

function LLMScoreDialog({
  onClose,
  documentId,
  automatedContentEvaluations,
  contentHtml,
  contentType,
  onLlmCheckComplete,
}: LLMScoreDialogProps) {
  const classes = useStyles(styles);
  const { flash } = useMessages();
  const [aceData, setAceData] = useState<AutomatedContentEvaluationsFragment | null>(automatedContentEvaluations);
  
  const [runLlmCheck, { loading: isRunning }] = useMutation(RUN_LLM_CHECK_MUTATION, {
    onCompleted: (data) => {
      const result = data.runLlmCheckForDocument;
      setAceData(result);
      onLlmCheckComplete?.();
    },
    onError: (error) => {
      flash({ messageString: `Error running LLM check: ${error.message}` });
    },
  });

  const handleRunCheck = useCallback(() => {
    if (!documentId) return;
    void runLlmCheck({ variables: { documentId, collectionName: contentType === 'Post' ? 'Posts' : 'Comments' } });
  }, [runLlmCheck, documentId, contentType]);
  
  const canRunCheck = !!documentId;

  const score = aceData?.pangramScore;
  const maxScore = aceData?.pangramMaxScore;
  
  const highlightedHtml = aceData 
    ? highlightHtmlWithPangramWindowScores(contentHtml, aceData.pangramWindowScores ?? [])
    : '';

  return (
    <LWDialog open={true} onClose={onClose}>
      <DialogContent>
        {aceData ? (
          <div className={classes.contentContainer}>
            <p>LLM Score Average: {score?.toFixed(2) ?? 'N/A'}, Max: {maxScore?.toFixed(2) ?? 'N/A'}</p>
            {aceData.pangramPrediction && (
              <p>Prediction: <strong>{aceData.pangramPrediction}</strong></p>
            )}
            <p>{contentType} with highlighted windows:</p>
            <div dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
          </div>
        ) : canRunCheck ? (
          <div className={classes.runCheckContainer}>
            <p className={classes.description}>
              No LLM evaluation exists for this {contentType.toLowerCase()}. 
              Run the check to analyze the content for potential AI-generated text.
            </p>
            <button
              className={classes.runCheckButton}
              onClick={handleRunCheck}
              disabled={isRunning}
            >
              {isRunning ? 'Running LLM Check...' : 'Run LLM Check'}
            </button>
          </div>
        ) : (
          <div className={classes.runCheckContainer}>
            <p className={classes.description}>
              No LLM evaluation exists for this {contentType.toLowerCase()}.
            </p>
          </div>
        )}
      </DialogContent>
    </LWDialog>
  );
}

export default LLMScoreDialog;
