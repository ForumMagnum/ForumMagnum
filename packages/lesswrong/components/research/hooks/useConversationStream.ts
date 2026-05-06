'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { gql } from '@/lib/generated/gql-codegen';
import { useApolloClient } from '@apollo/client/react';

/**
 * Shape of a single conversation event, mirroring `ResearchConversationEvents`
 * rows. Kept intentionally loose so it can carry any Claude Code JSONL payload.
 */
export interface ConversationEvent {
  _id: string;
  conversationId: string;
  seq: number;
  claudeMessageUuid?: string | null;
  kind: string;
  payload: unknown;
  createdAt: string;
}

/**
 * Backend response describing where to connect for live SSE for a given
 * conversation. Returned by `GET /api/research/conversations/:id/stream-info`.
 *
 * `sseUrl` is the per-sandbox public URL exposed via Vercel; it changes when
 * a sandbox is reprovisioned, so the client must rediscover it on reconnect.
 * `token` is a short-lived HMAC bearer the supervisor validates in-process.
 * If the conversation has no live sandbox (idle), `sseUrl` is null and the
 * client should rely on persisted events only.
 */
export interface StreamInfo {
  sseUrl: string | null;
  token: string | null;
  expiresAt?: string | null;
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
  /** Highest seq we have locally; useful for reconnect-with-`?since=N`. */
  latestSeq: number;
  /** Imperatively reload persisted events and reconnect SSE. */
  refresh: () => void;
}

/** Min/max backoff for SSE reconnect attempts, in ms. */
const RECONNECT_MIN_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;

/**
 * GraphQL query for the persisted transcript. Owned by T1's
 * `researchConversationTranscript` resolver; field set is the union of
 * everything we render off of. If the resolver shape diverges, this query is
 * the single point of update. Once T1 has shipped the resolver and
 * `yarn generate` has been run, the codegen will tighten the result types
 * automatically.
 */
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

interface UseConversationStreamOptions {
  /** Disable live SSE; only load persisted events. */
  liveStreaming?: boolean;
}

/**
 * Subscribes to a research conversation's event stream:
 *   1. Loads persisted events from the backend (`researchConversationTranscript`).
 *   2. Discovers the current per-sandbox SSE URL via the backend.
 *   3. Connects with `?since=<latestSeq>&token=<signed>`.
 *   4. Reconnects on disconnect by re-discovering URL (sandbox may have rolled)
 *      and replaying from the new latest seq.
 *
 * Safe to mount multiple times for different conversations; each instance owns
 * its own EventSource.
 */
export function useConversationStream(
  conversationId: string | null | undefined,
  options: UseConversationStreamOptions = {},
): UseConversationStreamResult {
  const { liveStreaming = true } = options;
  const apollo = useApolloClient();

  const [events, setEvents] = useState<ConversationEvent[]>([]);
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  // Used to force a refresh; bumping this triggers the effect.
  const [refreshNonce, setRefreshNonce] = useState(0);

  // Refs that track live state without retriggering effects.
  const eventSourceRef = useRef<EventSource | null>(null);
  const latestSeqRef = useRef(-1);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  const latestSeq = useMemo(() => {
    if (events.length === 0) return -1;
    return events[events.length - 1].seq;
  }, [events]);

  useEffect(() => {
    latestSeqRef.current = latestSeq;
  }, [latestSeq]);

  useEffect(() => {
    if (!conversationId) {
      setEvents([]);
      setStatus('idle');
      setError(null);
      return;
    }

    cancelledRef.current = false;
    setStatus('loading');
    setError(null);

    void runStream({
      conversationId,
      apollo,
      liveStreaming,
      eventSourceRef,
      latestSeqRef,
      reconnectAttemptsRef,
      reconnectTimerRef,
      cancelledRef,
      setEvents,
      setStatus,
      setError,
    });

    return () => {
      cancelledRef.current = true;
      teardown(eventSourceRef, reconnectTimerRef);
      setStatus('closed');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, liveStreaming, refreshNonce, apollo]);

  return {
    events,
    status,
    error,
    latestSeq,
    refresh: () => setRefreshNonce((n) => n + 1),
  };
}

interface RunStreamArgs {
  conversationId: string;
  apollo: ReturnType<typeof useApolloClient>;
  liveStreaming: boolean;
  eventSourceRef: React.MutableRefObject<EventSource | null>;
  latestSeqRef: React.MutableRefObject<number>;
  reconnectAttemptsRef: React.MutableRefObject<number>;
  reconnectTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  cancelledRef: React.MutableRefObject<boolean>;
  setEvents: React.Dispatch<React.SetStateAction<ConversationEvent[]>>;
  setStatus: React.Dispatch<React.SetStateAction<StreamStatus>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

async function runStream(args: RunStreamArgs) {
  const { conversationId, apollo, liveStreaming, cancelledRef, setEvents, setStatus, setError, latestSeqRef } = args;

  try {
    const persisted = await loadPersistedEvents(apollo, conversationId, -1);
    if (cancelledRef.current) return;

    setEvents(persisted);
    if (persisted.length > 0) {
      latestSeqRef.current = persisted[persisted.length - 1].seq;
    }

    if (!liveStreaming) {
      setStatus('idle');
      return;
    }

    await connectSSE(args);
  } catch (err) {
    if (cancelledRef.current) return;
    setStatus('error');
    setError(err instanceof Error ? err.message : String(err));
  }
}

async function loadPersistedEvents(
  apollo: ReturnType<typeof useApolloClient>,
  conversationId: string,
  since: number,
): Promise<ConversationEvent[]> {
  const { data, error } = await apollo.query({
    query: ResearchConversationTranscriptQuery,
    variables: { conversationId, since: since < 0 ? null : since },
    fetchPolicy: 'network-only',
  });

  if (error) {
    throw error;
  }

  const transcript = data?.researchConversationTranscript;
  if (!transcript) return [];
  return transcript;
}

async function discoverStreamInfo(conversationId: string): Promise<StreamInfo> {
  const res = await fetch(
    `/api/research/conversations/${encodeURIComponent(conversationId)}/stream-info`,
    {
      method: 'GET',
      credentials: 'same-origin',
      headers: { 'Accept': 'application/json' },
    },
  );
  if (!res.ok) {
    throw new Error(`Failed to discover stream URL: HTTP ${res.status}`);
  }
  return (await res.json()) as StreamInfo;
}

async function connectSSE(args: RunStreamArgs) {
  const {
    conversationId,
    eventSourceRef,
    latestSeqRef,
    reconnectAttemptsRef,
    reconnectTimerRef,
    cancelledRef,
    setEvents,
    setStatus,
    setError,
  } = args;

  if (cancelledRef.current) return;
  setStatus(reconnectAttemptsRef.current > 0 ? 'reconnecting' : 'connecting');

  let info: StreamInfo;
  try {
    info = await discoverStreamInfo(conversationId);
  } catch (err) {
    if (cancelledRef.current) return;
    scheduleReconnect(args, err instanceof Error ? err.message : String(err));
    return;
  }

  if (cancelledRef.current) return;

  // Sandbox is idle / not provisioned. We have what we have from persisted
  // events; nothing live to subscribe to. Caller can `refresh()` later.
  if (!info.sseUrl) {
    setStatus('idle');
    setError(null);
    reconnectAttemptsRef.current = 0;
    return;
  }

  // Re-fetch any events the supervisor persisted while we were offline so we
  // never present a gap, then subscribe with `?since=<newLatestSeq>`.
  try {
    const since = latestSeqRef.current;
    const replay = await loadPersistedEvents(args.apollo, conversationId, since);
    if (cancelledRef.current) return;
    if (replay.length > 0) {
      setEvents((prev) => mergeBySeq(prev, replay));
      latestSeqRef.current = Math.max(latestSeqRef.current, replay[replay.length - 1].seq);
    }
  } catch (err) {
    if (cancelledRef.current) return;
    scheduleReconnect(args, err instanceof Error ? err.message : String(err));
    return;
  }

  const url = appendQueryParams(info.sseUrl, {
    since: String(latestSeqRef.current),
    token: info.token ?? '',
  });

  const es = new EventSource(url, { withCredentials: false });
  eventSourceRef.current = es;

  es.onopen = () => {
    if (cancelledRef.current) return;
    reconnectAttemptsRef.current = 0;
    setStatus('streaming');
    setError(null);
  };

  // The supervisor sends each turn-event as `event: jsonl\ndata: {...}`.
  // EventSource.onmessage only fires for *unnamed* events, so we register
  // both an `onmessage` (defensive) and a named listener for `jsonl`.
  const handleSseMessage = (msg: MessageEvent) => {
    if (cancelledRef.current) return;
    try {
      const raw = JSON.parse(msg.data) as unknown;
      const ev = normalizeStreamedEvent(raw);
      if (!ev) return;
      setEvents((prev) => mergeBySeq(prev, [ev]));
      if (ev.seq > latestSeqRef.current) {
        latestSeqRef.current = ev.seq;
      }
    } catch {
      // Ignore malformed lines; supervisor will retry persistence side.
    }
  };
  es.onmessage = handleSseMessage;
  es.addEventListener('jsonl', handleSseMessage);

  es.onerror = () => {
    if (cancelledRef.current) return;
    teardownSource(eventSourceRef);
    scheduleReconnect(args, 'SSE connection lost');
  };
}

function scheduleReconnect(args: RunStreamArgs, message: string) {
  const { reconnectAttemptsRef, reconnectTimerRef, cancelledRef, setStatus, setError } = args;
  if (cancelledRef.current) return;

  setStatus('reconnecting');
  setError(message);

  reconnectAttemptsRef.current += 1;
  const backoff = Math.min(
    RECONNECT_MAX_MS,
    RECONNECT_MIN_MS * 2 ** Math.min(reconnectAttemptsRef.current - 1, 8),
  );
  // Add small jitter so multiple clients don't reconnect in lockstep.
  const jitter = Math.random() * 0.3 * backoff;

  if (reconnectTimerRef.current) {
    clearTimeout(reconnectTimerRef.current);
  }
  reconnectTimerRef.current = setTimeout(() => {
    if (cancelledRef.current) return;
    void connectSSE(args);
  }, backoff + jitter);
}

function teardown(
  eventSourceRef: React.MutableRefObject<EventSource | null>,
  reconnectTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
) {
  teardownSource(eventSourceRef);
  if (reconnectTimerRef.current) {
    clearTimeout(reconnectTimerRef.current);
    reconnectTimerRef.current = null;
  }
}

function teardownSource(eventSourceRef: React.MutableRefObject<EventSource | null>) {
  if (eventSourceRef.current) {
    eventSourceRef.current.close();
    eventSourceRef.current = null;
  }
}

/**
 * Coerce a streamed payload from the supervisor into a `ConversationEvent`.
 * The supervisor sends `{conversationId, seq, kind, claudeMessageUuid, payload}`
 * over SSE — the same shape as a persisted row, modulo `_id` and DB createdAt.
 * We synthesize an `_id` and `createdAt` so the React component can key off them.
 */
function normalizeStreamedEvent(raw: unknown): ConversationEvent | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as Record<string, unknown>;
  if (typeof v.seq !== 'number') return null;
  if (typeof v.kind !== 'string') return null;
  if (typeof v.conversationId !== 'string') return null;
  return {
    _id: typeof v._id === 'string' ? v._id : `sse:${v.conversationId}:${v.seq}`,
    conversationId: v.conversationId,
    seq: v.seq,
    kind: v.kind as ConversationEvent['kind'],
    claudeMessageUuid: typeof v.claudeMessageUuid === 'string' ? v.claudeMessageUuid : null,
    payload: v.payload,
    createdAt: typeof v.createdAt === 'string' ? v.createdAt : new Date().toISOString(),
  };
}

/**
 * Merge new events into an existing list, keeping order by seq and dropping
 * duplicates (last-write-wins on the same seq, since the supervisor may
 * resend an event during reconnect overlap).
 */
function mergeBySeq(prev: ConversationEvent[], incoming: ConversationEvent[]): ConversationEvent[] {
  if (incoming.length === 0) return prev;
  const bySeq = new Map<number, ConversationEvent>();
  for (const e of prev) bySeq.set(e.seq, e);
  for (const e of incoming) bySeq.set(e.seq, e);
  return Array.from(bySeq.values()).sort((a, b) => a.seq - b.seq);
}

function appendQueryParams(url: string, params: Record<string, string>): string {
  const u = new URL(url);
  for (const [k, v] of Object.entries(params)) {
    if (v === '' || v === undefined || v === null) continue;
    u.searchParams.set(k, v);
  }
  return u.toString();
}
