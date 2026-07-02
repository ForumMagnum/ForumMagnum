'use client';

import React from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { ConversationEventRow } from './ConversationEventRow';
import { researchMono, researchScrollbars } from './researchStyleUtils';
import { useTranscriptScroll } from './hooks/useTranscriptScroll';
import type { ConversationEvent, StreamStatus } from './hooks/useConversationStream';

const styles = defineStyles('ConversationTranscript', (theme: ThemeType) => ({
  root: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    // Disable native scroll anchoring so it can't fight useTranscriptScroll's
    // manual re-anchor when older history is paged in.
    overflowAnchor: 'none',
    padding: '10px 2px 12px 0',
    ...researchScrollbars(theme),
  },
  // Inner wrapper so a ResizeObserver can track content growth (streamed
  // events, late markdown/image layout) and keep the view pinned to the
  // bottom. Rows carry their own vertical rhythm (see ConversationEventRow).
  content: {
    display: 'flex',
    flexDirection: 'column',
  },
  statusLine: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 7,
    marginTop: 6,
    fontFamily: researchMono,
    fontSize: 11.5,
    color: theme.palette.text.dim,
  },
  workingGlyph: {
    color: theme.palette.primary.main,
    animation: '$workingPulse 1.4s ease-in-out infinite',
  },
  '@keyframes workingPulse': {
    '0%, 100%': { opacity: 0.35 },
    '50%': { opacity: 1 },
  },
  errorLine: {
    color: theme.palette.error?.main ?? theme.palette.text.primary,
  },
  empty: {
    fontSize: 13,
    fontStyle: 'italic',
    color: theme.palette.text.dim,
    padding: '8px 0',
  },
}));

interface ConversationTranscriptProps {
  conversationId: string;
  events: ConversationEvent[];
  turnInFlight: boolean;
  status: StreamStatus;
  error: string | null;
  hasMoreOlder: boolean;
  loadingOlder: boolean;
  loadOlder: () => void;
  /**
   * Cap the message content to this width (centered) while the scroll
   * container stays full-width — the scrollbar sits at the far edge and the
   * whole width is scrollable, but lines don't stretch. Unset = full-width
   * content (the narrow side panel and agent block).
   */
  maxContentWidth?: number;
}

/**
 * Scrollable Claude Code-style transcript: stays pinned to the bottom while
 * the agent streams (unless the user scrolls up to read), pages in older
 * history on scroll-up, and shows a quiet pulsing "✻ working…" line during
 * a turn.
 */
export const ConversationTranscript = ({
  conversationId,
  events,
  turnInFlight,
  status,
  error,
  hasMoreOlder,
  loadingOlder,
  loadOlder,
  maxContentWidth,
}: ConversationTranscriptProps) => {
  const classes = useStyles(styles);

  // Pin to bottom as events stream in (unless the user scrolled up) and page
  // in older history on scroll-up, re-anchoring the viewport so the prepend
  // doesn't shift the content under the reader.
  const { scrollRef, contentRef, onScroll } = useTranscriptScroll({
    events,
    resetKey: conversationId,
    hasMoreOlder,
    loadingOlder,
    loadOlder,
  });

  return (
    <div className={classes.root} ref={scrollRef} onScroll={onScroll}>
      <div
        className={classes.content}
        ref={contentRef}
        style={maxContentWidth ? { maxWidth: maxContentWidth, marginLeft: 'auto', marginRight: 'auto', width: '100%' } : undefined}
      >
        {events.length === 0 && !turnInFlight ? (
          <div className={classes.empty}>
            {status === 'loading' ? 'Loading transcript…' : 'No output yet.'}
          </div>
        ) : null}
        {events.map((event) => (
          <ConversationEventRow key={event._id ?? `${event.conversationId}:${event.seq}`} event={event} />
        ))}
        {turnInFlight ? (
          <div className={classes.statusLine}>
            <span className={classes.workingGlyph}>✻</span>
            <span>working…</span>
          </div>
        ) : null}
        {status === 'error' && error ? (
          <div className={classNames(classes.statusLine, classes.errorLine)} title={error}>
            ✕ {error}
          </div>
        ) : null}
      </div>
    </div>
  );
};
