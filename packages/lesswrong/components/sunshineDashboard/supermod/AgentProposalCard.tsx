'use client';

import React, { useMemo, useState } from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import { useSpeechRecognition } from '@/components/hooks/useSpeechRecognition';
import { renderAgentMarkdown } from './agentMarkdown';
import {
  parseProposalSteps,
  describeProposalStepParts,
  stepExecutionOrder,
  type ModerationProposalStep,
  type ModerationProposalStepResult,
} from '@/lib/collections/moderationProposals/proposalSteps';

const RejectionTemplatesForCardQuery = gql(`
  query multiModerationTemplateAgentProposalCardQuery($selector: ModerationTemplateSelector, $limit: Int) {
    moderationTemplates(selector: $selector, limit: $limit) {
      results {
        ...ModerationTemplateFragment
      }
    }
  }
`);

const styles = defineStyles('AgentProposalCard', (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    border: theme.palette.border.normal,
    borderRadius: 6,
    padding: 12,
    backgroundColor: theme.palette.background.paper,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  header: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 600,
  },
  statusChip: {
    fontSize: 11,
    color: theme.palette.grey[600],
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    flexShrink: 0,
  },
  rationale: {
    fontSize: 13,
    color: theme.palette.grey[700],
    '& p, & ul, & ol': {
      marginTop: 0,
      marginBottom: 6,
    },
    '& :last-child': {
      marginBottom: 0,
    },
    '& ul, & ol': {
      paddingLeft: 18,
    },
  },
  // The plan itself: visually distinct box so the actions stand out from the
  // surrounding prose
  planBox: {
    backgroundColor: theme.palette.grey[100],
    border: theme.palette.border.normal,
    borderLeft: `3px solid ${theme.palette.primary.main}`,
    borderRadius: 4,
    padding: '8px 12px',
  },
  stepList: {
    margin: 0,
    paddingLeft: 18,
    fontSize: 13,
    fontWeight: 500,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  subList: {
    margin: '2px 0 0',
    paddingLeft: 18,
    listStyleType: 'circle',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  subItem: {
    fontSize: 12.5,
    color: theme.palette.grey[600],
    '& p': {
      margin: 0,
    },
  },
  invalidStep: {
    color: theme.palette.error.main,
    fontSize: 13,
  },
  reasonToggle: {
    background: 'none',
    border: 'none',
    padding: 0,
    marginLeft: 6,
    fontSize: 11.5,
    fontFamily: 'inherit',
    color: theme.palette.primary.main,
    cursor: 'pointer',
  },
  resultBadge: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginLeft: 8,
  },
  resultApplied: {
    color: theme.palette.primary.main,
  },
  resultSkipped: {
    color: theme.palette.grey[500],
  },
  resultFailed: {
    color: theme.palette.error.main,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  micButton: {
    background: 'none',
    border: theme.palette.border.normal,
    borderRadius: 4,
    cursor: 'pointer',
    padding: '5px 8px',
    display: 'flex',
    color: theme.palette.grey[600],
    '&:hover': {
      color: theme.palette.text.normal,
    },
  },
  micButtonActive: {
    color: theme.palette.error.main,
    borderColor: theme.palette.error.main,
    animation: '$proposalMicPulse 1.4s infinite',
  },
  '@keyframes proposalMicPulse': {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.5 },
  },
  interimTranscript: {
    fontSize: 12,
    color: theme.palette.grey[500],
    fontStyle: 'italic',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  applyButton: {
    padding: '6px 14px',
    fontSize: 13,
    fontWeight: 600,
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.text.alwaysWhite,
    '&:disabled': {
      opacity: 0.5,
      cursor: 'default',
    },
  },
  dismissButton: {
    padding: '6px 14px',
    fontSize: 13,
    border: theme.palette.border.normal,
    borderRadius: 4,
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: theme.palette.grey[700],
    '&:disabled': {
      opacity: 0.5,
      cursor: 'default',
    },
  },
}));

export interface AgentProposalCardData {
  _id?: string | null;
  targetUserId?: string | null;
  title?: string | null;
  rationale?: string | null;
  steps?: unknown;
  status?: string | null;
  stepResults?: unknown;
}

function getStepResults(stepResults: unknown): Map<number, ModerationProposalStepResult> {
  const resultsByIndex = new Map<number, ModerationProposalStepResult>();
  if (Array.isArray(stepResults)) {
    for (const result of stepResults) {
      if (result && typeof result.index === 'number') {
        resultsByIndex.set(result.index, result);
      }
    }
  }
  return resultsByIndex;
}

/** HTML to show as a sub-bullet under a step's first line (the rejection reason, i.e. the template text) */
function stepReasonHtml(step: ModerationProposalStep): string | null {
  if (step.action === 'rejectContent' || step.action === 'rejectContentAndRemoveFromQueue') {
    return step.rejectedReason || null;
  }
  return null;
}

function normalizeHtmlText(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Short label for a rejection reason: the name(s) of the template(s) whose
 * text it contains (template identity isn't stored with rejections, so this
 * is a text match), falling back to a snippet of the reason itself.
 */
function reasonShortLabel(reasonHtml: string, templates: Array<{ name: string; contents: { html: string | null } | null }>): string {
  const normalizedReason = normalizeHtmlText(reasonHtml);
  const matches = templates
    .filter((template) => {
      const templateText = template.contents?.html ? normalizeHtmlText(template.contents.html) : '';
      return templateText.length > 20 && normalizedReason.includes(templateText.slice(0, 200));
    })
    .map((template) => template.name);
  if (matches.length) return matches.join(', ');
  const snippet = normalizeHtmlText(reasonHtml);
  return snippet.length > 80 ? `${snippet.slice(0, 80)}…` : snippet;
}

/** HTML of the drafted moderator message a step would send, if any */
function stepMessageHtml(step: ModerationProposalStep): string | null {
  if (step.action === 'sendModeratorMessage') return step.messageHtml || null;
  if (step.action === 'rejectContentAndRemoveFromQueue') return step.messageHtml ?? null;
  return null;
}

/**
 * One agent-proposed moderation action plan: title, rationale, and a plain
 * bulleted list of its effects in execution order, with the rejection reason
 * and any drafted message as sub-bullets. Apply runs the whole plan (through
 * the undo queue); there is no partial application.
 */
const AgentProposalCard = ({ proposal, posts, comments, isStreaming, canApply, onApply, onDismiss, onDiscuss, onVoiceSubmit }: {
  proposal: AgentProposalCardData;
  /** Loaded content for the target user, used to name targeted posts/comments */
  posts?: SunshinePostsList[];
  comments?: CommentsListWithParentMetadata[];
  /** True while the tool input is still streaming in (no _id yet) */
  isStreaming?: boolean;
  /** False when the proposal targets a user other than the opened one */
  canApply: boolean;
  onApply?: (selectedIndexes: Set<number>) => void;
  onDismiss?: () => void;
  /** Opens the agent chat to discuss this proposal; omit where the card is already inside the chat */
  onDiscuss?: () => void;
  /** Submits a dictated message about this proposal to a new agent conversation; omit to hide the mic */
  onVoiceSubmit?: (transcript: string) => void;
}) => {
  const classes = useStyles(styles);
  const parsedSteps = useMemo(() => parseProposalSteps(proposal.steps), [proposal.steps]);
  const [expandedReasonIndexes, setExpandedReasonIndexes] = useState<Set<number>>(new Set());

  const voiceTranscriptRef = React.useRef('');
  const { isSupported: speechSupported, isListening, interimTranscript, toggle: toggleDictation } = useSpeechRecognition({
    onFinalTranscript: (text) => { voiceTranscriptRef.current += text; },
  });
  const handleMicClick = () => {
    if (isListening) {
      const transcript = voiceTranscriptRef.current.trim();
      voiceTranscriptRef.current = '';
      toggleDictation();
      if (transcript) onVoiceSubmit?.(transcript);
    } else {
      voiceTranscriptRef.current = '';
      toggleDictation();
    }
  };

  const { data: templatesData } = useQuery(RejectionTemplatesForCardQuery, {
    variables: { selector: { moderationTemplatesList: { collectionName: 'Rejections' } }, limit: 50 },
    ssr: false,
  });
  const rejectionTemplates = templatesData?.moderationTemplates?.results ?? [];
  // Display in the order the steps will actually run; unparseable steps sink
  // to the bottom. Original indexes are kept for the result badges.
  const orderedSteps = useMemo(() => (
    parsedSteps
      .map((step, index) => ({ step, index }))
      .sort((a, b) => (a.step ? stepExecutionOrder(a.step) : 3) - (b.step ? stepExecutionOrder(b.step) : 3))
  ), [parsedSteps]);

  const resultsByIndex = useMemo(() => getStepResults(proposal.stepResults), [proposal.stepResults]);

  const isPending = proposal.status === 'pending' || proposal.status === 'draft';
  const isActionable = !isStreaming && !!proposal._id && isPending;

  const contentTitleFor = (step: ModerationProposalStep): string | undefined => {
    if (!('documentId' in step)) return undefined;
    if (step.collectionName === 'Posts') {
      return posts?.find((post) => post._id === step.documentId)?.title ?? undefined;
    }
    const comment = comments?.find((c) => c._id === step.documentId);
    return comment?.post?.title ? `comment on "${comment.post.title}"` : undefined;
  };

  const handleApply = () => {
    const selected = new Set(
      parsedSteps.map((_, index) => index).filter((index) => parsedSteps[index] !== null)
    );
    onApply?.(selected);
  };

  const statusLabel = isStreaming ? 'drafting…' : proposal.status ?? '';

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <span className={classes.title}>{proposal.title ?? 'Proposed plan'}</span>
        <span className={classes.statusChip}>{statusLabel}</span>
      </div>
      <div className={classes.planBox}>
      <ul className={classes.stepList}>
        {orderedSteps.map(({ step, index }) => {
          if (!step) {
            return <li key={index} className={classes.invalidStep}>Unrecognized step</li>;
          }
          const parts = describeProposalStepParts(step, contentTitleFor(step));
          const reasonHtml = stepReasonHtml(step);
          const messageHtml = stepMessageHtml(step);
          const messageLineIndex = messageHtml ? parts.findIndex((part) => part.startsWith('Send moderator message')) : -1;
          const result = resultsByIndex.get(index);
          return (
            <React.Fragment key={index}>
              {parts.map((part, partIndex) => (
                <li key={partIndex}>
                  {part}
                  {partIndex === 0 && result && (
                    <span className={classNames(classes.resultBadge, {
                      [classes.resultApplied]: result.status === 'applied',
                      [classes.resultSkipped]: result.status === 'skipped',
                      [classes.resultFailed]: result.status === 'failed',
                    })}>
                      {result.status === 'failed' && result.error ? `failed: ${result.error}` : result.status}
                    </span>
                  )}
                  {partIndex === 0 && reasonHtml && (
                    <ul className={classes.subList}>
                      {expandedReasonIndexes.has(index) ? (
                        <li className={classes.subItem}>
                          <span dangerouslySetInnerHTML={{ __html: reasonHtml }} />
                          <button
                            type="button"
                            className={classes.reasonToggle}
                            onClick={(event) => { event.preventDefault(); setExpandedReasonIndexes((previous) => { const next = new Set(previous); next.delete(index); return next; }); }}
                          >
                            Collapse
                          </button>
                        </li>
                      ) : (
                        <li className={classes.subItem}>
                          {reasonShortLabel(reasonHtml, rejectionTemplates)}
                          <button
                            type="button"
                            className={classes.reasonToggle}
                            onClick={(event) => { event.preventDefault(); setExpandedReasonIndexes((previous) => new Set(previous).add(index)); }}
                          >
                            Expand
                          </button>
                        </li>
                      )}
                    </ul>
                  )}
                  {partIndex === messageLineIndex && messageHtml && (
                    <ul className={classes.subList}>
                      <li className={classes.subItem} dangerouslySetInnerHTML={{ __html: messageHtml }} />
                    </ul>
                  )}
                </li>
              ))}
            </React.Fragment>
          );
        })}
      </ul>
      {(isActionable || (!isStreaming && (onDiscuss || onVoiceSubmit))) && (
        <div className={classes.actions}>
          {isActionable && (
            <>
              <button
                type="button"
                className={classes.applyButton}
                disabled={!canApply}
                title={canApply ? undefined : 'Open this proposal\'s target user to apply it'}
                onClick={handleApply}
              >
                Apply
              </button>
              <button type="button" className={classes.dismissButton} onClick={onDismiss}>
                Dismiss
              </button>
            </>
          )}
          {onDiscuss && !isStreaming && (
            <button type="button" className={classes.dismissButton} onClick={onDiscuss}>
              Discuss
            </button>
          )}
          {onVoiceSubmit && !isStreaming && speechSupported && (
            <button
              type="button"
              className={classNames(classes.micButton, { [classes.micButtonActive]: isListening })}
              title={isListening ? 'Stop and send to a new chat' : 'Dictate a message about this plan (sends to a new chat)'}
              onClick={handleMicClick}
            >
              {/* No microphone icon exists in the vendored icon sets */}
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width={16} height={16}>
                <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z" />
                <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.93V20H8a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-2.07A7 7 0 0 0 19 11z" />
              </svg>
            </button>
          )}
          {isListening && (
            <span className={classes.interimTranscript}>{interimTranscript || 'Listening…'}</span>
          )}
        </div>
      )}
      </div>
      {proposal.rationale && (
        <div className={classes.rationale} dangerouslySetInnerHTML={{ __html: renderAgentMarkdown(proposal.rationale) }} />
      )}
    </div>
  );
};

export default AgentProposalCard;
