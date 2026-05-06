"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { gql } from '@/lib/generated/gql-codegen';
import { useMutation } from '@apollo/client/react';
import classNames from 'classnames';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import { useConversationStream, type ConversationEvent } from './hooks/useConversationStream';
import Loading from '../vulcan-core/Loading';

interface ChatPaneProps {
  projectId: string;
  conversationId: string | null;
  onConversationCreated: (conversationId: string) => void;
}

const FireChatConversationMutation = gql(`
  mutation FireChatPaneConversation($projectId: String!, $entrypoint: JSON!, $prompt: String!) {
    fireResearchConversation(input: { projectId: $projectId, entrypoint: $entrypoint, prompt: $prompt }) {
      conversationId
    }
  }
`);

const ContinueResearchConversationMutation = gql(`
  mutation ContinueResearchConversationFromChatPane($conversationId: String!, $prompt: String!) {
    continueResearchConversation(conversationId: $conversationId, prompt: $prompt) {
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
    padding: '8px 12px',
    borderRadius: 6,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  eventUser: {
    background: theme.palette.greyAlpha(0.06),
    alignSelf: 'flex-end',
    maxWidth: '85%',
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
  },
  eventThinking: {
    fontStyle: 'italic',
    color: theme.palette.text.dim,
  },
  eventError: {
    background: theme.palette.greyAlpha(0.04),
    color: theme.palette.error?.main ?? 'red',
  },
  composer: {
    borderTop: theme.palette.greyBorder('1px', 0.1),
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  textarea: {
    width: '100%',
    minHeight: 80,
    padding: 8,
    border: theme.palette.greyBorder('1px', 0.15),
    borderRadius: 4,
    fontFamily: 'inherit',
    fontSize: 14,
    resize: 'vertical',
    background: theme.palette.background.default,
    color: theme.palette.text.primary,
  },
  composerActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
  },
  button: {
    padding: '6px 14px',
    border: 'none',
    borderRadius: 4,
    background: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    fontFamily: 'inherit',
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  cancelButton: {
    background: 'transparent',
    color: theme.palette.text.dim,
    border: theme.palette.greyBorder('1px', 0.15),
  },
}));

const ChatPane = ({ projectId, conversationId, onConversationCreated }: ChatPaneProps) => {
  const classes = useStyles(styles);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const eventsRef = useRef<HTMLDivElement | null>(null);

  const { events, status, error } = useConversationStream(conversationId);
  const [fireConversation] = useMutation(FireChatConversationMutation);
  const [continueConversation] = useMutation(ContinueResearchConversationMutation);
  const [cancelConversation] = useMutation(CancelResearchConversationMutation);

  // Auto-scroll to bottom when new events arrive.
  useEffect(() => {
    const el = eventsRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [events.length]);

  const handleSend = useCallback(async () => {
    const prompt = draft.trim();
    if (!prompt || sending) return;
    setSending(true);
    try {
      if (!conversationId) {
        const result = await fireConversation({
          variables: { projectId, entrypoint: { kind: 'chat' }, prompt },
        });
        const newId = result.data?.fireResearchConversation?.conversationId;
        if (newId) {
          onConversationCreated(newId);
          setDraft('');
        }
      } else {
        await continueConversation({ variables: { conversationId, prompt } });
        setDraft('');
      }
    } finally {
      setSending(false);
    }
  }, [draft, sending, conversationId, projectId, fireConversation, continueConversation, onConversationCreated]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        void handleSend();
      }
    },
    [handleSend],
  );

  const handleCancel = useCallback(async () => {
    if (!conversationId) return;
    await cancelConversation({ variables: { conversationId } });
  }, [cancelConversation, conversationId]);

  const isStreaming = status === 'streaming' || status === 'connecting';

  if (!conversationId) {
    return (
      <div className={classes.root}>
        <div className={classes.empty}>
          <div>Start a new chat by typing a prompt below.</div>
        </div>
        <div className={classes.composer}>
          <textarea
            className={classes.textarea}
            placeholder="Ask anything…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
          />
          <div className={classes.composerActions}>
            <button
              className={classes.button}
              onClick={handleSend}
              disabled={sending || !draft.trim()}
            >
              Send
            </button>
          </div>
        </div>
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
      <div className={classes.composer}>
        <textarea
          className={classes.textarea}
          placeholder="Continue the conversation… (⌘/Ctrl+Enter to send)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
        />
        <div className={classes.composerActions}>
          {isStreaming ? (
            <button
              className={classNames(classes.button, classes.cancelButton)}
              onClick={handleCancel}
            >
              Cancel turn
            </button>
          ) : null}
          <button
            className={classes.button}
            onClick={handleSend}
            disabled={sending || !draft.trim()}
          >
            Send
          </button>
        </div>
      </div>
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

function EventRow({ event, classes }: { event: ConversationEvent; classes: EventRowClasses }) {
  const text = extractEventText(event);
  const className = classNames(classes.event, {
    [classes.eventUser]: event.kind === 'user',
    [classes.eventAssistant]: event.kind === 'assistant',
    [classes.eventTool]: event.kind === 'tool_use' || event.kind === 'tool_result',
    [classes.eventThinking]: event.kind === 'thinking',
    [classes.eventError]: event.kind === 'error',
  });
  return <div className={className}>{text}</div>;
}

/**
 * Best-effort plain-text rendering of a Claude Code JSONL event payload.
 * The supervisor passes the parsed JSONL line through verbatim, so the shape
 * is whatever Claude Code emits. We probe for common text-bearing fields and
 * fall back to a JSON dump so streamed events are at least visible during
 * development. Real rendering of tool calls, thinking blocks, etc. is up to
 * a future pass once the event corpus is concrete.
 */
function extractEventText(event: ConversationEvent): string {
  const payload = event.payload as Record<string, unknown> | string | null | undefined;
  if (typeof payload === 'string') return payload;
  if (!payload || typeof payload !== 'object') return `[${event.kind}]`;

  const message = (payload as { message?: { content?: unknown } }).message;
  if (message && typeof message === 'object') {
    const content = (message as { content?: unknown }).content;
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      const parts = content
        .map((part: unknown) => {
          if (typeof part === 'string') return part;
          if (part && typeof part === 'object' && 'text' in part && typeof (part as { text?: unknown }).text === 'string') {
            return (part as { text: string }).text;
          }
          return '';
        })
        .filter(Boolean);
      if (parts.length > 0) return parts.join('');
    }
  }

  const text = (payload as { text?: unknown }).text;
  if (typeof text === 'string') return text;

  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return `[${event.kind}]`;
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
