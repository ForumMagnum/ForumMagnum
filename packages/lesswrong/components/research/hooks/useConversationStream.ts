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
  // Derived once here (with a render-safe clock) so every consumer agrees;
  // see isTurnInFlight for the derivation.
  turnInFlight: boolean;
  latestSeq: number;
  // Whether older history remains unloaded above the current window.
  hasMoreOlder: boolean;
  loadingOlder: boolean;
  // Page in the next batch of older events (scroll-up). No-op once the start of
  // history is reached or while a previous load is in flight.
  loadOlder: () => void;
  refresh: () => void;
  // Optimistic local-only insert (seq < 0); dropped once its persisted twin lands.
  injectOptimisticEvent: (event: ConversationEvent) => void;
  clearOptimistic: () => void;
  // Signal that a turn was just dispatched for this conversation, so the live
  // stream opens immediately — before the first event is persisted. The
  // supervisor records the user turn at dispatch, but it reaches the backend
  // (and then this client) asynchronously, so `isTurnInFlight(events)` is
  // briefly false; without this the stream would close into slow polling and
  // the turn would look idle.
  markTurnExpected: () => void;
}

// How often to refetch while idle, to notice a turn started elsewhere (another
// tab/device) and re-open the live stream.
const IDLE_POLL_MS = 15_000;

const EXPECTING_TURN_TIMEOUT_MS = 120_000;

// How many of the most recent events to load up front. The rest of the history
// is paged in on demand (scroll-up) via `loadOlder`. Keeping the initial window
// small is what keeps a long conversation from loading (and rendering) thousands
// of events on open.
const RECENT_WINDOW = 200;
const OLDER_PAGE = 200;

const ResearchConversationTranscriptQuery = gql(`
  query ResearchConversationTranscript($conversationId: String!, $before: Int, $limit: Int) {
    researchConversationTranscript(conversationId: $conversationId, before: $before, limit: $limit) {
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
 * cache entry, read reactively via `useQuery`. That entry is union-merged by
 * `seq` (see the field policy in `@/lib/apollo/typePolicies`), so its three
 * writers — the initial recent-window load, older-page `loadOlder` fetches, and
 * live SSE appends — coalesce into one ordered list and a network refetch can
 * never drop events another writer added. Switching `conversationId` just reads
 * a different entry (no manual reset).
 *
 * Only the most recent `RECENT_WINDOW` events load up front; older history is
 * paged in on demand via `loadOlder`. Live updates: the SSE stream (held open
 * only while a turn is in flight) appends each persisted event into the cache
 * entry. Between turns we close the stream and slow-poll the recent window.
 */
export function useConversationStream(
  conversationId: string | null | undefined,
): UseConversationStreamResult {
  const apollo = useApolloClient();

  const { data, loading, error: queryError } = useQuery(ResearchConversationTranscriptQuery, {
    variables: { conversationId: conversationId ?? '', before: null, limit: RECENT_WINDOW },
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

  // Only surface optimistic echoes belonging to the current conversation. A
  // hook instance can survive a conversation switch (when its host component
  // isn't keyed by conversation), so a `seq < 0` echo from a previous
  // conversation can still sit in `optimistic` until its persisted twin lands;
  // without this filter it would leak into whatever conversation is shown next.
  const events = useMemo(
    () => [...persisted, ...optimistic.filter((e) => e.conversationId === conversationId)],
    [persisted, optimistic, conversationId],
  );

  // Clock for isTurnInFlight's queued-turn recency check. Render must stay
  // pure (Next prerender forbids Date.now() in components), so the time lives
  // in state and ticks in an effect — null until hydration, which just means
  // the queued-turn clause kicks in a moment later on the client.
  const [nowMs, setNowMs] = useState<number | null>(null);
  useEffect(() => {
    setNowMs(Date.now());
    const tick = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(tick);
  }, []);

  const turnInFlight = useMemo(
    () => isTurnInFlight(events, nowMs ?? undefined),
    [events, nowMs],
  );
  const streamShouldBeOpen = turnInFlight || expectingTurn;

  const latestSeq = useMemo(() => {
    let max = -1;
    for (const e of persisted) if (e.seq > max) max = e.seq;
    return max;
  }, [persisted]);
  const latestSeqRef = useRef(latestSeq);
  useEffect(() => { latestSeqRef.current = latestSeq; }, [latestSeq]);

  // Oldest loaded seq drives `loadOlder`'s cursor and `hasMoreOlder`. Seq is a
  // contiguous append-only sequence starting at 0, so "more history exists" is
  // exactly "we haven't loaded seq 0 yet" — no page-count bookkeeping needed.
  const oldestLoadedSeq = useMemo(() => {
    let min = Infinity;
    for (const e of persisted) if (e.seq < min) min = e.seq;
    return min === Infinity ? null : min;
  }, [persisted]);
  const oldestLoadedSeqRef = useRef(oldestLoadedSeq);
  useEffect(() => { oldestLoadedSeqRef.current = oldestLoadedSeq; }, [oldestLoadedSeq]);
  const hasMoreOlder = oldestLoadedSeq != null && oldestLoadedSeq > 0;

  const [loadingOlder, setLoadingOlder] = useState(false);
  const loadingOlderRef = useRef(false);
  const loadOlder = useCallback(async () => {
    if (!conversationId || loadingOlderRef.current) return;
    const before = oldestLoadedSeqRef.current;
    if (before == null || before <= 0) return;
    loadingOlderRef.current = true;
    setLoadingOlder(true);
    try {
      await fetchTranscriptPage(apollo, conversationId, before, OLDER_PAGE);
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }, [conversationId, apollo]);

  // Re-pull the recent window to notice a turn started elsewhere (idle poll) or
  // after sending (refresh). Swallows transient failures; the next poll retries.
  const refreshRecent = useCallback(async () => {
    if (!conversationId) return;
    try {
      await fetchTranscriptPage(apollo, conversationId, null, RECENT_WINDOW);
    } catch {
      // Transient failure; the next idle poll or user action retries.
    }
  }, [apollo, conversationId]);

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
  // idle, close it and slow-poll (refreshRecent) to notice a turn started elsewhere.
  useEffect(() => {
    if (!conversationId) {
      setConnectionStatus('idle');
      return;
    }
    const id = conversationId;

    if (!streamShouldBeOpen) {
      setConnectionStatus('idle');
      const poll = setInterval(() => { void refreshRecent(); }, IDLE_POLL_MS);
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
  }, [conversationId, streamShouldBeOpen, apollo, refreshRecent]);

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

  const refresh = useCallback(() => { void refreshRecent(); }, [refreshRecent]);

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
    turnInFlight,
    latestSeq,
    hasMoreOlder,
    loadingOlder,
    loadOlder,
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

// Fetch one transcript page (the recent window when `before` is null, or the
// page immediately older than `before`) and write it into the shared cache
// entry. We use a standalone `apollo.query`, never the base query's
// `refetch()`/`fetchMore()`: `refetch()` resets the cached field before writing,
// so the merge policy sees `existing: undefined` and the page erases older pages
// already merged in; `fetchMore()` on the `cache-and-network` base query
// re-triggers its own network fetch and ping-pongs into an infinite loop once
// the merge rebroadcasts. A one-off query writes through the merge with
// `existing` intact, unioning the page in for the base `useQuery` to re-render.
async function fetchTranscriptPage(
  apollo: ApolloClient,
  conversationId: string,
  before: number | null,
  limit: number,
): Promise<void> {
  await apollo.query({
    query: ResearchConversationTranscriptQuery,
    variables: { conversationId, before, limit },
    fetchPolicy: 'network-only',
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

// Append a live event into the conversation's transcript cache entry. We write
// only the single new row; the field's `merge` policy (keyed by `conversationId`,
// unioned by `seq`) inserts it in order and dedupes a reconnect replay. We skip
// the write until history is present so a stray live event can't transiently
// render as the entire transcript — the in-flight network fetch covers that gap.
function appendEventToCache(
  apollo: ApolloClient,
  conversationId: string,
  ev: ConversationEvent,
): void {
  apollo.cache.updateQuery(
    { query: ResearchConversationTranscriptQuery, variables: { conversationId, before: null, limit: RECENT_WINDOW } },
    (prev) => {
      if (!prev?.researchConversationTranscript) return undefined;
      return {
        researchConversationTranscript: [
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
