'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ApolloClient } from '@apollo/client';
import { gql } from '@/lib/generated/gql-codegen';
import { useApolloClient } from '@apollo/client/react';
import { useQuery } from '@/lib/crud/useQuery';
import { isTurnInFlight } from '../conversationEventFormat';

export interface ConversationEvent {
  _id: string;
  conversationId: string;
  seq: number;
  claudeMessageUuid?: string | null;
  kind: string;
  payload: unknown;
  createdAt: string;
}

export type StreamStatus =
  | 'idle'
  | 'loading'
  | 'connecting'
  | 'streaming'
  | 'reconnecting'
  | 'error'
  | 'closed';

interface UseConversationStreamResult {
  events: ConversationEvent[];
  status: StreamStatus;
  error: string | null;
  latestSeq: number;
  refresh: () => void;
  // Optimistic local-only insert (seq < 0); dropped once its persisted twin lands.
  injectOptimisticEvent: (event: ConversationEvent) => void;
  clearOptimistic: () => void;
  // Signal that a turn was just dispatched for this conversation, so the live
  // stream opens immediately — before the first event is persisted. With the
  // single-writer design the user turn isn't persisted until Claude echoes it,
  // so `isTurnInFlight(events)` is briefly false on the first turn; without this
  // the stream would close into slow polling and the turn would look idle.
  markTurnExpected: () => void;
}

// How often to refetch while idle, to notice a turn started elsewhere (another
// tab/device) and re-open the live stream.
const IDLE_POLL_MS = 15_000;

const EXPECTING_TURN_TIMEOUT_MS = 120_000;

const ResearchConversationTranscriptQuery = gql(`
  query ResearchConversationTranscript($conversationId: String!, $since: Int) {
    researchConversationTranscript(conversationId: $conversationId, since: $since) {
      _id
      conversationId
      seq
      claudeMessageUuid
      kind
      payload
      createdAt
    }
  }
`);

/**
 * Single-source conversation stream. The Apollo cache is the store: history and
 * live events for a conversation live in one `researchConversationTranscript`
 * cache entry, read reactively via `useQuery`. Switching `conversationId` just
 * reads a different entry (no manual reset), and `cache-and-network` shows the
 * cached entry instantly while refetching, so a conversation that advanced
 * since it was last loaded refreshes itself rather than sticking stale.
 *
 * Live updates: the SSE stream (held open only while a turn is in flight)
 * appends each persisted event into that cache entry, which `useQuery` picks up
 * reactively. Between turns we close the stream and slow-poll via refetch.
 */
export function useConversationStream(
  conversationId: string | null | undefined,
): UseConversationStreamResult {
  const apollo = useApolloClient();

  const { data, loading, error: queryError, refetch } = useQuery(ResearchConversationTranscriptQuery, {
    variables: { conversationId: conversationId ?? '', since: null },
    fetchPolicy: 'cache-and-network',
    skip: !conversationId,
  });

  const persisted = useMemo(
    () => mapRows(data?.researchConversationTranscript ?? []),
    [data],
  );

  // Optimistic echoes (seq < 0) live locally, appended after the persisted
  // history; the cache owns everything real.
  const [optimistic, setOptimistic] = useState<ConversationEvent[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<StreamStatus>('idle');
  const [expectingTurn, setExpectingTurn] = useState(false);
  const expectingTurnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const events = useMemo(() => [...persisted, ...optimistic], [persisted, optimistic]);
  const turnInFlight = useMemo(() => isTurnInFlight(events), [events]);
  const streamShouldBeOpen = turnInFlight || expectingTurn;

  const latestSeq = useMemo(() => {
    let max = -1;
    for (const e of persisted) if (e.seq > max) max = e.seq;
    return max;
  }, [persisted]);
  const latestSeqRef = useRef(latestSeq);
  useEffect(() => { latestSeqRef.current = latestSeq; }, [latestSeq]);

  const refetchRef = useRef(refetch);
  useEffect(() => { refetchRef.current = refetch; }, [refetch]);

  // Drop the optimistic echo once a new persisted user turn lands (its real
  // twin is now in the transcript).
  const persistedUserCount = useMemo(
    () => persisted.reduce((n, e) => (e.kind === 'user' ? n + 1 : n), 0),
    [persisted],
  );
  const prevUserCountRef = useRef(persistedUserCount);
  useEffect(() => {
    if (persistedUserCount > prevUserCountRef.current) {
      setOptimistic([]);
      setExpectingTurn(false);
    }
    prevUserCountRef.current = persistedUserCount;
  }, [persistedUserCount]);

  useEffect(() => {
    setExpectingTurn(false);
    if (expectingTurnTimerRef.current) clearTimeout(expectingTurnTimerRef.current);
  }, [conversationId]);

  // Live stream lifecycle: hold the SSE open while a turn is in flight; when
  // idle, close it and slow-poll (refetch) to notice a turn started elsewhere.
  useEffect(() => {
    if (!conversationId) {
      setConnectionStatus('idle');
      return;
    }
    const id = conversationId;

    if (!streamShouldBeOpen) {
      setConnectionStatus('idle');
      const poll = setInterval(() => { void refetchRef.current(); }, IDLE_POLL_MS);
      return () => clearInterval(poll);
    }

    // Native EventSource auto-reconnects (resuming via Last-Event-ID = last
    // seq), so we don't hand-roll reconnection; we only reflect its state and
    // append each delivered event into the transcript cache entry.
    setConnectionStatus('connecting');
    const url = `/api/research/conversations/${encodeURIComponent(id)}/events/stream?since=${latestSeqRef.current}`;
    const es = new EventSource(url, { withCredentials: true });

    es.onopen = () => setConnectionStatus('streaming');
    es.onmessage = (msg) => {
      const ev = parseStreamedRow(msg.data);
      if (ev) appendEventToCache(apollo, id, ev);
    };
    es.onerror = () => {
      // CLOSED ⇒ a fatal response (e.g. 401/403); won't auto-retry. Otherwise
      // the browser is already reconnecting.
      setConnectionStatus(es.readyState === EventSource.CLOSED ? 'error' : 'reconnecting');
    };

    return () => es.close();
  }, [conversationId, streamShouldBeOpen, apollo]);

  const injectOptimisticEvent = useCallback((event: ConversationEvent) => {
    setOptimistic((prev) => [...prev, event]);
  }, []);

  const clearOptimistic = useCallback(() => {
    setOptimistic([]);
    setExpectingTurn(false);
    if (expectingTurnTimerRef.current) clearTimeout(expectingTurnTimerRef.current);
  }, []);

  const markTurnExpected = useCallback(() => {
    setExpectingTurn(true);
    if (expectingTurnTimerRef.current) clearTimeout(expectingTurnTimerRef.current);
    expectingTurnTimerRef.current = setTimeout(
      () => setExpectingTurn(false),
      EXPECTING_TURN_TIMEOUT_MS,
    );
  }, []);

  const refresh = useCallback(() => { void refetchRef.current(); }, []);

  const status: StreamStatus = useMemo(() => {
    if (!conversationId) return 'idle';
    if (queryError) return 'error';
    if (loading && persisted.length === 0) return 'loading';
    return connectionStatus;
  }, [conversationId, queryError, loading, persisted.length, connectionStatus]);

  return {
    events,
    status,
    error: queryError ? queryError.message : null,
    latestSeq,
    refresh,
    injectOptimisticEvent,
    clearOptimistic,
    markTurnExpected,
  };
}

interface RawTranscriptRow {
  _id: string;
  conversationId: string | null;
  seq: number | null;
  claudeMessageUuid?: string | null;
  kind: string | null;
  payload: unknown;
  createdAt: string;
}

function mapRows(raw: readonly RawTranscriptRow[]): ConversationEvent[] {
  return raw.flatMap((e) => {
    if (e.conversationId === null || e.seq === null || e.kind === null) return [];
    return [{
      _id: e._id,
      conversationId: e.conversationId,
      seq: e.seq,
      claudeMessageUuid: e.claudeMessageUuid,
      kind: e.kind,
      payload: e.payload,
      createdAt: e.createdAt,
    }];
  });
}

function parseStreamedRow(data: string): ConversationEvent | null {
  try {
    const raw = JSON.parse(data);
    if (typeof raw?.conversationId !== 'string' || typeof raw?.seq !== 'number' || typeof raw?.kind !== 'string') {
      return null;
    }
    return {
      _id: typeof raw._id === 'string' ? raw._id : `${raw.conversationId}:${raw.seq}`,
      conversationId: raw.conversationId,
      seq: raw.seq,
      claudeMessageUuid: typeof raw.claudeMessageUuid === 'string' ? raw.claudeMessageUuid : null,
      kind: raw.kind,
      payload: raw.payload,
      createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

// Append a live event into the conversation's transcript cache entry. Keyed by
// `_id` so a later refetch merges (rather than duplicates) the same row; guarded
// on seq so a reconnect replay doesn't double-insert into the list.
function appendEventToCache(
  apollo: ApolloClient,
  conversationId: string,
  ev: ConversationEvent,
): void {
  apollo.cache.updateQuery(
    { query: ResearchConversationTranscriptQuery, variables: { conversationId, since: null } },
    (prev) => {
      const list = prev?.researchConversationTranscript;
      // Not loaded yet — the in-flight network fetch will include this event.
      if (!list) return undefined;
      if (list.some((e) => e?.seq === ev.seq)) return undefined;
      return {
        researchConversationTranscript: [
          ...list,
          {
            __typename: 'ResearchConversationEvent' as const,
            _id: ev._id,
            conversationId: ev.conversationId,
            seq: ev.seq,
            claudeMessageUuid: ev.claudeMessageUuid ?? null,
            kind: ev.kind,
            payload: ev.payload,
            createdAt: ev.createdAt,
          },
        ],
      };
    },
  );
}
