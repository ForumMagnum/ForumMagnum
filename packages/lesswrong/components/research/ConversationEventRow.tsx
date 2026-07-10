'use client';

import React, { useCallback, useMemo, useState } from 'react';
import classNames from 'classnames';
import moment from '@/lib/moment-timezone';
import { useTimezone } from '@/components/common/withTimezone';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { getConversationEventChunks, type ConversationEventChunk } from './conversationEventFormat';
import { ChunkContent } from './ChunkContent';
import { researchChatProse, researchChatSans, researchMono, researchTransition, researchWarmAlpha, researchRadius } from './researchStyleUtils';
import type { ConversationEvent } from './hooks/useConversationStream';

const META_BODY_MAX_HEIGHT = 240;
const SUMMARY_MAX_CHARS = 200;

const styles = defineStyles('ConversationEventRow', (theme: ThemeType) => ({
  row: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
    wordBreak: 'break-word',
  },
  rowUser: {
    margin: '12px 0 4px',
    '&:first-child': {
      marginTop: 0,
    },
  },
  rowAssistant: {
    margin: '6px 0',
  },
  rowMeta: {
    margin: '1px 0',
  },
  userRow: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    columnGap: 8,
    alignItems: 'baseline',
    padding: '6px 10px 6px 9px',
    borderRadius: researchRadius.sm,
    border: `1px solid ${researchWarmAlpha(0.12)}`,
    fontSize: 13,
    lineHeight: 1.5,
    color: theme.palette.text.primary,
  },
  userContent: {
    ...researchChatProse(theme),
    fontSize: 13.5,
    fontFamily: researchChatSans,
  },
  userMarker: {
    fontFamily: researchMono,
    fontSize: 11,
    color: researchWarmAlpha(0.45),
    userSelect: 'none',
  },
  assistantText: {
    ...researchChatProse(theme),
    fontSize: 14.5,
    lineHeight: 1.6,
    fontFamily: researchChatSans,
    color: theme.palette.text.primary,
    overflowWrap: 'anywhere',
  },
  metaLine: {
    minWidth: 0,
  },
  metaHeader: {
    width: '100%',
    minWidth: 0,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'baseline',
    gap: 7,
    padding: '1px 4px 1px 0',
    borderRadius: researchRadius.xs,
    fontFamily: researchMono,
    fontSize: 11.5,
    lineHeight: '18px',
    color: theme.palette.text.dim,
    textAlign: 'left',
    transition: `background ${researchTransition}`,
    '&:hover': {
      background: researchWarmAlpha(0.04),
    },
  },
  metaGlyph: {
    flex: 'none',
    userSelect: 'none',
    color: researchWarmAlpha(0.45),
  },
  metaGlyphTool: {
    color: theme.palette.primary.main,
  },
  metaGlyphError: {
    color: theme.palette.error?.main ?? theme.palette.text.primary,
  },
  metaLabel: {
    flex: 'none',
    fontWeight: 600,
    color: researchWarmAlpha(0.6),
  },
  metaLabelError: {
    color: theme.palette.error?.main ?? theme.palette.text.primary,
  },
  metaSummary: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  metaSummaryThinking: {
    fontStyle: 'italic',
  },
  metaIndented: {
    paddingLeft: 16,
  },
  metaBody: {
    maxHeight: META_BODY_MAX_HEIGHT,
    overflowY: 'auto',
    margin: '2px 0 4px 16px',
    padding: '6px 9px',
    borderLeft: `2px solid ${researchWarmAlpha(0.1)}`,
    fontFamily: researchMono,
    fontSize: 11.5,
    lineHeight: 1.55,
    whiteSpace: 'pre-wrap',
    color: theme.palette.text.dim,
    overflowWrap: 'anywhere',
  },
  metaBodyThinking: {
    fontFamily: researchChatSans,
    fontSize: 13.5,
    fontStyle: 'italic',
    color: researchWarmAlpha(0.6),
    whiteSpace: 'normal',
  },
  metaBodyProse: researchChatProse(theme),
}));

interface ConversationEventRowProps {
  event: ConversationEvent;
}

export const ConversationEventRow = React.memo(function ConversationEventRow({
  event,
}: ConversationEventRowProps) {
  const classes = useStyles(styles);
  const { timezone } = useTimezone();
  const chunks = getConversationEventChunks(event);
  if (chunks.length === 0) return null;

  const timestampTitle = moment(event.createdAt).tz(timezone).format('LLL z');

  if (event.kind === 'user') {
    return (
      <div className={classNames(classes.row, classes.rowUser)} title={timestampTitle}>
        {chunks.map((chunk, i) =>
          chunk.kind === 'text' ? (
            <div key={i} className={classes.userRow}>
              <span className={classes.userMarker}>❯</span>
              <ChunkContent chunk={chunk} className={classes.userContent} />
            </div>
          ) : (
            <MetaLine key={i} eventKind={event.kind} chunk={chunk} />
          ),
        )}
      </div>
    );
  }

  const rowKindClass = event.kind === 'assistant' ? classes.rowAssistant : classes.rowMeta;
  return (
    <div className={classNames(classes.row, rowKindClass)} title={timestampTitle}>
      {chunks.map((chunk, i) =>
        event.kind === 'assistant' && chunk.kind === 'text' ? (
          <ChunkContent key={i} chunk={chunk} className={classes.assistantText} />
        ) : (
          <MetaLine key={i} eventKind={event.kind} chunk={chunk} />
        ),
      )}
    </div>
  );
});

interface MetaLineMeta {
  glyph: string;
  glyphClass?: 'tool' | 'error';
  label: string;
  summary: string;
  indented: boolean;
  thinking: boolean;
}

function getMetaLineMeta(eventKind: string, chunk: ConversationEventChunk): MetaLineMeta {
  if (eventKind === 'error') {
    return { glyph: '✕', glyphClass: 'error', label: 'error', summary: summarizeText(chunk.text), indented: false, thinking: false };
  }
  switch (chunk.kind) {
    case 'thinking':
      return { glyph: '✻', label: 'thinking', summary: summarizeText(chunk.text), indented: false, thinking: true };
    case 'tool_use': {
      const { name, args } = splitToolCall(chunk.text);
      return { glyph: '⏺', glyphClass: 'tool', label: name, summary: summarizeText(args), indented: false, thinking: false };
    }
    case 'tool_result':
      return { glyph: '⎿', label: '', summary: summarizeText(chunk.text), indented: true, thinking: false };
    default:
      return { glyph: '·', label: eventKind, summary: summarizeText(chunk.text), indented: false, thinking: false };
  }
}

function MetaLine({
  eventKind,
  chunk,
}: {
  eventKind: string;
  chunk: ConversationEventChunk;
}) {
  const classes = useStyles(styles);
  const [expanded, setExpanded] = useState(false);
  const meta = useMemo(() => getMetaLineMeta(eventKind, chunk), [eventKind, chunk]);

  const toggleExpanded = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setExpanded((value) => !value);
  }, []);

  return (
    <div className={classNames(classes.metaLine, meta.indented && classes.metaIndented)}>
      <button
        type="button"
        className={classes.metaHeader}
        aria-expanded={expanded}
        onClick={toggleExpanded}
        onMouseDown={(e) => e.preventDefault()}
      >
        <span
          className={classNames(classes.metaGlyph, {
            [classes.metaGlyphTool]: meta.glyphClass === 'tool',
            [classes.metaGlyphError]: meta.glyphClass === 'error',
          })}
        >
          {meta.glyph}
        </span>
        {meta.label ? (
          <span className={classNames(classes.metaLabel, meta.glyphClass === 'error' && classes.metaLabelError)}>
            {meta.label}
          </span>
        ) : null}
        <span className={classNames(classes.metaSummary, meta.thinking && classes.metaSummaryThinking)}>
          {meta.summary}
        </span>
      </button>
      {expanded ? (
        <div className={classNames(classes.metaBody, chunk.kind === 'thinking' && classes.metaBodyThinking)}>
          {chunk.kind === 'thinking' ? (
            <ChunkContent chunk={chunk} className={classes.metaBodyProse} />
          ) : (
            chunk.text
          )}
        </div>
      ) : null}
    </div>
  );
}

function splitToolCall(text: string): { name: string; args: string } {
  const parenIdx = text.indexOf('(');
  if (parenIdx === -1) return { name: text, args: '' };
  let args = text.slice(parenIdx + 1);
  if (args.endsWith(')')) args = args.slice(0, -1);
  return { name: text.slice(0, parenIdx), args };
}

function summarizeText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  const compact = trimmed.replace(/\s+/g, ' ');
  return compact.length > SUMMARY_MAX_CHARS
    ? compact.slice(0, SUMMARY_MAX_CHARS).trimEnd() + '…'
    : compact;
}
