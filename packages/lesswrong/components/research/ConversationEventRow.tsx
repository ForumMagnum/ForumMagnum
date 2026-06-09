'use client';

import React, { useCallback, useMemo, useState } from 'react';
import classNames from 'classnames';
import moment from 'moment-timezone';
import ForumIcon from '@/components/common/ForumIcon';
import { useTimezone } from '@/components/common/withTimezone';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { getConversationEventChunks, type ConversationEventChunk } from './conversationEventFormat';
import { ChunkContent } from './ChunkContent';
import type { ConversationEvent } from './hooks/useConversationStream';

const META_BODY_MAX_HEIGHT = 220;
const SUMMARY_MAX_CHARS = 300;

const styles = defineStyles('ConversationEventRow', (theme: ThemeType) => ({
  chatEvent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: 13,
    lineHeight: 1.5,
    borderRadius: 6,
    wordBreak: 'break-word',
    minWidth: 0,
  },
  chatUser: {
    background: theme.palette.greyAlpha(0.06),
    alignSelf: 'flex-end',
    maxWidth: '85%',
    padding: '4px 8px',
  },
  chatAssistant: {
    background: 'transparent',
    color: theme.palette.text.primary,
  },
  chatMetaOnly: {
    alignSelf: 'stretch',
  },
  agentEventRow: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    columnGap: 12,
    alignItems: 'baseline',
  },
  agentEventChunks: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 0,
  },
  speaker: {
    flex: 'none',
    fontSize: '0.7em',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: theme.palette.greyAlpha(0.5),
    userSelect: 'none',
  },
  speakerUser: {
    color: theme.palette.greyAlpha(0.7),
  },
  speakerAssistant: {
    color: theme.palette.primary.main,
  },
  speakerError: {
    color: theme.palette.error?.main ?? theme.palette.text.primary,
  },
  messageChunk: {
    color: theme.palette.text.primary,
    overflowWrap: 'anywhere',
    whiteSpace: 'normal',
  },
  metaDisclosure: {
    minWidth: 0,
    border: theme.palette.greyBorder('1px', 0.08),
    borderRadius: 4,
    background: theme.palette.greyAlpha(0.04),
    color: theme.palette.text.dim,
    overflow: 'hidden',
    fontFamily: 'monospace',
    fontSize: '0.85em',
  },
  metaDisclosureChat: {
    fontSize: 12,
  },
  metaDisclosureError: {
    color: theme.palette.error?.main ?? theme.palette.text.primary,
  },
  metaHeader: {
    width: '100%',
    minWidth: 0,
    border: 'none',
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 8px',
    font: 'inherit',
    textAlign: 'left',
    '&:hover': {
      background: theme.palette.greyAlpha(0.04),
    },
  },
  metaChevron: {
    '--icon-size': '12px',
    flex: 'none',
    color: theme.palette.greyAlpha(0.55),
    transition: 'transform 120ms ease',
  },
  metaChevronExpanded: {
    transform: 'rotate(90deg)',
  },
  metaLabel: {
    flex: 'none',
    fontWeight: 600,
    color: theme.palette.greyAlpha(0.65),
  },
  metaSummary: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: theme.palette.text.dim,
  },
  metaBody: {
    maxHeight: META_BODY_MAX_HEIGHT,
    overflowY: 'auto',
    borderTop: theme.palette.greyBorder('1px', 0.08),
    padding: '6px 8px',
    whiteSpace: 'pre-wrap',
    color: theme.palette.text.dim,
  },
  metaBodyText: {
    color: theme.palette.text.primary,
    overflowWrap: 'anywhere',
    whiteSpace: 'normal',
  },
  metaBodyThinking: {
    color: theme.palette.greyAlpha(0.55),
    fontStyle: 'italic',
    whiteSpace: 'pre-wrap',
  },
  metaBodyTool: {
    color: theme.palette.text.dim,
    whiteSpace: 'pre-wrap',
  },
}));

interface ConversationEventRowProps {
  event: ConversationEvent;
  surface: 'agentBlock' | 'chat';
}

export const ConversationEventRow = React.memo(function ConversationEventRow({
  event,
  surface,
}: ConversationEventRowProps) {
  const classes = useStyles(styles);
  const chunks = getConversationEventChunks(event);
  if (chunks.length === 0) return null;

  if (surface === 'agentBlock') {
    return <AgentBlockEventRow event={event} chunks={chunks} classes={classes} />;
  }

  return <ChatEventRow event={event} chunks={chunks} classes={classes} />;
});

interface EventRowClasses {
  agentEventChunks: string;
  agentEventRow: string;
  chatAssistant: string;
  chatEvent: string;
  chatMetaOnly: string;
  chatUser: string;
  messageChunk: string;
  metaBody: string;
  metaBodyText: string;
  metaBodyThinking: string;
  metaBodyTool: string;
  metaChevron: string;
  metaChevronExpanded: string;
  metaDisclosure: string;
  metaDisclosureChat: string;
  metaDisclosureError: string;
  metaHeader: string;
  metaLabel: string;
  metaSummary: string;
  speaker: string;
  speakerAssistant: string;
  speakerError: string;
  speakerUser: string;
}

function AgentBlockEventRow({
  event,
  chunks,
  classes,
}: {
  event: ConversationEvent;
  chunks: ConversationEventChunk[];
  classes: EventRowClasses;
}) {
  const speakerLabel = event.kind === 'user' ? 'You' : event.kind === 'error' ? 'Error' : 'Agent';
  const speakerClass = classNames(classes.speaker, {
    [classes.speakerUser]: event.kind === 'user',
    [classes.speakerAssistant]: event.kind === 'assistant',
    [classes.speakerError]: event.kind === 'error',
  });

  return (
    <div className={classes.agentEventRow}>
      <div className={speakerClass}>{speakerLabel}</div>
      <div className={classes.agentEventChunks}>
        {chunks.map((chunk, i) => (
          <EventChunk key={i} event={event} chunk={chunk} classes={classes} surface="agentBlock" />
        ))}
      </div>
    </div>
  );
}

function ChatEventRow({
  event,
  chunks,
  classes,
}: {
  event: ConversationEvent;
  chunks: ConversationEventChunk[];
  classes: EventRowClasses;
}) {
  const hasMessageChunk = chunks.some((chunk) => isMessageChunk(event, chunk));
  const rootClass = classNames(classes.chatEvent, {
    [classes.chatUser]: event.kind === 'user',
    [classes.chatAssistant]: event.kind === 'assistant' && hasMessageChunk,
    [classes.chatMetaOnly]: !hasMessageChunk,
  });
  const { timezone } = useTimezone();
  const timestampTitle = moment(event.createdAt).tz(timezone).format('LLL z');

  return (
    <div className={rootClass} title={timestampTitle}>
      {chunks.map((chunk, i) => (
        <EventChunk key={i} event={event} chunk={chunk} classes={classes} surface="chat" />
      ))}
    </div>
  );
}

function EventChunk({
  event,
  chunk,
  classes,
  surface,
}: {
  event: ConversationEvent;
  chunk: ConversationEventChunk;
  classes: EventRowClasses;
  surface: 'agentBlock' | 'chat';
}) {
  if (!isMessageChunk(event, chunk)) {
    return <CollapsibleEventChunk event={event} chunk={chunk} classes={classes} surface={surface} />;
  }

  return <ChunkContent chunk={chunk} className={classes.messageChunk} />;
}

function CollapsibleEventChunk({
  event,
  chunk,
  classes,
  surface,
}: {
  event: ConversationEvent;
  chunk: ConversationEventChunk;
  classes: EventRowClasses;
  surface: 'agentBlock' | 'chat';
}) {
  const [expanded, setExpanded] = useState(false);
  const { label, summary } = useMemo(
    () => getMetaSummary(event.kind, chunk),
    [event.kind, chunk],
  );
  const toggleExpanded = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setExpanded((value) => !value);
  }, []);

  return (
    <div
      className={classNames(
        classes.metaDisclosure,
        surface === 'chat' && classes.metaDisclosureChat,
        event.kind === 'error' && classes.metaDisclosureError,
      )}
    >
      <button
        type="button"
        className={classes.metaHeader}
        aria-expanded={expanded}
        onClick={toggleExpanded}
        onMouseDown={(e) => e.preventDefault()}
      >
        <ForumIcon
          icon="ChevronRight"
          className={classNames(classes.metaChevron, expanded && classes.metaChevronExpanded)}
        />
        <span className={classes.metaLabel}>{label}</span>
        <span className={classes.metaSummary}>{summary}</span>
      </button>
      {expanded ? (
        <div className={classes.metaBody}>
          <ChunkContent chunk={chunk} className={metaBodyClass(chunk, classes)} />
        </div>
      ) : null}
    </div>
  );
}

function isMessageChunk(event: ConversationEvent, chunk: ConversationEventChunk): boolean {
  return (event.kind === 'user' || event.kind === 'assistant') && chunk.kind === 'text';
}

function getMetaSummary(eventKind: string, chunk: ConversationEventChunk): { label: string; summary: string } {
  switch (chunk.kind) {
    case 'thinking':
      return { label: 'Thinking', summary: summarizeText(chunk.text) };
    case 'tool_use':
      return { label: 'Tool', summary: summarizeText(chunk.text) };
    case 'tool_result':
      return { label: 'Result', summary: summarizeText(chunk.text) };
    default:
      return {
        label: eventKind === 'error' ? 'Error' : labelForEventKind(eventKind),
        summary: summarizeText(chunk.text),
      };
  }
}

function labelForEventKind(kind: string): string {
  switch (kind) {
    case 'error': return 'Error';
    case 'thinking': return 'Thinking';
    case 'tool_use': return 'Tool';
    case 'tool_result': return 'Result';
    default: return 'Event';
  }
}

function summarizeText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return 'No payload';

  const lineCount = trimmed.split(/\r?\n/).length;
  const compact = trimmed.replace(/\s+/g, ' ');
  const clipped = compact.length > SUMMARY_MAX_CHARS
    ? compact.slice(0, SUMMARY_MAX_CHARS).trimEnd() + '...'
    : compact;

  return lineCount > 1 ? `${lineCount} lines - ${clipped}` : clipped;
}

function metaBodyClass(chunk: ConversationEventChunk, classes: EventRowClasses): string {
  switch (chunk.kind) {
    case 'thinking': return classes.metaBodyThinking;
    case 'tool_use':
    case 'tool_result': return classes.metaBodyTool;
    default: return classes.metaBodyText;
  }
}
