'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';
import type { ApolloClient } from '@apollo/client';
import { gql } from '@/lib/generated/gql-codegen';
import { useApolloClient } from '@apollo/client/react';
import { isPlainRecord } from '../conversationEventFormat';
import { randomId } from '@/lib/random';
import {
  parseSupervisorHealth,
  useReportSupervisorHealth,
} from './SupervisorHealthContext';

export interface ConversationEvent {
  _id: string;
  conversationId: string;
  seq: number;
  claudeMessageUuid?: string | null;
  kind: string;
  payload: unknown;
  createdAt: string;
}

// sseUrl is the discriminator: when non-null the sandbox is live and the
// other fields are populated together; when null the conversation has no
// active sandbox and all fields are null.
export type StreamInfo =
  | { sseUrl: string; token: string; expiresAt: string }
  | { sseUrl: null; token: null; expiresAt: null };

// Lightweight Result wrapper used by helpers that would otherwise throw for
// control flow (network failure, schema mismatch). Callers branch on `ok`
// instead of try/catch — try/catch is reserved for native APIs we can't
// statically rule out throwing from.
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
  // Optimistic local-only insert; wiped on the next refresh() by the fresh transcript.
  injectOptimisticEvent: (event: ConversationEvent) => void;
}

const RECONNECT_MIN_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;

// Exponential-backoff budget for catching a sandbox cold-start after the
// caller refreshes: 1s → 2s → 4s → 8s → 16s → 30s ≈ 61s total, 6 requests.
const IDLE_POLL_MIN_MS = 1_000;
const IDLE_POLL_MAX_MS = 30_000;
const MAX_IDLE_EMPTY_POLLS = 6;
const EXPECTED_ACTIVITY_TTL_MS = 2 * 60 * 1000;

const expectedActivityByConversation = new Map<string, number>();

export function markConversationActivityExpected(conversationId: string): void {
  expectedActivityByConversation.set(conversationId, Date.now());
}

function hasRecentExpectedActivity(conversationId: string): boolean {
  const markedAt = expectedActivityByConversation.get(conversationId);
  if (markedAt === undefined) return false;
  if (Date.now() - markedAt <= EXPECTED_ACTIVITY_TTL_MS) return true;
  expectedActivityByConversation.delete(conversationId);
  return false;
}

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

export function useConversationStream(
  conversationId: string | null | undefined,
  options: UseConversationStreamOptions = {},
): UseConversationStreamResult {
  const { liveStreaming = true } = options;
  const apollo = useApolloClient();
  const reportHealth = useReportSupervisorHealth();

  const [events, setEvents] = useState<ConversationEvent[]>([]);
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const latestSeqRef = useRef(-1);
  const reconnectAttemptsRef = useRef(0);
  // Fire-once signal from refresh(); consumed by the next effect run so a
  // later conversation switch can't inherit it.
  const expectActivityRef = useRef(false);
  // Pinned so the SSE handler reads the latest reporter without retriggering
  // the effect on each render.
  const reportHealthRef = useRef(reportHealth);
  useEffect(() => { reportHealthRef.current = reportHealth; }, [reportHealth]);

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
    // Alias to a const so the narrowed `string` type propagates into the
    // nested function declarations below — the captured `conversationId`
    // parameter would otherwise widen back to `string | null | undefined`.
    const id = conversationId;

    let cancelled = false;
    let eventSource: EventSource | null = null;
    let timer: NodeJS.Timeout | null = null;
    let idleEmptyPolls = 0;
    const expectActivity = expectActivityRef.current || hasRecentExpectedActivity(id);
    expectActivityRef.current = false;
    // Prime from the Apollo cache before kicking off the network fetch so a
    // re-mount (e.g. switching back to a previously-loaded research doc)
    // skips the empty-state flash. The network fetch below still runs and
    // merges in any newer events.
    const cachedEvents = readCachedTranscript(apollo, id);
    if (cachedEvents.length > 0) {
      setEvents(cachedEvents);
      latestSeqRef.current = cachedEvents[cachedEvents.length - 1].seq;
    } else {
      setStatus('loading');
    }
    setError(null);

    function scheduleReconnect(message: string) {
      if (cancelled) return;
      setStatus('reconnecting');
      setError(message);
      reconnectAttemptsRef.current += 1;
      const backoff = Math.min(
        RECONNECT_MAX_MS,
        RECONNECT_MIN_MS * (2 ** Math.min(reconnectAttemptsRef.current - 1, 8)),
      );
      // Jitter so multiple clients don't reconnect in lockstep.
      const jitter = Math.random() * 0.3 * backoff;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (!cancelled) void connectSSE();
      }, backoff + jitter);
    }

    // Entered when the caller expects work to start soon; stays in 'idle'
    // status the whole loop so it doesn't churn the UI between ticks.
    async function pollIdle() {
      if (cancelled) return;
      if (idleEmptyPolls >= MAX_IDLE_EMPTY_POLLS) return;

      const result = await discoverStreamInfo(id);
      if (cancelled) return;
      // On error: treat as still-idle and try again next tick.
      if (result.ok && result.value.sseUrl) {
        idleEmptyPolls = 0;
        await connectSSE();
        return;
      }

      idleEmptyPolls += 1;
      if (idleEmptyPolls >= MAX_IDLE_EMPTY_POLLS) return;

      const backoffMs = Math.min(
        IDLE_POLL_MAX_MS,
        IDLE_POLL_MIN_MS * (2 ** (idleEmptyPolls - 1)),
      );
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (!cancelled) void pollIdle();
      }, backoffMs);
    }

    async function connectSSE() {
      if (cancelled) return;
      setStatus(reconnectAttemptsRef.current > 0 ? 'reconnecting' : 'connecting');

      const infoResult = await discoverStreamInfo(id);
      if (cancelled) return;
      if (!infoResult.ok) {
        scheduleReconnect(infoResult.error);
        return;
      }
      const info = infoResult.value;

      if (!info.sseUrl) {
        setStatus('idle');
        setError(null);
        reconnectAttemptsRef.current = 0;
        if (expectActivity) void pollIdle();
        return;
      }

      // Replay anything persisted while we were offline before the EventSource
      // subscribes — supervisor's buffer covers from there via Last-Event-ID.
      const replayResult = await loadPersistedEvents(apollo, id, latestSeqRef.current);
      if (cancelled) return;
      if (!replayResult.ok) {
        scheduleReconnect(replayResult.error);
        return;
      }
      const replay = replayResult.value;
      if (replay.length > 0) {
        setEvents((prev) => mergeEvents(prev, replay));
        latestSeqRef.current = Math.max(latestSeqRef.current, replay[replay.length - 1].seq);
      }

      // Resume via the browser's automatic Last-Event-ID header, which the
      // supervisor maps back to its buffer; we don't pass `?since`.
      const url = new URL(info.sseUrl);
      url.searchParams.set('token', info.token);

      const es = new EventSource(url.toString(), { withCredentials: false });
      eventSource = es;

      es.onopen = () => {
        if (cancelled) return;
        reconnectAttemptsRef.current = 0;
        setStatus('streaming');
        setError(null);
      };

      // Supervisor emits each turn event as `event: jsonl`. `onmessage` only
      // fires for unnamed events, so we attach both — defensive either way.
      const handleSseMessage = (msg: MessageEvent) => {
        if (cancelled) return;
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

      es.addEventListener('health', (msg) => {
        if (cancelled) return;
        try {
          const parsed = parseSupervisorHealth(JSON.parse(msg.data));
          if (parsed) reportHealthRef.current(parsed);
        } catch {
          /* malformed health frame */
        }
      });

      es.onerror = () => {
        if (cancelled) return;
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        scheduleReconnect('SSE connection lost');
      };
    }

    void (async () => {
      const persistedResult = await loadPersistedEvents(apollo, id, -1);
      if (cancelled) return;
      if (!persistedResult.ok) {
        setStatus('error');
        setError(persistedResult.error);
        return;
      }
      const persisted = persistedResult.value;
      // Merge instead of replace so cache-primed events and any SSE events
      // received during the network round-trip aren't clobbered.
      setEvents((prev) => mergeEvents(prev, persisted));
      if (persisted.length > 0) {
        latestSeqRef.current = Math.max(
          latestSeqRef.current,
          persisted[persisted.length - 1].seq,
        );
      }
      if (!liveStreaming) {
        setStatus('idle');
        return;
      }
      await connectSSE();
    })();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (eventSource) eventSource.close();
    };
  }, [conversationId, liveStreaming, refreshNonce, apollo]);

  const injectOptimisticEvent = useCallback((event: ConversationEvent) => {
    setEvents((prev) => mergeEvents(prev, [event]));
  }, []);

  const refresh = useCallback(() => {
    expectActivityRef.current = true;
    setRefreshNonce((n) => n + 1);
  }, []);

  return {
    events,
    status,
    error,
    latestSeq,
    refresh,
    injectOptimisticEvent,
  };
}

type RawTranscriptRow = {
  _id: string;
  conversationId: string | null;
  seq: number | null;
  claudeMessageUuid?: string | null;
  kind: string | null;
  payload: unknown;
  createdAt: string;
};

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
    // readQuery throws if the query isn't in the cache and `returnPartialData`
    // isn't set; treat that as "no cache" and let the network fetch populate.
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

async function discoverStreamInfo(conversationId: string): Promise<Result<StreamInfo>> {
  try {
    const res = await fetch(
      `/api/research/conversations/${encodeURIComponent(conversationId)}/stream-info`,
      { method: 'GET', credentials: 'same-origin', headers: { 'Accept': 'application/json' } },
    );
    if (!res.ok) {
      return { ok: false, error: `Failed to discover stream URL: HTTP ${res.status}` };
    }
    const json = await res.json();
    const parsed = streamInfoSchema.safeParse(json);
    if (!parsed.success) {
      return { ok: false, error: `Invalid stream-info response: ${parsed.error.message}` };
    }
    return { ok: true, value: parsed.data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

function normalizeStreamedEvent(raw: unknown): ConversationEvent | null {
  if (!isPlainRecord(raw)) return null;
  if (typeof raw.kind !== 'string') return null;
  if (typeof raw.conversationId !== 'string') return null;
  const uuid = typeof raw.claudeMessageUuid === 'string' ? raw.claudeMessageUuid : null;
  return {
    // `sse:` prefix lets mergeEvents prefer the persisted twin once the
    // postPersister chain catches up and the real DB _id arrives.
    _id: `sse:${raw.conversationId}:${uuid ?? randomId()}`,
    conversationId: raw.conversationId,
    seq: -1,
    kind: raw.kind,
    claudeMessageUuid: uuid,
    payload: raw.payload,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
  };
}

const streamInfoSchema: z.ZodType<StreamInfo> = z.union([
  z.object({ sseUrl: z.string(), token: z.string(), expiresAt: z.string() }),
  z.object({ sseUrl: z.null(), token: z.null(), expiresAt: z.null() }),
]);

function eventDedupeKey(e: ConversationEvent): string {
  return e.claudeMessageUuid ? `uuid:${e.claudeMessageUuid}` : `id:${e._id}`;
}

function isPersistedEvent(e: ConversationEvent): boolean {
  return typeof e._id === 'string' && !e._id.startsWith('sse:');
}

function compareEventsByTime(a: ConversationEvent, b: ConversationEvent): number {
  const aTime = new Date(a.createdAt).getTime();
  const bTime = new Date(b.createdAt).getTime();
  if (aTime !== bTime) return aTime - bTime;
  return a.seq - b.seq;
}

// SSE events (seq=-1) dedupe against persisted GraphQL events by
// claudeMessageUuid; persisted always wins. Returns `prev` unchanged when the
// incoming events bring no new entries and no persisted-upgrades, so React
// state setters can early-out via reference equality and downstream
// `EventRow`s memoized on the event reference don't churn.
function mergeEvents(prev: ConversationEvent[], incoming: ConversationEvent[]): ConversationEvent[] {
  if (incoming.length === 0) return prev;
  const merged = new Map<string, ConversationEvent>();
  for (const e of prev) merged.set(eventDedupeKey(e), e);
  let changed = false;
  for (const e of incoming) {
    const key = eventDedupeKey(e);
    const existing = merged.get(key);
    if (!existing || (!isPersistedEvent(existing) && isPersistedEvent(e))) {
      merged.set(key, e);
      changed = true;
    }
  }
  if (!changed) return prev;
  return [...merged.values()].sort(compareEventsByTime);
}
