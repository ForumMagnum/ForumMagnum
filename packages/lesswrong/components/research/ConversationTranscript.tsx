'use client';

import React, { useMemo } from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { ConversationEventRow } from './ConversationEventRow';
import { ResearchQuestionCard } from './ResearchQuestionCard';
import { collectAskUserQuestionAnswers, extractAskUserQuestion, toolResultToolUseId } from './researchAskUserQuestion';
import { researchMono, researchScrollbars } from './researchStyleUtils';
import { useTranscriptScroll } from './hooks/useTranscriptScroll';
import type { ConversationEvent, StreamStatus } from './hooks/useConversationStream';

function toolResultAnswersAsked(event: ConversationEvent, askedToolUseIds: Set<string>): boolean {
  const id = toolResultToolUseId(event);
  return id !== null && askedToolUseIds.has(id);
}

const styles = defineStyles('ConversationTranscript', (theme: ThemeType) => ({
  root: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    overflowAnchor: 'none',
    padding: '10px 2px 12px 0',
    ...researchScrollbars(theme),
  },
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
  maxContentWidth?: number;
}

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

  const { scrollRef, contentRef, onScroll } = useTranscriptScroll({
    events,
    resetKey: conversationId,
    hasMoreOlder,
    loadingOlder,
    loadOlder,
  });

  const { prompts, hiddenEventIds } = useMemo(() => {
    const answers = collectAskUserQuestionAnswers(events);
    const askedToolUseIds = new Set<string>();
    let lastResultIdx = -1;
    for (let i = 0; i < events.length; i++) {
      if (events[i].kind === 'result') lastResultIdx = i;
      const prompt = extractAskUserQuestion(events[i]);
      if (prompt) askedToolUseIds.add(prompt.toolUseId);
    }

    const promptMap = new Map<string, { prompt: ReturnType<typeof extractAskUserQuestion>; answers: Record<string, string> | null; actionable: boolean }>();
    const hidden = new Set<string>();
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const prompt = extractAskUserQuestion(event);
      if (prompt) {
        const answered = answers.get(prompt.toolUseId) ?? null;
        const actionable = !answered && turnInFlight && lastResultIdx < i;
        const key = event._id ?? `${event.conversationId}:${event.seq}`;
        promptMap.set(key, { prompt, answers: answered, actionable });
        continue;
      }
      if (event.kind === 'tool_result' && toolResultAnswersAsked(event, askedToolUseIds)) {
        hidden.add(event._id ?? `${event.conversationId}:${event.seq}`);
      }
    }
    return { prompts: promptMap, hiddenEventIds: hidden };
  }, [events, turnInFlight]);

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
        {events.map((event) => {
          const key = event._id ?? `${event.conversationId}:${event.seq}`;
          const question = prompts.get(key);
          if (question?.prompt) {
            return (
              <ResearchQuestionCard
                key={key}
                conversationId={conversationId}
                prompt={question.prompt}
                answers={question.answers}
                actionable={question.actionable}
              />
            );
          }
          if (hiddenEventIds.has(key)) return null;
          return <ConversationEventRow key={key} event={event} />;
        })}
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
