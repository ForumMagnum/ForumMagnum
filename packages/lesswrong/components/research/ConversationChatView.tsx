'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { useMutation } from '@apollo/client/react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useMessages } from '@/components/common/withMessages';
import { htmlToTextDefault } from '@/lib/htmlToText';
import { randomId } from '@/lib/random';
import ForumIcon from '@/components/common/ForumIcon';
import { useConversationStream } from './hooks/useConversationStream';
import { isVisibleConversationEvent } from './conversationEventFormat';
import { ConversationTranscript } from './ConversationTranscript';
import { ConversationActions } from './ConversationActions';
import ChatComposer from './ChatComposer';
import { isSandboxWarmingError } from './sandboxWarming';
import { researchMono, researchWarmAlpha, researchCanvas, researchRadius } from './researchStyleUtils';

const ConversationChatViewQuery = gql(`
  query ConversationChatViewInfo($conversationId: String!) {
    researchConversation(selector: { _id: $conversationId }) {
      result {
        _id
        title
      }
    }
  }
`);

const ContinueResearchConversationFromChatViewMutation = gql(`
  mutation ContinueResearchConversationFromChatView($conversationId: String!, $promptHtml: String!, $activeDocumentId: String!) {
    continueResearchConversation(conversationId: $conversationId, promptHtml: $promptHtml, activeDocumentId: $activeDocumentId) {
      conversationId
    }
  }
`);

const CancelResearchConversationFromChatViewMutation = gql(`
  mutation CancelResearchConversationFromChatView($conversationId: String!) {
    cancelResearchConversation(conversationId: $conversationId) {
      conversationId
    }
  }
`);

// The classic-LLM-chat reading column in fullscreen mode.
const FULLSCREEN_COLUMN_MAX_WIDTH = 780;

const styles = defineStyles('ConversationChatView', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
    minWidth: 0,
    background: researchCanvas(theme),
  },
  header: {
    flex: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    minHeight: 20,
    padding: '8px 10px',
    borderBottom: `1px solid ${researchWarmAlpha(0.08)}`,
    fontFamily: researchMono,
    fontSize: 11,
    color: theme.palette.text.dim,
    userSelect: 'none',
  },
  headerTitle: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: theme.palette.text.primary,
  },
  headerSpacer: {
    flex: 1,
  },
  pulseDot: {
    flex: 'none',
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: theme.palette.primary.main,
    animation: '$chatViewPulse 1.4s ease-in-out infinite',
  },
  '@keyframes chatViewPulse': {
    '0%, 100%': { opacity: 0.25, transform: 'scale(0.85)' },
    '50%': { opacity: 1, transform: 'scale(1)' },
  },
  errorGlyph: {
    flex: 'none',
    color: theme.palette.error?.main ?? theme.palette.text.primary,
  },
  headerButton: {
    flexShrink: 0,
    whiteSpace: 'nowrap',
    background: 'transparent',
    border: 'none',
    borderRadius: researchRadius.xs,
    fontFamily: researchMono,
    fontSize: 10.5,
    lineHeight: 1.4,
    color: theme.palette.text.dim,
    padding: '2px 6px',
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.text.primary,
      background: researchWarmAlpha(0.06),
    },
  },
  iconButton: {
    width: 22,
    height: 22,
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    '--icon-size': '14px',
  },
  // The transcript + composer column. In the side panel it fills the panel;
  // in fullscreen it's the classic centered LLM-chat reading column.
  body: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    padding: '0 12px 12px',
  },
  bodyFullscreen: {
    width: '100%',
    maxWidth: FULLSCREEN_COLUMN_MAX_WIDTH,
    margin: '0 auto',
    padding: '0 24px 20px',
  },
  composerWrap: {
    flex: 'none',
    paddingTop: 2,
  },
}));

interface ConversationChatViewProps {
  conversationId: string;
  projectId: string;
  /**
   * The document the user currently has open — forwarded to
   * `continueResearchConversation` so the agent knows the user's working
   * context. Sending is disabled while this is unknown.
   */
  activeDocumentId: string | null;
  variant: 'panel' | 'fullscreen';
  /** Close the chat surface entirely. */
  onClose: () => void;
  /** Panel → fullscreen, or fullscreen → panel. */
  onToggleFullscreen: () => void;
  /** Close the chat surface and jump to the conversation's inline block. */
  onOpenInDocument: () => void;
}

/**
 * The classic chat surface for a research conversation: header, scrollable
 * transcript (with scroll-up history paging), and a pinned composer. Hosted
 * in two shells by ResearchWorkspace — a resizable right side panel, and a
 * full-viewport overlay with a centered reading column.
 */
export const ConversationChatView = ({
  conversationId,
  projectId,
  activeDocumentId,
  variant,
  onClose,
  onToggleFullscreen,
  onOpenInDocument,
}: ConversationChatViewProps) => {
  const classes = useStyles(styles);
  const { flash } = useMessages();
  const [sending, setSending] = useState(false);

  const {
    events, status, error, turnInFlight, hasMoreOlder, loadingOlder, loadOlder,
    markTurnExpected, injectOptimisticEvent, clearOptimistic, refresh,
  } = useConversationStream(conversationId);

  const { data: conversationData, refetch: refetchConversation } = useQuery(ConversationChatViewQuery, {
    variables: { conversationId },
    fetchPolicy: 'cache-and-network',
  });
  const title = conversationData?.researchConversation?.result?.title ?? 'Conversation';

  // Background title generation may land during a turn — refresh on completion.
  const wasInFlightRef = useRef(false);
  useEffect(() => {
    if (wasInFlightRef.current && !turnInFlight) {
      void refetchConversation();
    }
    wasInFlightRef.current = turnInFlight;
  }, [turnInFlight, refetchConversation]);

  const visibleEvents = useMemo(
    () => events.filter(isVisibleConversationEvent),
    [events],
  );

  const [continueConversation] = useMutation(ContinueResearchConversationFromChatViewMutation);
  const [cancelConversation] = useMutation(CancelResearchConversationFromChatViewMutation);

  const handleSend = useCallback(async (promptHtml: string) => {
    if (sending || !activeDocumentId) return;
    setSending(true);
    try {
      markTurnExpected();
      injectOptimisticEvent({
        _id: `optimistic:user:${randomId()}`,
        conversationId,
        seq: -1,
        kind: 'user',
        claudeMessageUuid: null,
        payload: { type: 'user', message: { role: 'user', content: htmlToTextDefault(promptHtml) } },
        createdAt: new Date().toISOString(),
      });
      await continueConversation({
        variables: { conversationId, promptHtml, activeDocumentId },
      });
      refresh();
    } catch (err) {
      clearOptimistic();
      if (isSandboxWarmingError(err)) {
        flash({ messageString: 'The sandbox is still starting up — try again in a moment.' });
      } else {
        // eslint-disable-next-line no-console
        console.error('[research] conversation send failed', err);
        flash({ messageString: 'Failed to send message — try again.', type: 'error' });
      }
      throw err;
    } finally {
      setSending(false);
    }
  }, [sending, conversationId, activeDocumentId, continueConversation, markTurnExpected, injectOptimisticEvent, clearOptimistic, refresh, flash]);

  const handleCancel = useCallback(async () => {
    await cancelConversation({ variables: { conversationId } });
  }, [cancelConversation, conversationId]);

  // Esc in fullscreen drops back to the side panel (the panel itself leaves
  // Esc alone — it's a persistent surface, not a modal).
  useEffect(() => {
    if (variant !== 'fullscreen') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onToggleFullscreen();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [variant, onToggleFullscreen]);

  const headerGlyph = turnInFlight
    ? <span className={classes.pulseDot} aria-label="Agent is responding" />
    : status === 'error'
      ? <span className={classes.errorGlyph} title={error ?? 'error'}>✕</span>
      : null;

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        {headerGlyph}
        <span className={classes.headerTitle}>{title}</span>
        <span className={classes.headerSpacer} />
        {turnInFlight ? (
          <button type="button" className={classes.headerButton} onClick={handleCancel}>
            ■ stop
          </button>
        ) : null}
        <ConversationActions conversationId={conversationId} />
        <button
          type="button"
          className={classNames(classes.headerButton, classes.iconButton)}
          onClick={onOpenInDocument}
          title="Open at its place in the document"
          aria-label="Open in document"
        >
          <ForumIcon icon="Document" className={classes.icon} />
        </button>
        <button
          type="button"
          className={classNames(classes.headerButton, classes.iconButton)}
          onClick={onToggleFullscreen}
          title={variant === 'fullscreen' ? 'Exit full screen (Esc)' : 'Open full screen'}
          aria-label={variant === 'fullscreen' ? 'Exit full screen' : 'Open full screen'}
        >
          <ForumIcon icon={variant === 'fullscreen' ? 'FullscreenExit' : 'Fullscreen'} className={classes.icon} />
        </button>
        <button
          type="button"
          className={classNames(classes.headerButton, classes.iconButton)}
          onClick={onClose}
          title="Close"
          aria-label="Close"
        >
          <ForumIcon icon="Close" className={classes.icon} />
        </button>
      </div>
      <div className={classNames(classes.body, variant === 'fullscreen' && classes.bodyFullscreen)}>
        <ConversationTranscript
          conversationId={conversationId}
          events={visibleEvents}
          turnInFlight={turnInFlight}
          status={status}
          error={error}
          hasMoreOlder={hasMoreOlder}
          loadingOlder={loadingOlder}
          loadOlder={loadOlder}
        />
        <div className={classes.composerWrap}>
          <ChatComposer
            projectId={projectId}
            disabled={sending || !activeDocumentId}
            onSubmit={handleSend}
          />
        </div>
      </div>
    </div>
  );
};
