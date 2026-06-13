'use client';

import React, { useCallback, useLayoutEffect, useRef } from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { ConversationEventRow } from './ConversationEventRow';
import { researchMono, researchScrollbars } from './researchStyleUtils';
import type { ConversationEvent, StreamStatus } from './hooks/useConversationStream';

const BOTTOM_THRESHOLD_PX = 64;

function isScrolledNearBottom(el: HTMLElement): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_THRESHOLD_PX;
}

const styles = defineStyles('ConversationTranscript', (theme: ThemeType) => ({
  root: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
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
  events: ConversationEvent[];
  turnInFlight: boolean;
  status: StreamStatus;
  error: string | null;
}

/**
 * Scrollable Claude Code-style transcript: stays pinned to the bottom while
 * the agent streams (unless the user scrolls up to read), shows a quiet
 * pulsing "✻ working…" line during a turn.
 */
export const ConversationTranscript = ({
  events,
  turnInFlight,
  status,
  error,
}: ConversationTranscriptProps) => {
  const classes = useStyles(styles);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const isPinnedToBottomRef = useRef(true);
  // Programmatic pinning fires scroll events; don't let those read as the
  // user scrolling away from the bottom.
  const ignoreNextScrollRef = useRef(false);

  const handleScroll = useCallback(() => {
    if (ignoreNextScrollRef.current) {
      ignoreNextScrollRef.current = false;
      return;
    }
    const el = scrollRef.current;
    if (el) isPinnedToBottomRef.current = isScrolledNearBottom(el);
  }, []);

  // Keep the view pinned to the bottom while the user hasn't scrolled away.
  // Content height changes for reasons beyond event count — markdown/image
  // layout settling after mount, and the block's expand animation growing
  // the container — so pin via ResizeObserver on both the container and the
  // content, not just on events.length.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    const content = contentRef.current;
    if (!el || !content) return;
    const pinToBottom = () => {
      if (isPinnedToBottomRef.current && el.scrollTop !== el.scrollHeight - el.clientHeight) {
        ignoreNextScrollRef.current = true;
        // 'instant', not a bare scrollTop assignment: the latter defers to
        // any environment-injected `scroll-behavior: smooth` CSS, which
        // would animate every pin.
        el.scrollTo({ top: el.scrollHeight, behavior: 'instant' });
      }
    };
    pinToBottom();
    const observer = new ResizeObserver(pinToBottom);
    observer.observe(el);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && isPinnedToBottomRef.current) {
      ignoreNextScrollRef.current = true;
      el.scrollTo({ top: el.scrollHeight, behavior: 'instant' });
    }
  }, [events.length, turnInFlight]);

  return (
    <div className={classes.root} ref={scrollRef} onScroll={handleScroll}>
      <div className={classes.content} ref={contentRef}>
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
