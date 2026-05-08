'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gql } from '@/lib/generated/gql-codegen';
import { useApolloClient } from '@apollo/client/react';
import { isPlainRecord } from '../conversationEventFormat';
import { randomId } from '@/lib/random';

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
  /**
   * Append a client-side event to the local stream without going through the
   * backend. Use to render an optimistic user message before its persisted
   * twin lands. The optimistic copy is wiped on the next `refresh()` (which
   * replaces the events list with the fresh transcript).
   */
  injectOptimisticEvent: (event: ConversationEvent) => void;
}

/** Min/max backoff for SSE reconnect attempts, in ms. */
const RECONNECT_MIN_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;

/**
 * Polling interval used when the sandbox is idle. Bounded by
 * `MAX_IDLE_EMPTY_POLLS` so a chat pane left open on an idle conversation
 * doesn't fire forever — after that many consecutive empty polls the loop
 * stops; refresh() restarts it.
 */
const IDLE_POLL_MS = 2_000;
const MAX_IDLE_EMPTY_POLLS = 60;

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
  const idleEmptyPollsRef = useRef(0);

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
    idleEmptyPollsRef.current = 0;
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
      idleEmptyPollsRef,
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

  const injectOptimisticEvent = useCallback((event: ConversationEvent) => {
    setEvents((prev) => mergeEvents(prev, [event]));
  }, []);

  return {
    events,
    status,
    error,
    latestSeq,
    refresh: () => setRefreshNonce((n) => n + 1),
    injectOptimisticEvent,
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
  idleEmptyPollsRef: React.MutableRefObject<number>;
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
  return parseStreamInfo(await res.json());
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

  // Sandbox is idle / not yet provisioned. Re-fetch persisted events on a
  // short timer so a conversation racing sandbox cold-start eventually
  // surfaces results without manual refresh. Bounded by `MAX_IDLE_EMPTY_POLLS`
  // to avoid hammering the backend forever on a chat pane left open on a
  // dead-idle conversation.
  if (!info.sseUrl) {
    const { idleEmptyPollsRef } = args;
    setStatus('loading');
    setError(null);
    reconnectAttemptsRef.current = 0;
    let gotNewEvents = false;
    try {
      const since = latestSeqRef.current;
      const replay = await loadPersistedEvents(args.apollo, conversationId, since);
      if (cancelledRef.current) return;
      if (replay.length > 0) {
        gotNewEvents = true;
        setEvents((prev) => mergeEvents(prev, replay));
        latestSeqRef.current = Math.max(latestSeqRef.current, replay[replay.length - 1].seq);
      }
    } catch {
      // Swallow — we'll try again on the next poll tick.
    }
    if (cancelledRef.current) return;
    idleEmptyPollsRef.current = gotNewEvents ? 0 : idleEmptyPollsRef.current + 1;
    if (idleEmptyPollsRef.current >= MAX_IDLE_EMPTY_POLLS) {
      setStatus('idle');
      return;
    }
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    reconnectTimerRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      void connectSSE(args);
    }, IDLE_POLL_MS);
    return;
  }

  // Re-fetch any events the supervisor persisted while we were offline so we
  // never present a gap, then subscribe with `?since=<newLatestSeq>`.
  try {
    const since = latestSeqRef.current;
    const replay = await loadPersistedEvents(args.apollo, conversationId, since);
    if (cancelledRef.current) return;
    if (replay.length > 0) {
      setEvents((prev) => mergeEvents(prev, replay));
      latestSeqRef.current = Math.max(latestSeqRef.current, replay[replay.length - 1].seq);
    }
  } catch (err) {
    if (cancelledRef.current) return;
    scheduleReconnect(args, err instanceof Error ? err.message : String(err));
    return;
  }

  // No `since` query param: EventSource sends `Last-Event-ID` automatically
  // on reconnect, and the supervisor reads that header to replay buffered
  // events. The supervisor's seq is opaque to us — we don't need to track it.
  const url = appendQueryParams(info.sseUrl, {
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
      const raw = JSON.parse(msg.data);
      const ev = normalizeStreamedEvent(raw);
      if (!ev) return;
      setEvents((prev) => mergeEvents(prev, [ev]));
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
 * The supervisor sends `{conversationId, kind, claudeMessageUuid, payload}`
 * over SSE — no `seq`, since the supervisor's local seq is private buffer-
 * index state and the persisted seq comes from the GraphQL transcript. We
 * synthesize `_id`, `createdAt`, and a sentinel `seq` so the React component
 * can render the row before the persisted twin (if any) arrives.
 */
function normalizeStreamedEvent(raw: unknown): ConversationEvent | null {
  if (!isPlainRecord(raw)) return null;
  if (typeof raw.kind !== 'string') return null;
  if (typeof raw.conversationId !== 'string') return null;
  const uuid = typeof raw.claudeMessageUuid === 'string' ? raw.claudeMessageUuid : null;
  return {
    // Synthetic id; mergeEvents distinguishes these from persisted rows by
    // the `sse:` prefix so the persisted version (with the real DB _id) wins
    // once the postPersister chain catches up.
    _id: `sse:${raw.conversationId}:${uuid ?? randomId()}`,
    conversationId: raw.conversationId,
    seq: -1,
    kind: raw.kind,
    claudeMessageUuid: uuid,
    payload: raw.payload,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
  };
}

function parseStreamInfo(raw: unknown): StreamInfo {
  if (!isPlainRecord(raw)) {
    throw new Error("Invalid stream-info response");
  }
  const { sseUrl, token, expiresAt } = raw;
  if (sseUrl !== null && typeof sseUrl !== 'string') {
    throw new Error("Invalid stream-info response: sseUrl");
  }
  if (token !== null && typeof token !== 'string') {
    throw new Error("Invalid stream-info response: token");
  }
  if (expiresAt !== undefined && expiresAt !== null && typeof expiresAt !== 'string') {
    throw new Error("Invalid stream-info response: expiresAt");
  }
  return { sseUrl, token, expiresAt };
}

/**
 * Merge new events into an existing list, deduplicating across the two
 * sources (persisted GraphQL transcript vs. live SSE) and ordering by time.
 *
 * SSE messages carry no `seq` (supervisor seq is a private buffer index, not
 * exposed to clients), so we dedupe by `claudeMessageUuid` when set —
 * a Claude Code message keeps the same uuid in both its live and persisted
 * forms. Events without a uuid (our synthesized user prompt) fall back to
 * the synthetic `_id` we assigned in `normalizeStreamedEvent`.
 *
 * When the same uuid arrives from both sources we prefer the persisted copy
 * (real DB `_id`, authoritative backend seq + createdAt). Sort by `createdAt`
 * with `seq` as a tiebreaker; persisted events have monotonic backend seqs,
 * SSE-only events have `seq = -1` and rely on `createdAt`.
 */
function mergeEvents(prev: ConversationEvent[], incoming: ConversationEvent[]): ConversationEvent[] {
  if (incoming.length === 0) return prev;
  const dedupeKey = (e: ConversationEvent): string =>
    e.claudeMessageUuid ? `uuid:${e.claudeMessageUuid}` : `id:${e._id}`;
  const isPersisted = (e: ConversationEvent): boolean =>
    typeof e._id === 'string' && !e._id.startsWith('sse:');

  const merged = new Map<string, ConversationEvent>();
  for (const e of prev) merged.set(dedupeKey(e), e);
  for (const e of incoming) {
    const key = dedupeKey(e);
    const existing = merged.get(key);
    if (!existing || (!isPersisted(existing) && isPersisted(e))) {
      merged.set(key, e);
    }
  }
  return [...merged.values()].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    if (aTime !== bTime) return aTime - bTime;
    return a.seq - b.seq;
  });
}

function appendQueryParams(url: string, params: Record<string, string>): string {
  const u = new URL(url);
  for (const [k, v] of Object.entries(params)) {
    if (v === '') continue;
    u.searchParams.set(k, v);
  }
  return u.toString();
}
