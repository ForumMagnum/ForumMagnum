"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gql } from '@/lib/generated/gql-codegen';
import { useMutation, useApolloClient } from '@apollo/client/react';
import { isSandboxWarmingError } from './sandboxWarming';
import { pollForConversationTitle, ProjectSidebarQuery } from './projectSidebarQuery';
import classNames from 'classnames';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import { useConversationStream, type ConversationEvent } from './hooks/useConversationStream';
import { randomId } from '@/lib/random';
import { htmlToTextDefault } from '@/lib/htmlToText';
import { useMessages } from '@/components/common/withMessages';
import Loading from '../vulcan-core/Loading';
import ChatComposer from './ChatComposer';
import {
  ResearchNavigationProvider,
  type ResearchNavigationContextValue,
} from './lexical/ResearchEditorContext';
import { isVisibleConversationEvent } from './conversationEventFormat';
import { ConversationEventRow } from './ConversationEventRow';
import { ConversationActions } from './ConversationActions';
import { countNewVisibleEvents, isScrolledNearBottom, newMessagePillLabel } from './chatPaneScroll';

interface ChatPaneProps {
  projectId: string;
  conversationId: string | null;
  activeDocumentId: string | null;
  onConversationCreated: (conversationId: string) => void;
  onSelectDocument: (documentId: string) => void;
  onOpenConversationInChat: (conversationId: string) => void;
}

// Sidebar chat isn't wired to the environment selector for now, but the
// backend's "exactly one of baseEnvironmentId / runtime" check applies to all
// fireResearchConversation calls — so chat sends a default runtime rather than
// neither field.
const FireChatConversationMutation = gql(`
  mutation FireChatPaneConversation($conversationId: String!, $projectId: String!, $activeDocumentId: String!, $promptHtml: String!) {
    fireResearchConversation(input: { conversationId: $conversationId, projectId: $projectId, kind: chat, activeDocumentId: $activeDocumentId, promptHtml: $promptHtml, runtime: "node24" }) {
      conversationId
    }
  }
`);

const ContinueResearchConversationMutation = gql(`
  mutation ContinueResearchConversationFromChatPane($conversationId: String!, $promptHtml: String!, $activeDocumentId: String!) {
    continueResearchConversation(conversationId: $conversationId, promptHtml: $promptHtml, activeDocumentId: $activeDocumentId) {
      conversationId
    }
  }
`);

const CancelResearchConversationMutation = gql(`
  mutation CancelResearchConversationFromChatPane($conversationId: String!) {
    cancelResearchConversation(conversationId: $conversationId) {
      conversationId
    }
  }
`);

const styles = defineStyles('ChatPane', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  empty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    color: theme.palette.text.dim,
    fontSize: 14,
    textAlign: 'center',
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '4px 16px',
    fontSize: 11,
    color: theme.palette.text.dim,
    borderBottom: theme.palette.greyBorder('1px', 0.05),
    background: theme.palette.greyAlpha(0.02),
  },
  statusError: {
    color: theme.palette.error?.main ?? 'red',
  },
  events: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  eventsWrapper: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
    display: 'flex',
  },
  newMessagesButton: {
    position: 'absolute',
    left: '50%',
    bottom: 12,
    transform: 'translateX(-50%)',
    border: 'none',
    borderRadius: 999,
    padding: '6px 12px',
    background: theme.palette.primary.main,
    color: theme.palette.text.alwaysWhite,
    boxShadow: `0 2px 8px ${theme.palette.boxShadowColor(0.25)}`,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    fontFamily: 'inherit',
    zIndex: 1,
    '&:hover': {
      background: theme.palette.primary.dark,
    },
  },
  pendingPrompt: {
    fontSize: 13,
    lineHeight: 1.5,
    borderRadius: 6,
    wordBreak: 'break-word',
    background: theme.palette.greyAlpha(0.06),
    alignSelf: 'flex-end',
    maxWidth: '85%',
    padding: '4px 8px',
  },
  cancelButton: {
    padding: '6px 14px',
    borderRadius: 4,
    background: 'transparent',
    color: theme.palette.text.dim,
    border: theme.palette.greyBorder('1px', 0.15),
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    fontFamily: 'inherit',
  },
}));

const ChatPane = ({
  projectId,
  conversationId,
  activeDocumentId,
  onConversationCreated,
  onSelectDocument,
  onOpenConversationInChat,
}: ChatPaneProps) => {
  const classes = useStyles(styles);
  const apolloClient = useApolloClient();
  const { flash } = useMessages();
  const [sending, setSending] = useState(false);
  // Optimistic echo of a new chat's first prompt while `fireResearchConversation`
  // runs — the pane can't switch to the conversation until the row exists.
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const eventsRef = useRef<HTMLDivElement | null>(null);
  const isPinnedToBottomRef = useRef(true);
  const previousConversationIdRef = useRef<string | null>(null);
  const previousVisibleEventCountRef = useRef(0);
  const [newMessageCount, setNewMessageCount] = useState(0);

  const { events: rawEvents, status, error, refresh, injectOptimisticEvent, clearOptimistic, markTurnExpected } = useConversationStream(conversationId);
  const [expectFirstTurnFor, setExpectFirstTurnFor] = useState<string | null>(null);
  useEffect(() => {
    if (conversationId && conversationId === expectFirstTurnFor) {
      markTurnExpected();
      setExpectFirstTurnFor(null);
    }
  }, [conversationId, expectFirstTurnFor, markTurnExpected]);
  // Hide system init / session-result wrappers / rate-limit notices that the
  // hook delivers; the chat surface only renders user-facing turn events.
  const events = useMemo<ConversationEvent[]>(
    () => rawEvents.filter(isVisibleConversationEvent),
    [rawEvents],
  );
  const [fireConversation] = useMutation(FireChatConversationMutation, {
    refetchQueries: [ProjectSidebarQuery],
  });
  const [continueConversation] = useMutation(ContinueResearchConversationMutation);
  const [cancelConversation] = useMutation(CancelResearchConversationMutation);

  const scrollEventsToBottom = useCallback(() => {
    const el = eventsRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    isPinnedToBottomRef.current = true;
    setNewMessageCount(0);
  }, []);

  const handleEventsScroll = useCallback(() => {
    const el = eventsRef.current;
    if (!el) return;
    const pinnedToBottom = isScrolledNearBottom(el);
    isPinnedToBottomRef.current = pinnedToBottom;
    if (pinnedToBottom) {
      setNewMessageCount(0);
    }
  }, []);

  useEffect(() => {
    const el = eventsRef.current;
    const previousConversationId = previousConversationIdRef.current;
    const previousVisibleEventCount = previousConversationId === conversationId
      ? previousVisibleEventCountRef.current
      : 0;
    const newVisibleEventCount = countNewVisibleEvents(previousVisibleEventCount, events.length);

    previousConversationIdRef.current = conversationId;
    previousVisibleEventCountRef.current = events.length;

    if (!el) return;

    if (previousConversationId !== conversationId || events.length < previousVisibleEventCount) {
      scrollEventsToBottom();
      return;
    }
    if (newVisibleEventCount === 0) return;

    if (isPinnedToBottomRef.current) {
      scrollEventsToBottom();
    } else {
      setNewMessageCount((count) => count + newVisibleEventCount);
    }
  }, [conversationId, events.length, scrollEventsToBottom]);

  const handleSend = useCallback(async (promptHtml: string) => {
    if (sending || !activeDocumentId) return;
    setSending(true);
    try {
      if (!conversationId) {
        // Generate the conversation id client-side, but don't switch the pane
        // to it until `fireResearchConversation` has created the row —
        // otherwise `useConversationStream` mounts and queries the transcript
        // before the row exists and sticks in an error state.
        const newId = randomId();
        setPendingPrompt(htmlToTextDefault(promptHtml));
        const result = await fireConversation({
          variables: { conversationId: newId, projectId, activeDocumentId, promptHtml },
        });
        const createdId = result.data?.fireResearchConversation?.conversationId;
        if (!createdId) {
          throw new Error('fireResearchConversation returned no conversationId');
        }
        setExpectFirstTurnFor(createdId);
        onConversationCreated(createdId);
        void pollForConversationTitle(apolloClient, projectId, createdId);
      } else {
        const optimisticText = htmlToTextDefault(promptHtml);
        markTurnExpected();
        injectOptimisticEvent({
          _id: `optimistic:user:${randomId()}`,
          conversationId,
          seq: -1,
          kind: 'user',
          claudeMessageUuid: null,
          payload: { type: 'user', message: { role: 'user', content: optimisticText } },
          createdAt: new Date().toISOString(),
        });
        await continueConversation({ variables: { conversationId, promptHtml, activeDocumentId } });
        refresh();
      }
    } catch (err) {
      clearOptimistic();
      if (isSandboxWarmingError(err)) {
        flash({ messageString: 'The sandbox is still starting up — try again in a moment.' });
      } else {
        // eslint-disable-next-line no-console
        console.error('[research] chat send failed', err);
        flash({ messageString: 'Failed to send message — try again.', type: 'error' });
      }
      throw err;
    } finally {
      setSending(false);
      setPendingPrompt(null);
    }
  }, [sending, conversationId, projectId, activeDocumentId, fireConversation, continueConversation, onConversationCreated, refresh, injectOptimisticEvent, clearOptimistic, markTurnExpected, apolloClient, flash]);

  const handleCancel = useCallback(async () => {
    if (!conversationId) return;
    await cancelConversation({ variables: { conversationId } });
  }, [cancelConversation, conversationId]);

  const isStreaming = status === 'streaming' || status === 'connecting';

  const navigationContext = useMemo<ResearchNavigationContextValue>(() => ({
    navigateToDocument: onSelectDocument,
    openConversationInChat: onOpenConversationInChat,
    host: conversationId ? { kind: 'conversation', conversationId } : undefined,
  }), [conversationId, onSelectDocument, onOpenConversationInChat]);

  if (!conversationId) {
    return (
      <div className={classes.root}>
        {pendingPrompt ? (
          <div className={classes.events}>
            <div className={classes.pendingPrompt}>{pendingPrompt}</div>
            <Loading />
          </div>
        ) : (
          <div className={classes.empty}>
            <div>Start a new chat by typing a prompt below.</div>
          </div>
        )}
        <ResearchNavigationProvider value={navigationContext}>
          <ChatComposer
            projectId={projectId}
            placeholder="Ask anything…"
            disabled={sending || !activeDocumentId}
            onSubmit={handleSend}
          />
        </ResearchNavigationProvider>
      </div>
    );
  }

  return (
    <div className={classes.root}>
      <div className={classNames(classes.status, error ? classes.statusError : undefined)}>
        <span>{renderStatusLabel(status, error)}</span>
        <ConversationActions conversationId={conversationId} />
      </div>
      {status === 'loading' && events.length === 0 ? (
        <div className={classes.eventsWrapper}>
          <div className={classes.events}><Loading /></div>
        </div>
      ) : (
        <div className={classes.eventsWrapper}>
          <div className={classes.events} ref={eventsRef} onScroll={handleEventsScroll}>
            {events.map((event) => (
              <ConversationEventRow key={event._id ?? `${event.conversationId}:${event.seq}`} event={event} surface="chat" />
            ))}
          </div>
          {newMessageCount > 0 ? (
            <button
              type="button"
              className={classes.newMessagesButton}
              onClick={scrollEventsToBottom}
            >
              {newMessagePillLabel(newMessageCount)}
            </button>
          ) : null}
        </div>
      )}
      <ResearchNavigationProvider value={navigationContext}>
        <ChatComposer
          projectId={projectId}
          placeholder="Continue the conversation… (⌘/Ctrl+Enter to send)"
          disabled={sending}
          onSubmit={handleSend}
          extraActions={isStreaming ? (
            <button
              type="button"
              className={classes.cancelButton}
              onClick={handleCancel}
            >
              Cancel turn
            </button>
          ) : null}
        />
      </ResearchNavigationProvider>
    </div>
  );
};

function renderStatusLabel(status: string, error: string | null): string {
  if (error) return `Error: ${error}`;
  switch (status) {
    case 'idle': return 'Idle';
    case 'loading': return 'Loading transcript…';
    case 'connecting': return 'Connecting…';
    case 'streaming': return 'Streaming';
    case 'reconnecting': return 'Reconnecting…';
    case 'error': return 'Error';
    case 'closed': return 'Disconnected';
    default: return status;
  }
}

export default ChatPane;
