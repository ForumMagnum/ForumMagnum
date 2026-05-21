"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import gqlTag from 'graphql-tag';
import { gql } from '@/lib/generated/gql-codegen';
import { useMutation, useApolloClient } from '@apollo/client/react';
import { useQuery } from '@/lib/crud/useQuery';
import { pollForConversationTitle, ProjectSidebarQuery } from './projectSidebarQuery';
import { CurrentWorkspaceReposQuery } from './currentWorkspaceReposQuery';
import classNames from 'classnames';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import {
  markConversationActivityExpected,
  useConversationStream,
  type ConversationEvent,
} from './hooks/useConversationStream';
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

const FireChatConversationMutation = gqlTag(`
  mutation FireChatPaneConversation($conversationId: String!, $projectId: String!, $activeDocumentId: String!, $promptHtml: String!, $workspaceRepoId: String) {
    fireResearchConversation(input: { conversationId: $conversationId, projectId: $projectId, kind: chat, activeDocumentId: $activeDocumentId, promptHtml: $promptHtml, workspaceRepoId: $workspaceRepoId }) {
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

const ChatPaneConversationMetadataQuery = gqlTag(`
  query ChatPaneConversationMetadata($projectId: String!) {
    researchConversations(selector: { byProject: { projectId: $projectId } }, limit: 200) {
      results {
        _id
        workspaceRepoId
      }
    }
  }
`);

const MintDevPreviewUrlMutation = gqlTag(`
  mutation MintDevPreviewUrlFromChatPane($conversationId: String!) {
    mintDevPreviewUrl(conversationId: $conversationId) {
      url
    }
  }
`);

interface FireChatConversationData {
  fireResearchConversation: { conversationId: string } | null;
}

interface FireChatConversationVariables {
  conversationId: string;
  projectId: string;
  activeDocumentId: string;
  promptHtml: string;
  workspaceRepoId: string | null;
}

interface ChatPaneConversationMetadataData {
  researchConversations: {
    results: Array<{
      _id: string;
      workspaceRepoId: string | null;
    }>;
  } | null;
}

interface ChatPaneConversationMetadataVariables {
  projectId: string;
}

interface MintDevPreviewUrlData {
  mintDevPreviewUrl: { url: string } | null;
}

interface MintDevPreviewUrlVariables {
  conversationId: string;
}

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
  actionButton: {
    padding: '6px 14px',
    borderRadius: 4,
    background: 'transparent',
    color: theme.palette.text.dim,
    border: theme.palette.greyBorder('1px', 0.15),
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    fontFamily: 'inherit',
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  previewLink: {
    alignSelf: 'center',
    fontSize: 12,
    color: theme.palette.primary.main,
    textDecoration: 'none',
    maxWidth: 120,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  repoSelect: {
    height: 31,
    minWidth: 130,
    maxWidth: 220,
    borderRadius: 4,
    border: theme.palette.greyBorder('1px', 0.15),
    background: theme.palette.background.default,
    color: theme.palette.text.primary,
    fontSize: 13,
    fontFamily: 'inherit',
    padding: '0 8px',
    cursor: 'pointer',
    '&:disabled': {
      color: theme.palette.text.dim,
      cursor: 'not-allowed',
    },
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
  const [openingPreview, setOpeningPreview] = useState(false);
  const [devPreviewUrl, setDevPreviewUrl] = useState<string | null>(null);
  const [newConversationWorkspaceRepoId, setNewConversationWorkspaceRepoId] = useState<string | null>(null);
  const eventsRef = useRef<HTMLDivElement | null>(null);

  const { events: rawEvents, status, error, refresh, injectOptimisticEvent } = useConversationStream(conversationId);
  // Hide system init / session-result wrappers / rate-limit notices that the
  // hook delivers; the chat surface only renders user-facing turn events.
  const events = useMemo<ConversationEvent[]>(
    () => rawEvents.filter(isVisibleConversationEvent),
    [rawEvents],
  );
  const [fireConversation] = useMutation<FireChatConversationData, FireChatConversationVariables>(FireChatConversationMutation, {
    refetchQueries: [ProjectSidebarQuery],
  });
  const [continueConversation] = useMutation(ContinueResearchConversationMutation);
  const [cancelConversation] = useMutation(CancelResearchConversationMutation);
  const [mintDevPreviewUrl] = useMutation<MintDevPreviewUrlData, MintDevPreviewUrlVariables>(MintDevPreviewUrlMutation);

  const { data: workspaceReposData } = useQuery(CurrentWorkspaceReposQuery, {
    fetchPolicy: 'cache-first',
  });
  const workspaceRepos = useMemo(
    () => workspaceReposData?.currentWorkspaceRepos ?? [],
    [workspaceReposData],
  );

  const { data: conversationMetadataData } = useQuery<ChatPaneConversationMetadataData, ChatPaneConversationMetadataVariables>(ChatPaneConversationMetadataQuery, {
    variables: { projectId },
    skip: !conversationId,
    fetchPolicy: 'cache-and-network',
  });
  const activeConversationHasWorkspaceRepo = !!conversationMetadataData
    ?.researchConversations
    ?.results
    .find((conversation) => conversation._id === conversationId)
    ?.workspaceRepoId;

  useEffect(() => {
    setDevPreviewUrl(null);
  }, [conversationId]);

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
        // Client-generated id, but don't mount the stream hook against it until
        // the server has created the row. Otherwise the transcript query can
        // beat `fireResearchConversation`'s insert and trip "Conversation not
        // found" during normal startup.
        const newId = randomId();
        markConversationActivityExpected(newId);
        const result = await fireConversation({
          variables: {
            conversationId: newId,
            projectId,
            activeDocumentId,
            promptHtml,
            workspaceRepoId: newConversationWorkspaceRepoId,
          },
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
    }
  }, [sending, conversationId, projectId, activeDocumentId, fireConversation, continueConversation, onConversationCreated, refresh, injectOptimisticEvent, apolloClient, flash, newConversationWorkspaceRepoId]);

  const handleCancel = useCallback(async () => {
    if (!conversationId) return;
    await cancelConversation({ variables: { conversationId } });
  }, [cancelConversation, conversationId]);

  const handleOpenDevPreview = useCallback(async () => {
    if (!conversationId || openingPreview) return;
    const previewWindow = window.open('about:blank', '_blank');
    if (previewWindow) {
      previewWindow.opener = null;
      previewWindow.document.title = 'Opening preview...';
      previewWindow.document.body.textContent = 'Starting dev preview...';
    }
    setOpeningPreview(true);
    try {
      const result = await mintDevPreviewUrl({ variables: { conversationId } });
      const url = result.data?.mintDevPreviewUrl?.url;
      if (!url) throw new Error('mintDevPreviewUrl returned no URL');
      setDevPreviewUrl(url);
      if (previewWindow) {
        previewWindow.location.href = url;
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      previewWindow?.close();
      // eslint-disable-next-line no-console
      console.error('[research] dev preview failed', err);
      flash({ messageString: 'Failed to open dev preview — check that this repo defines a dev command.', type: 'error' });
    } finally {
      setOpeningPreview(false);
    }
  }, [conversationId, openingPreview, mintDevPreviewUrl, flash]);

  const isStreaming = status === 'streaming' || status === 'connecting';

  const navigationContext = useMemo<ResearchNavigationContextValue>(() => ({
    navigateToDocument: onSelectDocument,
    openConversationInChat: onOpenConversationInChat,
    host: conversationId ? { kind: 'conversation', conversationId } : undefined,
  }), [conversationId, onSelectDocument, onOpenConversationInChat]);

  const newChatExtraActions = !conversationId && workspaceRepos.length > 0 ? (
    <select
      className={classes.repoSelect}
      value={newConversationWorkspaceRepoId ?? ''}
      onChange={(event) => setNewConversationWorkspaceRepoId(event.target.value || null)}
      disabled={sending}
      title="Workspace repo"
      aria-label="Workspace repo"
    >
      <option value="">No repo</option>
      {workspaceRepos.map((repo) => (
        <option key={repo._id} value={repo._id}>
          {repo.owner}/{repo.name}{repo.devCommand ? '' : ' (no dev server)'}
        </option>
      ))}
    </select>
  ) : null;

  const existingChatExtraActions = (
    <>
      {activeConversationHasWorkspaceRepo ? (
        <button
          type="button"
          className={classes.actionButton}
          onClick={handleOpenDevPreview}
          disabled={openingPreview}
        >
          {openingPreview ? 'Starting preview...' : 'Open preview'}
        </button>
      ) : null}
      {devPreviewUrl ? (
        <a
          className={classes.previewLink}
          href={devPreviewUrl}
          target="_blank"
          rel="noreferrer"
          title={devPreviewUrl}
        >
          Preview URL
        </a>
      ) : null}
      {isStreaming ? (
        <button
          type="button"
          className={classes.actionButton}
          onClick={handleCancel}
        >
          Cancel turn
        </button>
      ) : null}
    </>
  );

  if (!conversationId) {
    return (
      <div className={classes.root}>
        <div className={classes.empty}>
          <div>Start a new chat by typing a prompt below.</div>
        </div>
        <ResearchNavigationProvider value={navigationContext}>
          <ChatComposer
            projectId={projectId}
            placeholder="Ask anything…"
            disabled={sending || !activeDocumentId}
            onSubmit={handleSend}
            extraActions={newChatExtraActions}
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
          extraActions={existingChatExtraActions}
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
