import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { hasRejectedContentSectionSetting, isLWorAF } from '../../lib/instanceSettings';
import RejectContentButton from './RejectContentButton';
import RejectedReasonDisplay from './RejectedReasonDisplay';
import { useDialog } from '../common/withDialog';
import { DialogContent } from '../widgets/DialogContent';
import LWDialog from '../common/LWDialog';
import { highlightHtmlWithLlmDetectionScores } from './helpers';
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles("RejectedContentControls", (theme: ThemeType) => ({
  root: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 4,
  },
  llmScore: {
    cursor: 'pointer',
  },
  automatedContentEvaluations: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  aiOutput: {
    fontSize: '0.9em',
    textWrap: 'pretty',
  },
  row: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
}));

interface ContentWrapper {
  collectionName: 'Posts' | 'Comments';
  content: any;
}

const RejectedContentControls = ({ contentWrapper }: {
  contentWrapper: ContentWrapper
}) => {
  const { collectionName, content } = contentWrapper;
  const classes = useStyles(styles);

  const { openDialog } = useDialog();

  // Gate the visibility based on forum settings
  if (collectionName === 'Posts' && !hasRejectedContentSectionSetting.get()) return null;
  if (collectionName === 'Comments' && !isLWorAF) return null;

  const automatedContentEvaluations = content.contents?.automatedContentEvaluations;

  function handleLLMScoreClick() {
    if (!automatedContentEvaluations) return;
    const highlightedHtml = highlightHtmlWithLlmDetectionScores(
      content.contents?.html || '',
      automatedContentEvaluations.sentenceScores || []
    );

    openDialog({
      name: 'LLMScoreDialog',
      contents: ({ onClose }) => (
        <LWDialog open={true} onClose={onClose}>
          <DialogContent>
            <div>
              <p>LLM Score: {automatedContentEvaluations.score}</p>
              <p>Post with highlighted sentences:</p>
              {/* eslint-disable-next-line react/no-danger */}
              <div dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
            </div>
          </DialogContent>
        </LWDialog>
      ),
    });
  }

  function handleAiJudgementClick() {
    if (!automatedContentEvaluations) return;
    openDialog({
      name: 'AiJudgementDialog',
      contents: ({ onClose }) => (
        <LWDialog open={true} onClose={onClose}>
          <DialogContent>
            <p><strong>AI Choice:</strong> {automatedContentEvaluations.aiChoice}</p>
            <p><strong>AI Reasoning:</strong></p>
            <pre className={classes.aiOutput}>{automatedContentEvaluations.aiReasoning}</pre>
            <p><strong>AI CoT:</strong></p>
            <pre className={classes.aiOutput}>{automatedContentEvaluations.aiCoT}</pre>
          </DialogContent>
        </LWDialog>
      ),
    });
  }

  return (
    <span className={classes.root}>
      <div className={classes.row}>
        {content.rejected && <RejectedReasonDisplay reason={content.rejectedReason} />}
        {automatedContentEvaluations && (
          <div className={classes.automatedContentEvaluations}>
            <span className={classes.llmScore} onClick={handleLLMScoreClick}>
              <strong>LLM Score:</strong> {automatedContentEvaluations.score.toFixed(2)}
            </span>
            <span className={classes.llmScore} onClick={handleAiJudgementClick}>
              <strong>AI notes:</strong> {automatedContentEvaluations.aiChoice}
            </span>
          </div>
        )}
      </div>
      <RejectContentButton contentWrapper={contentWrapper} />
    </span>
  );
};

export default registerComponent('RejectedContentControls', RejectedContentControls);
