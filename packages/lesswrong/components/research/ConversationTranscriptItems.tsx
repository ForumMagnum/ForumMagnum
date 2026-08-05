import React, { useMemo, useState, type ReactNode } from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { researchMono, researchRadius, researchTransition, researchWarmAlpha } from './researchStyleUtils';
import { getConversationEventChunks, isPlainRecord } from './conversationEventFormat';
import { ConversationEventRow, MetaLine } from './ConversationEventRow';
import {
  describeToolGroup,
  groupCalls,
  type TranscriptItem,
  type TranscriptRunEntry,
} from './transcriptItems';
import type { ConversationEvent } from './hooks/useConversationStream';

const styles = defineStyles('ConversationTranscriptItems', (theme: ThemeType) => ({
  header: {
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
  glyph: {
    flex: 'none',
    userSelect: 'none',
    color: researchWarmAlpha(0.45),
    transform: 'translateY(-1px)',
  },
  glyphTool: {
    color: theme.palette.primary.main,
  },
  label: {
    flex: 'none',
    fontWeight: 600,
    color: researchWarmAlpha(0.6),
  },
  summary: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  failed: {
    color: theme.palette.error?.main ?? theme.palette.text.primary,
  },
  body: {
    marginLeft: 3,
    paddingLeft: 10,
    borderLeft: `1px solid ${researchWarmAlpha(0.12)}`,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  },
  reportLabel: {
    marginTop: 4,
    fontFamily: researchMono,
    fontSize: 9.5,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: researchWarmAlpha(0.5),
  },
}));

export interface TranscriptItemsListProps {
  items: TranscriptItem<ConversationEvent>[];
  turnInFlight: boolean;
  renderEvent: (event: ConversationEvent) => ReactNode;
}

export const TranscriptItemsList = ({ items, turnInFlight, renderEvent }: TranscriptItemsListProps) => {
  return (
    <>
      {items.map((item) => {
        switch (item.type) {
          case 'event':
            return (
              <React.Fragment key={item.event._id ?? `e:${item.event.seq}`}>
                {renderEvent(item.event)}
              </React.Fragment>
            );
          case 'tool':
            return (
              <ToolEntryRow
                key={`t:${item.entry.event.seq}:${item.entry.kind}`}
                entry={item.entry}
              />
            );
          case 'toolGroup':
            return <ToolGroupRow key={`g:${item.key}`} entries={item.entries} />;
          case 'subagent':
            return (
              <SubagentRow
                key={`s:${item.key}`}
                item={item}
                turnInFlight={turnInFlight}
                renderEvent={renderEvent}
              />
            );
        }
      })}
    </>
  );
};

const ToolEntryRow = ({ entry }: { entry: TranscriptRunEntry<ConversationEvent> }) => {
  if (entry.kind === 'call') {
    return <MetaLine eventKind="assistant" chunk={entry.chunk} />;
  }
  return <ConversationEventRow event={entry.event} />;
};

const ToolGroupRow = ({ entries }: { entries: TranscriptRunEntry<ConversationEvent>[] }) => {
  const classes = useStyles(styles);
  const [expanded, setExpanded] = useState(false);
  const calls = useMemo(() => groupCalls(entries), [entries]);
  const label = useMemo(() => describeToolGroup(calls), [calls]);
  const failedCount = useMemo(
    () =>
      entries.filter(
        (e) =>
          e.kind === 'result' &&
          getConversationEventChunks(e.event).some((c) => c.kind === 'tool_result' && c.isError),
      ).length,
    [entries],
  );
  return (
    <div>
      <button
        type="button"
        className={classes.header}
        aria-expanded={expanded}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setExpanded((v) => !v);
        }}
        onMouseDown={(e) => e.preventDefault()}
      >
        <span className={classNames(classes.glyph, classes.glyphTool)}>{expanded ? '▾' : '▸'}</span>
        <span className={classes.summary}>
          {label}
          {failedCount > 0 ? <span className={classes.failed}> · {failedCount} failed</span> : null}
        </span>
      </button>
      {expanded ? (
        <div className={classes.body}>
          {entries.map((entry, i) => (
            <ToolEntryRow key={i} entry={entry} />
          ))}
        </div>
      ) : null}
    </div>
  );
};

const SubagentRow = ({
  item,
  turnInFlight,
  renderEvent,
}: {
  item: Extract<TranscriptItem<ConversationEvent>, { type: 'subagent' }>;
  turnInFlight: boolean;
  renderEvent: (event: ConversationEvent) => ReactNode;
}) => {
  const classes = useStyles(styles);
  const [expanded, setExpanded] = useState(false);

  const running = item.resultEvent === undefined && turnInFlight;
  const input = item.call?.chunk.toolInput;
  const description =
    isPlainRecord(input) && typeof input.description === 'string'
      ? input.description
      : isPlainRecord(input) && typeof input.prompt === 'string'
        ? input.prompt
        : null;
  const agentLabel =
    isPlainRecord(input) && typeof input.subagent_type === 'string'
      ? `${input.subagent_type} agent`
      : item.call
        ? 'Subagent'
        : 'Subagent (earlier)';

  const latestActivity = useMemo(() => {
    if (!running) return null;
    for (let i = item.events.length - 1; i >= 0; i--) {
      const chunks = getConversationEventChunks(item.events[i]);
      const last = chunks[chunks.length - 1];
      if (last && last.text.trim().length > 0) {
        return last.text.trim().replace(/\s+/g, ' ').slice(0, 160);
      }
    }
    return null;
  }, [running, item.events]);

  return (
    <div>
      <button
        type="button"
        className={classes.header}
        aria-expanded={expanded}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setExpanded((v) => !v);
        }}
        onMouseDown={(e) => e.preventDefault()}
      >
        <span className={classNames(classes.glyph, classes.glyphTool)}>{expanded ? '▾' : '▸'}</span>
        <span className={classes.label}>
          {running ? '◌ ' : ''}
          {agentLabel}
        </span>
        <span className={classes.summary}>
          {description ? `${description} · ` : ''}
          {item.events.length} events
          {latestActivity ? ` · ${latestActivity}` : ''}
        </span>
      </button>
      {expanded ? (
        <div className={classes.body}>
          <TranscriptItemsList items={item.items} turnInFlight={turnInFlight} renderEvent={renderEvent} />
          {item.resultEvent ? (
            <>
              <div className={classes.reportLabel}>Report</div>
              <ConversationEventRow event={item.resultEvent} />
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
