"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gql } from '@/lib/generated/gql-codegen';
import { useMutation, useApolloClient } from '@apollo/client/react';
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
import {
  getConversationEventChunks,
  isVisibleConversationEvent,
  type ConversationEventChunk,
} from './conversationEventFormat';
import { ChunkContent } from './ChunkContent';

interface ChatPaneProps {
  projectId: string;
  conversationId: string | null;
  activeDocumentId: string | null;
  onConversationCreated: (conversationId: string) => void;
  onSelectDocument: (documentId: string) => void;
  onOpenConversationInChat: (conversationId: string) => void;
}

const FireChatConversationMutation = gql(`
  mutation FireChatPaneConversation($conversationId: String!, $projectId: String!, $activeDocumentId: String!, $promptHtml: String!) {
    fireResearchConversation(input: { conversationId: $conversationId, projectId: $projectId, kind: chat, activeDocumentId: $activeDocumentId, promptHtml: $promptHtml }) {
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
  event: {
    fontSize: 13,
    lineHeight: 1.5,
    borderRadius: 6,
    wordBreak: 'break-word',
  },
  eventUser: {
    background: theme.palette.greyAlpha(0.06),
    alignSelf: 'flex-end',
    maxWidth: '85%',
    padding: '4px 8px',
  },
  eventAssistant: {
    background: 'transparent',
    color: theme.palette.text.primary,
  },
  eventTool: {
    fontFamily: 'monospace',
    fontSize: 12,
    background: theme.palette.greyAlpha(0.04),
    color: theme.palette.text.dim,
    border: theme.palette.greyBorder('1px', 0.08),
    '$eventAssistant &': {
      padding: '4px 8px',
    },
    '$eventTool &': {
      padding: '4px 8px',
    },
  },
  eventThinking: {
    fontStyle: 'italic',
    color: theme.palette.text.dim,
  },
  eventError: {
    background: theme.palette.greyAlpha(0.04),
    color: theme.palette.error?.main ?? 'red',
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

  const { events: rawEvents, status, error, refresh, injectOptimisticEvent } = useConversationStream(conversationId);
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

  // Auto-scroll to bottom when new events arrive.
  useEffect(() => {
    const el = eventsRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [events.length]);

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
        onConversationCreated(createdId);
        void pollForConversationTitle(apolloClient, projectId, createdId);
      } else {
        // Optimistic plaintext for the in-flight turn; the persisted twin
        // (with the server's markdown rendering) replaces it on the next
        // refresh() — SSE doesn't broadcast backend `appendUserTurn` writes.
        const optimisticText = htmlToTextDefault(promptHtml);
        injectOptimisticEvent({
          _id: `optimistic:user:${randomId()}`,
          conversationId,
          seq: -1,
          kind: 'user',
          claudeMessageUuid: null,
          payload: { type: 'user', text: optimisticText },
          createdAt: new Date().toISOString(),
        });
        await continueConversation({ variables: { conversationId, promptHtml, activeDocumentId } });
        refresh();
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[research] chat send failed', err);
      flash({ messageString: 'Failed to send message — try again.', type: 'error' });
    } finally {
      setSending(false);
      setPendingPrompt(null);
    }
  }, [sending, conversationId, projectId, activeDocumentId, fireConversation, continueConversation, onConversationCreated, refresh, injectOptimisticEvent, apolloClient, flash]);

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
            <div className={classNames(classes.event, classes.eventUser)}>{pendingPrompt}</div>
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
        {renderStatusLabel(status, error)}
      </div>
      {status === 'loading' && events.length === 0 ? (
        <div className={classes.events}><Loading /></div>
      ) : (
        <div className={classes.events} ref={eventsRef}>
          {events.map((event) => (
            <EventRow key={event._id ?? `${event.conversationId}:${event.seq}`} event={event} classes={classes} />
          ))}
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

interface EventRowClasses {
  event: string;
  eventUser: string;
  eventAssistant: string;
  eventTool: string;
  eventThinking: string;
  eventError: string;
}

const EventRow = React.memo(function EventRow({ event, classes }: { event: ConversationEvent; classes: EventRowClasses }) {
  const chunks = getConversationEventChunks(event);
  if (chunks.length === 0) return null;
  const outerClass = classNames(classes.event, {
    [classes.eventUser]: event.kind === 'user',
    [classes.eventAssistant]: event.kind === 'assistant',
    [classes.eventTool]: event.kind === 'tool_use' || event.kind === 'tool_result',
    [classes.eventThinking]: event.kind === 'thinking',
    [classes.eventError]: event.kind === 'error',
  });
  return (
    <div className={outerClass}>
      {chunks.map((chunk, i) => (
        <ChunkContent key={i} chunk={chunk} className={chunkClass(chunk, classes)} />
      ))}
    </div>
  );
});

function chunkClass(chunk: ConversationEventChunk, classes: EventRowClasses): string | undefined {
  switch (chunk.kind) {
    case 'thinking': return classes.eventThinking;
    case 'tool_use':
    case 'tool_result': return classes.eventTool;
    default: return undefined;
  }
}

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
