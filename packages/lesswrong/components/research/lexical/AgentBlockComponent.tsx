'use client';

import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import classNames from 'classnames';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey, type NodeKey } from 'lexical';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useConversationStream, type ConversationEvent } from '@/components/research/hooks/useConversationStream';
import { $isAgentBlockNode } from './AgentBlockNode';
import { UPDATE_AGENT_BLOCK_COMMAND } from './AgentBlockPlugin';
import { useResearchEditorEnvironment } from './ResearchEditorContext';
import { newResearchAnchorId } from './ResearchAnchorContext';

const styles = defineStyles('AgentBlockComponent', (theme: ThemeType) => ({
  root: {
    border: theme.palette.greyBorder('1px', 0.15),
    borderRadius: 6,
    padding: '12px 16px',
    margin: '12px 0',
    background: theme.palette.greyAlpha(0.02),
    fontSize: '0.95em',
    lineHeight: 1.5,
  },
  rootProvenance: {
    borderLeft: `3px solid ${theme.palette.greyAlpha(0.35)}`,
    background: theme.palette.greyAlpha(0.04),
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    fontSize: '0.8em',
    color: theme.palette.greyAlpha(0.6),
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  status: {
    fontStyle: 'italic',
  },
  statusError: {
    color: '#c33',
  },
  events: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  event: {
    padding: '4px 8px',
    borderRadius: 4,
  },
  eventUser: {
    background: theme.palette.greyAlpha(0.06),
    fontWeight: 500,
  },
  eventAssistant: {
    background: 'transparent',
  },
  eventThinking: {
    color: theme.palette.greyAlpha(0.55),
    fontStyle: 'italic',
    fontSize: '0.9em',
  },
  eventToolUse: {
    background: theme.palette.greyAlpha(0.04),
    fontFamily: 'monospace',
    fontSize: '0.85em',
  },
  eventToolResult: {
    background: theme.palette.greyAlpha(0.04),
    fontFamily: 'monospace',
    fontSize: '0.85em',
    color: theme.palette.greyAlpha(0.65),
  },
  eventError: {
    color: '#c33',
  },
  empty: {
    color: theme.palette.greyAlpha(0.5),
    fontStyle: 'italic',
  },
  removeButton: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '2px 6px',
    color: theme.palette.greyAlpha(0.55),
    fontSize: '0.85em',
    '&:hover': {
      color: theme.palette.greyAlpha(0.9),
    },
  },
  promptForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  promptInput: {
    width: '100%',
    boxSizing: 'border-box',
    minHeight: 60,
    resize: 'vertical',
    padding: 8,
    fontFamily: 'inherit',
    fontSize: 'inherit',
    border: theme.palette.greyBorder('1px', 0.2),
    borderRadius: 4,
    background: theme.palette.background.default,
    color: theme.palette.text.primary,
    outline: 'none',
    '&:focus': {
      borderColor: theme.palette.primary.main,
    },
  },
  promptActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
  },
  sendButton: {
    background: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    border: 'none',
    borderRadius: 4,
    padding: '6px 14px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.95em',
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  errorText: {
    color: '#c33',
    fontSize: '0.9em',
  },
}));

interface AgentBlockComponentProps {
  nodeKey: NodeKey;
  conversationId: string;
  producedByConversationId: string | null;
}

export function AgentBlockComponent({ nodeKey, conversationId, producedByConversationId }: AgentBlockComponentProps) {
  const classes = useStyles(styles);
  const [editor] = useLexicalComposerContext();

  const removeBlock = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isAgentBlockNode(node)) {
        node.remove();
      }
    });
  }, [editor, nodeKey]);

  const fromAgent = !!producedByConversationId;

  if (!conversationId) {
    return (
      <div className={classNames(classes.root, fromAgent && classes.rootProvenance)} data-testid="research-agent-block-empty">
        <div className={classes.header}>
          <span>Agent</span>
          <button
            type="button"
            className={classes.removeButton}
            onClick={removeBlock}
            aria-label="Remove agent block"
          >
            ×
          </button>
        </div>
        <PendingPromptForm nodeKey={nodeKey} onCancel={removeBlock} />
      </div>
    );
  }

  return (
    <ActiveAgentBlock
      nodeKey={nodeKey}
      conversationId={conversationId}
      fromAgent={fromAgent}
      removeBlock={removeBlock}
    />
  );
}

interface ActiveAgentBlockProps {
  nodeKey: NodeKey;
  conversationId: string;
  fromAgent: boolean;
  removeBlock: () => void;
}

function ActiveAgentBlock({ nodeKey: _nodeKey, conversationId, fromAgent, removeBlock }: ActiveAgentBlockProps) {
  const classes = useStyles(styles);
  const { events, status, error } = useConversationStream(conversationId);

  return (
    <div className={classNames(classes.root, fromAgent && classes.rootProvenance)} data-testid="research-agent-block">
      <div className={classes.header}>
        <span>Agent {fromAgent ? '· generated' : ''}</span>
        <span>
          <StatusLabel status={status} error={error} />
          <button
            type="button"
            className={classes.removeButton}
            onClick={removeBlock}
            aria-label="Remove agent block"
          >
            ×
          </button>
        </span>
      </div>
      <AgentBlockEvents events={events} status={status} />
    </div>
  );
}

interface PendingPromptFormProps {
  nodeKey: NodeKey;
  onCancel: () => void;
}

function PendingPromptForm({ nodeKey, onCancel }: PendingPromptFormProps) {
  const classes = useStyles(styles);
  const [editor] = useLexicalComposerContext();
  const env = useResearchEditorEnvironment();
  const [prompt, setPrompt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const submit = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const anchorId = newResearchAnchorId();
      const { conversationId } = await env.fireDocumentQuery({
        documentId: env.documentId,
        anchorId,
        prompt: trimmed,
      });
      editor.dispatchCommand(UPDATE_AGENT_BLOCK_COMMAND, { nodeKey, conversationId });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  }, [prompt, submitting, env, editor, nodeKey]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // The textarea lives inside a Lexical decorator node. Without stopping
    // propagation, every keystroke bubbles up to Lexical's KEY_* command
    // handlers — most visibly breaking Cmd/Opt+Backspace, which Lexical
    // interprets as document-level deletion before the textarea gets to
    // perform its native delete-line / delete-word behavior. Stop propagation
    // for everything; the textarea handles its own input natively.
    e.stopPropagation();
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void submit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className={classes.promptForm}>
      <textarea
        ref={textareaRef}
        className={classes.promptInput}
        placeholder="Ask the agent…  (⌘/Ctrl+Enter to send, Esc to cancel)"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={submitting}
      />
      {submitError ? <div className={classes.errorText}>{submitError}</div> : null}
      <div className={classes.promptActions}>
        <button
          type="button"
          className={classes.sendButton}
          onClick={() => void submit()}
          disabled={submitting || !prompt.trim()}
        >
          {submitting ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  );
}

interface StatusLabelProps {
  status: ReturnType<typeof useConversationStream>['status'];
  error: string | null;
}

function StatusLabel({ status, error }: StatusLabelProps) {
  const classes = useStyles(styles);
  if (status === 'error') return <span className={classNames(classes.status, classes.statusError)}>error: {error}</span>;
  if (status === 'reconnecting') return <span className={classes.status}>reconnecting…</span>;
  if (status === 'connecting') return <span className={classes.status}>connecting…</span>;
  if (status === 'streaming') return <span className={classes.status}>streaming</span>;
  if (status === 'loading') return <span className={classes.status}>loading…</span>;
  return null;
}

interface AgentBlockEventsProps {
  events: ConversationEvent[];
  status: ReturnType<typeof useConversationStream>['status'];
}

function AgentBlockEvents({ events, status }: AgentBlockEventsProps) {
  const classes = useStyles(styles);

  // Filter to user-facing event kinds. Hidden categories:
  //   - `system` — init handshake, model swap notices
  //   - `result` — Claude Code's final session-result wrapper
  //   - `unknown` — rate-limit notices and other untyped metadata
  // The persistence pipeline keeps the full transcript regardless.
  const VISIBLE = new Set(['user', 'assistant', 'thinking', 'tool_use', 'tool_result', 'error']);
  const sorted = useMemo(
    () => [...events].filter((e) => VISIBLE.has(e.kind)).sort((a, b) => a.seq - b.seq),
    [events],
  );

  if (sorted.length === 0) {
    return (
      <div className={classes.empty}>
        {status === 'loading' || status === 'connecting' ? 'Waiting for agent response…' : 'No output yet.'}
      </div>
    );
  }

  return (
    <div className={classes.events}>
      {sorted.map((event) => (
        <EventRow key={`${event.seq}-${event._id}`} event={event} />
      ))}
    </div>
  );
}

interface EventRowProps {
  event: ConversationEvent;
}

function EventRow({ event }: EventRowProps) {
  const classes = useStyles(styles);
  const text = extractDisplayText(event);

  switch (event.kind) {
    case 'user':
      return <div className={classNames(classes.event, classes.eventUser)}>{text}</div>;
    case 'assistant':
      return <div className={classNames(classes.event, classes.eventAssistant)}>{text}</div>;
    case 'thinking':
      return <div className={classNames(classes.event, classes.eventThinking)}>{text}</div>;
    case 'tool_use':
      return <div className={classNames(classes.event, classes.eventToolUse)}>{text}</div>;
    case 'tool_result':
      return <div className={classNames(classes.event, classes.eventToolResult)}>{text}</div>;
    case 'error':
      return <div className={classNames(classes.event, classes.eventError)}>{text}</div>;
    default:
      return <div className={classes.event}>{text}</div>;
  }
}

function extractDisplayText(event: ConversationEvent): string {
  const payload = event.payload as unknown;
  if (typeof payload === 'string') return payload;
  if (!payload || typeof payload !== 'object') return formatJSON(payload);

  const obj = payload as Record<string, unknown>;

  // Claude Code stream-json shape: top-level object has `type` plus a nested
  // `message` object (for assistant/user) or `content` (for tool_use/tool_result).
  // Peel one level so the rest of the formatter sees the inner shape.
  const inner =
    obj.message && typeof obj.message === 'object'
      ? (obj.message as Record<string, unknown>)
      : obj;

  if (typeof inner.text === 'string') return inner.text;
  if (typeof inner.content === 'string') return inner.content;
  if (Array.isArray(inner.content)) {
    const parts = inner.content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object') {
          const p = part as Record<string, unknown>;
          if (typeof p.text === 'string') return p.text;
          if (p.type === 'tool_use' && typeof p.name === 'string') {
            return `${p.name}(${formatJSON(p.input)})`;
          }
          if (p.type === 'tool_result') {
            const c = p.content;
            if (typeof c === 'string') return c;
            if (Array.isArray(c)) {
              return c.map((x) => (typeof x === 'object' && x !== null && typeof (x as Record<string, unknown>).text === 'string' ? (x as Record<string, string>).text : formatJSON(x))).join('\n');
            }
            return formatJSON(c);
          }
        }
        return '';
      })
      .filter(Boolean);
    if (parts.length > 0) return parts.join('\n');
  }
  if (event.kind === 'tool_use' && typeof inner.name === 'string') {
    return `${inner.name}(${formatJSON(inner.input)})`;
  }
  if (event.kind === 'tool_result') {
    return formatJSON(inner.output ?? inner.result ?? inner);
  }
  return formatJSON(payload);
}

function formatJSON(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
