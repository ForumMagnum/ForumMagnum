'use client';

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { z } from 'zod';
import { getSentry } from '@/lib/sentryWrapper';

/**
 * Mirror of the supervisor's `SupervisorHealth` (server-side type at
 * `packages/lesswrong/server/research/sandbox/supervisor/healthTracker.ts`).
 * Kept duplicated rather than imported because the supervisor module is
 * server-only — its own deps include node:os, node:fs, etc.
 */
export type SupervisorHealthStatus = 'healthy' | 'unhealthy';

export type SupervisorHealthFailureKind = 'event_post' | 'heartbeat' | 'suspect_success';

export type SupervisorHealthNetworkErrorClass =
  | 'dns_unresolved'
  | 'connection_refused'
  | 'timeout'
  | 'tls_failed'
  | 'other';

export interface SupervisorHealthFailureContext {
  conversationId?: string;
  eventKind?: string;
  claudeMessageUuid?: string | null;
}

export interface SupervisorHealthFailureDetail {
  at: number;
  kind: SupervisorHealthFailureKind;
  targetUrl: string;
  httpStatus: number | null;
  networkError: SupervisorHealthNetworkErrorClass | null;
  responseBodySnippet: string | null;
  attempts: number;
  context: SupervisorHealthFailureContext;
}

export interface SupervisorHealth {
  status: SupervisorHealthStatus;
  consecutiveFailures: number;
  lastSuccessAt: number | null;
  droppedEventCount: number;
  lastFailure: SupervisorHealthFailureDetail | null;
}

const supervisorHealthFailureContextSchema: z.ZodType<SupervisorHealthFailureContext> = z.object({
  conversationId: z.string().optional(),
  eventKind: z.string().optional(),
  claudeMessageUuid: z.string().nullable().optional(),
});

const supervisorHealthFailureDetailSchema: z.ZodType<SupervisorHealthFailureDetail> = z.object({
  at: z.number(),
  kind: z.enum(['event_post', 'heartbeat', 'suspect_success']),
  targetUrl: z.string(),
  httpStatus: z.number().nullable(),
  networkError: z.enum(['dns_unresolved', 'connection_refused', 'timeout', 'tls_failed', 'other']).nullable(),
  responseBodySnippet: z.string().nullable(),
  attempts: z.number(),
  context: supervisorHealthFailureContextSchema,
});

const supervisorHealthSchema: z.ZodType<SupervisorHealth> = z.object({
  status: z.enum(['healthy', 'unhealthy']),
  consecutiveFailures: z.number(),
  lastSuccessAt: z.number().nullable(),
  droppedEventCount: z.number(),
  lastFailure: supervisorHealthFailureDetailSchema.nullable(),
});

export function parseSupervisorHealth(raw: unknown): SupervisorHealth | null {
  const result = supervisorHealthSchema.safeParse(raw);
  return result.success ? result.data : null;
}

interface SupervisorHealthContextValue {
  /** Latest reported snapshot from any active conversation stream, or null. */
  health: SupervisorHealth | null;
  /** Called by `useConversationStream` whenever the supervisor emits a `health` SSE event. */
  reportHealth: (snapshot: SupervisorHealth) => void;
  /**
   * Manual dismiss for the banner. Hides the current report; banner re-shows
   * if a new transition arrives. Cleared automatically when status returns to
   * "healthy".
   */
  dismiss: () => void;
  dismissed: boolean;
}

const SupervisorHealthContext = createContext<SupervisorHealthContextValue | null>(null);

export function SupervisorHealthProvider({ children }: { children: React.ReactNode }) {
  const [health, setHealth] = useState<SupervisorHealth | null>(null);
  const [dismissed, setDismissed] = useState(false);
  // Track the timestamp of the last failure shown so we can clear `dismissed`
  // when a *new* failure arrives — without this, clicking dismiss permanently
  // silences the banner for the rest of the session.
  const lastFailureAtRef = useRef<number | null>(null);
  // Track previous status so we can fire a Sentry event exactly once per
  // healthy → unhealthy transition rather than flooding on every failure.
  const prevStatusRef = useRef<SupervisorHealthStatus | null>(null);

  const reportHealth = useCallback((snapshot: SupervisorHealth) => {
    setHealth(snapshot);
    // Clear the dismiss flag whenever we get a strictly newer failure — i.e.,
    // the user is being told about a new problem, not the same one.
    const newAt = snapshot.lastFailure?.at ?? null;
    if (newAt !== null && newAt !== lastFailureAtRef.current) {
      lastFailureAtRef.current = newAt;
      setDismissed(false);
    }
    if (snapshot.status === 'healthy') {
      setDismissed(false);
    }

    // Dev-only: surface every event to the browser console so a dev with a
    // background tab still notices.
    if (process.env.NODE_ENV !== 'production') {
      const lf = snapshot.lastFailure;
      // eslint-disable-next-line no-console
      console.warn(
        '[research-supervisor] health=' + snapshot.status
        + ' consecutiveFailures=' + snapshot.consecutiveFailures
        + ' droppedEventCount=' + snapshot.droppedEventCount
        + (lf
          ? ' lastFailure: ' + lf.kind + ' ' + (lf.httpStatus ?? lf.networkError ?? 'n/a')
            + ' url=' + lf.targetUrl
            + (lf.context.conversationId ? ' conv=' + lf.context.conversationId : '')
            + (lf.context.eventKind ? ' kind=' + lf.context.eventKind : '')
            + (lf.responseBodySnippet ? ' body=' + JSON.stringify(lf.responseBodySnippet) : '')
          : '')
      );
    }

    // Forward to Sentry only on the healthy → unhealthy transition, so the
    // backend ops team sees the signal once when persistence breaks (rather
    // than once per dropped event). The browser → Sentry path is independent
    // of the broken supervisor → backend pipe, so this signal reaches ops
    // even when nothing on the backend is logging.
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = snapshot.status;
    if (snapshot.status === 'unhealthy' && prevStatus !== 'unhealthy') {
      const sentry = getSentry();
      sentry?.captureMessage('Research supervisor persistence pipe degraded', {
        level: 'warning',
        extra: {
          consecutiveFailures: snapshot.consecutiveFailures,
          droppedEventCount: snapshot.droppedEventCount,
          lastFailure: snapshot.lastFailure,
        },
      });
    }
  }, []);

  const dismiss = useCallback(() => setDismissed(true), []);

  const value = useMemo<SupervisorHealthContextValue>(() => ({
    health,
    reportHealth,
    dismiss,
    dismissed,
  }), [health, reportHealth, dismiss, dismissed]);

  return (
    <SupervisorHealthContext.Provider value={value}>
      {children}
    </SupervisorHealthContext.Provider>
  );
}

/**
 * Read-side hook for the banner.
 */
export function useSupervisorHealth(): SupervisorHealthContextValue | null {
  return useContext(SupervisorHealthContext);
}

/**
 * Write-side hook for `useConversationStream`. Returns a noop reporter when
 * called outside a `SupervisorHealthProvider` so the hook stays usable in
 * isolated contexts (storybooks, tests).
 */
export function useReportSupervisorHealth(): (snapshot: SupervisorHealth) => void {
  const ctx = useContext(SupervisorHealthContext);
  return ctx?.reportHealth ?? noopReportHealth;
}

function noopReportHealth(_snapshot: SupervisorHealth): void {
  /* no provider in scope */
}
