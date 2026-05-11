'use client';

import React, { useState } from 'react';
import classNames from 'classnames';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import ForumIcon from '../common/ForumIcon';
import {
  SupervisorHealth,
  SupervisorHealthFailureDetail,
  useSupervisorHealth,
} from './hooks/SupervisorHealthContext';

const styles = defineStyles('SupervisorHealthBanner', (theme: ThemeType) => ({
  root: {
    background: '#FFF4D1', // amber, fixed; we don't want this to invert in dark mode
    color: '#5A4500',
    borderBottom: '1px solid #E0B400',
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    fontSize: 13,
    lineHeight: 1.4,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  // Always-light-mode UI — supervisor banner is rare and intentionally
  // attention-grabbing; we want the same amber wherever it appears.
  message: {
    flex: 1,
    minWidth: 0,
  },
  prodHeadline: {
    fontWeight: 600,
  },
  detailsToggle: {
    background: 'transparent',
    border: 'none',
    padding: '0 4px',
    color: '#5A4500',
    cursor: 'pointer',
    textDecoration: 'underline',
    font: 'inherit',
    marginLeft: 6,
  },
  details: {
    marginTop: 6,
    fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
    fontSize: 12,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    background: 'rgba(0,0,0,0.04)',
    padding: '6px 8px',
    borderRadius: 3,
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    padding: 4,
    cursor: 'pointer',
    color: '#5A4500',
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    '&:hover': { color: '#000' },
  },
  icon: {
    '--icon-size': '14px',
  },
}), { allowNonThemeColors: true });

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Workspace-level banner shown when the supervisor reports its outbound
 * persistence pipe is degraded. Driven by the SSE-pushed health snapshot
 * from `SupervisorHealthContext`. Hidden when status is healthy or no
 * snapshot has arrived yet.
 *
 * Two copy modes:
 *  - prod: a single, non-technical line directing the user to retry/refresh.
 *  - dev: technical detail (URL, status, body snippet, attempts) inline by
 *    default-collapsed; expandable.
 */
export default function SupervisorHealthBanner() {
  const ctx = useSupervisorHealth();
  const classes = useStyles(styles);
  const [expanded, setExpanded] = useState(isDev);

  if (!ctx) return null;
  const { health, dismiss, dismissed } = ctx;
  if (!health || health.status === 'healthy' || dismissed) return null;

  return (
    <div className={classes.root} role="alert" aria-live="polite">
      <div className={classes.message}>
        {isDev
          ? <DevMessage health={health} expanded={expanded} setExpanded={setExpanded} />
          : <ProdMessage />
        }
      </div>
      <button
        type="button"
        className={classNames(classes.closeBtn)}
        onClick={dismiss}
        title="Dismiss"
        aria-label="Dismiss banner"
      >
        <ForumIcon icon="Close" className={classes.icon} />
      </button>
    </div>
  );
}

function ProdMessage() {
  return (
    <span>
      We're having trouble saving your conversation events. Your in-progress
      response is still streaming, but recent activity may not have been
      persisted. Please refresh, or contact support if this continues.
    </span>
  );
}

function DevMessage({
  health,
  expanded,
  setExpanded,
}: {
  health: SupervisorHealth;
  expanded: boolean;
  setExpanded: (b: boolean) => void;
}) {
  const classes = useStyles(styles);
  const lf = health.lastFailure;
  return (
    <>
      <span className={classes.prodHeadline}>
        Supervisor → backend persistence is failing.
      </span>{' '}
      <span>
        {health.consecutiveFailures} consecutive failure{health.consecutiveFailures === 1 ? '' : 's'},{' '}
        {health.droppedEventCount} event{health.droppedEventCount === 1 ? '' : 's'} dropped this session.
      </span>
      <button
        type="button"
        className={classes.detailsToggle}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? 'Hide details' : 'Show details'}
      </button>
      {expanded && lf ? <DevDetails detail={lf} /> : null}
    </>
  );
}

function DevDetails({ detail }: { detail: SupervisorHealthFailureDetail }) {
  const classes = useStyles(styles);
  const lines: string[] = [
    `kind:        ${detail.kind}`,
    `targetUrl:   ${detail.targetUrl}`,
  ];
  if (detail.httpStatus !== null) {
    lines.push(`httpStatus:  ${detail.httpStatus}`);
  }
  if (detail.networkError !== null) {
    lines.push(`networkError: ${detail.networkError}`);
  }
  lines.push(`attempts:    ${detail.attempts}`);
  if (detail.context.conversationId) {
    lines.push(`conversation: ${detail.context.conversationId}`);
  }
  if (detail.context.eventKind) {
    lines.push(`eventKind:   ${detail.context.eventKind}`);
  }
  if (detail.context.claudeMessageUuid) {
    lines.push(`messageUuid: ${detail.context.claudeMessageUuid}`);
  }
  if (detail.responseBodySnippet) {
    lines.push(`bodySnippet: ${detail.responseBodySnippet}`);
  }
  return <div className={classes.details}>{lines.join('\n')}</div>;
}
