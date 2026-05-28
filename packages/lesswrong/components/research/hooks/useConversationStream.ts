'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ApolloClient } from '@apollo/client';
import { gql } from '@/lib/generated/gql-codegen';
import { useApolloClient } from '@apollo/client/react';
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

// Lightweight Result wrapper used by helpers that would otherwise throw for
// control flow (network failure, schema mismatch). Callers branch on `ok`.
type Result<T> = { ok: true; value: T } | { ok: false; error: string };

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
  // Optimistic local-only insert (seq < 0); dropped on the next transcript reload.
  injectOptimisticEvent: (event: ConversationEvent) => void;
}

// How long to keep slow-polling the transcript while idle, to notice a turn
// started elsewhere (another tab/device) and re-open the live stream.
const IDLE_POLL_MS = 15_000;

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
 * Single-source conversation stream. History comes from the
 * `researchConversationTranscript` query; live updates come from the backend
 * SSE endpoint (`/api/research/conversations/:id/events/stream`). Everything is
 * keyed by the backend-assigned `seq`, so reconciliation is a trivial
 * merge-by-seq with no cross-source dedupe.
 *
 * The live stream is held open only while a turn is in flight; between turns we
 * close it and slow-poll the transcript to notice a turn started elsewhere.
 */
export function useConversationStream(
  conversationId: string | null | undefined,
): UseConversationStreamResult {
  const apollo = useApolloClient();

  const [events, setEvents] = useState<ConversationEvent[]>([]);
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const latestSeq = useMemo(() => {
    let max = -1;
    for (const e of events) if (e.seq > max) max = e.seq;
    return max;
  }, [events]);

  const latestSeqRef = useRef(latestSeq);
  useEffect(() => { latestSeqRef.current = latestSeq; }, [latestSeq]);

  const turnInFlight = useMemo(() => isTurnInFlight(events), [events]);

  // Load the conversation's persisted history (re-runs on refresh).
  useEffect(() => {
    if (!conversationId) {
      setEvents([]);
      setStatus('idle');
      setError(null);
      return;
    }
    const id = conversationId;
    let cancelled = false;

    const cached = readCachedTranscript(apollo, id);
    if (cached.length > 0) {
      // Drop any prior optimistic entries; merge fresh persisted history.
      setEvents((prev) => mergeBySeq(prev.filter((e) => e.seq >= 0), cached));
    } else {
      setStatus('loading');
    }
    setError(null);

    void (async () => {
      const result = await loadPersistedEvents(apollo, id, -1);
      if (cancelled) return;
      if (!result.ok) {
        setStatus('error');
        setError(result.error);
        return;
      }
      setEvents((prev) => mergeBySeq(prev.filter((e) => e.seq >= 0), result.value));
      // Status past 'loading' is owned by the stream effect below (idle vs
      // connecting/streaming), which reacts to the loaded turn-in-flight state.
      setStatus((s) => (s === 'loading' ? 'idle' : s));
    })();

    return () => { cancelled = true; };
  }, [conversationId, refreshNonce, apollo]);

  // Hold the live stream open while a turn is in flight; when idle, close it
  // and slow-poll the transcript to notice a turn started elsewhere.
  useEffect(() => {
    if (!conversationId) return;
    const id = conversationId;

    if (!turnInFlight) {
      // A turn started elsewhere flips turnInFlight, which re-runs this effect
      // into the streaming branch below.
      setStatus((s) => (s === 'loading' || s === 'error' ? s : 'idle'));
      const poll = setInterval(() => {
        void (async () => {
          const result = await loadPersistedEvents(apollo, id, latestSeqRef.current);
          if (result.ok && result.value.length > 0) {
            setEvents((prev) => mergeBySeq(prev, result.value));
          }
        })();
      }, IDLE_POLL_MS);
      return () => clearInterval(poll);
    }

    // Native EventSource auto-reconnects (resuming via Last-Event-ID = last
    // seq), so we don't hand-roll reconnection; we only reflect its state.
    setStatus('connecting');
    setError(null);
    const url = `/api/research/conversations/${encodeURIComponent(id)}/events/stream?since=${latestSeqRef.current}`;
    const es = new EventSource(url, { withCredentials: true });

    es.onopen = () => setStatus('streaming');
    es.onmessage = (msg) => {
      const ev = parseStreamedRow(msg.data);
      if (ev) setEvents((prev) => mergeBySeq(prev, [ev]));
    };
    es.onerror = () => {
      // CLOSED ⇒ a fatal response (e.g. 401/403); won't auto-retry. Otherwise
      // the browser is already reconnecting.
      setStatus(es.readyState === EventSource.CLOSED ? 'error' : 'reconnecting');
    };

    return () => es.close();
  }, [conversationId, turnInFlight, apollo]);

  const injectOptimisticEvent = useCallback((event: ConversationEvent) => {
    setEvents((prev) => mergeBySeq(prev, [event]));
  }, []);

  const refresh = useCallback(() => {
    setRefreshNonce((n) => n + 1);
  }, []);

  return { events, status, error, latestSeq, refresh, injectOptimisticEvent };
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

function mapRawTranscriptToEvents(raw: readonly RawTranscriptRow[]): ConversationEvent[] {
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

function readCachedTranscript(apollo: ApolloClient, conversationId: string): ConversationEvent[] {
  try {
    const cached = apollo.readQuery({
      query: ResearchConversationTranscriptQuery,
      variables: { conversationId, since: null },
    });
    return mapRawTranscriptToEvents(cached?.researchConversationTranscript ?? []);
  } catch {
    return [];
  }
}

async function loadPersistedEvents(
  apollo: ApolloClient,
  conversationId: string,
  since: number,
): Promise<Result<ConversationEvent[]>> {
  try {
    const queryResult = await apollo.query({
      query: ResearchConversationTranscriptQuery,
      variables: { conversationId, since: since < 0 ? null : since },
      fetchPolicy: 'network-only',
    });
    if (queryResult.error) {
      return { ok: false, error: queryResult.error.message };
    }
    return { ok: true, value: mapRawTranscriptToEvents(queryResult.data?.researchConversationTranscript ?? []) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
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

// Merge by backend `seq`: persisted events (seq >= 0) dedupe by seq and sort
// ascending; optimistic events (seq < 0) carry no seq yet, so they're kept in
// insertion order at the tail until the next transcript reload replaces them
// with their persisted twins. Returns `prev` unchanged when nothing new came
// in, so memoized rows don't re-render.
function mergeBySeq(prev: ConversationEvent[], incoming: ConversationEvent[]): ConversationEvent[] {
  if (incoming.length === 0) return prev;
  const bySeq = new Map<number, ConversationEvent>();
  const optimistic: ConversationEvent[] = [];
  for (const e of prev) {
    if (e.seq < 0) optimistic.push(e);
    else bySeq.set(e.seq, e);
  }
  let changed = false;
  for (const e of incoming) {
    if (e.seq < 0) { optimistic.push(e); changed = true; continue; }
    if (!bySeq.has(e.seq)) { bySeq.set(e.seq, e); changed = true; }
  }
  if (!changed) return prev;
  const persisted = [...bySeq.values()].sort((a, b) => a.seq - b.seq);
  return [...persisted, ...optimistic];
}
