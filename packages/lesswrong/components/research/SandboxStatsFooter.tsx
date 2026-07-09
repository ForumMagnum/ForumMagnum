'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { useMutation } from '@apollo/client/react';
import moment from '@/lib/moment-timezone';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useMessages } from '@/components/common/withMessages';
import { retryWhileSandboxWarming } from './sandboxWarming';
import { researchMono, researchRadius, researchWarmAlpha } from './researchStyleUtils';
import { formatBytes } from './formatBytes';
import { formatModelName } from './conversationEventFormat';

const SandboxStatsQuery = gql(`
  query ResearchSandboxStats($conversationId: String!) {
    researchSandboxStats(conversationId: $conversationId) {
      running
      cpuPct
      memUsed
      memTotal
      diskUsed
      diskTotal
      hibernatingSince
    }
  }
`);

const RestartResearchSandboxMutation = gql(`
  mutation RestartResearchSandbox($conversationId: String!) {
    restartResearchSandbox(conversationId: $conversationId) {
      running
    }
  }
`);

const POLL_MS = 5000;

const styles = defineStyles('SandboxStatsFooter', (theme: ThemeType) => ({
  root: {
    flex: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '5px 12px',
    borderTop: `1px solid ${researchWarmAlpha(0.08)}`,
    fontFamily: researchMono,
    fontSize: 10.5,
    color: theme.palette.text.dim,
    userSelect: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  stat: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  label: {
    color: researchWarmAlpha(0.45),
    letterSpacing: '0.04em',
  },
  value: {
    color: theme.palette.text.dim,
  },
  // Denser variants: as the footer's container narrows we tighten the gaps,
  // shrink then drop the meters, and shorten the MEM/DISK read-outs to a bare
  // percentage, so all three stats keep fitting inside a small tile.
  rootCompact: {
    gap: 9,
  },
  rootTight: {
    gap: 6,
    fontSize: 10,
  },
  meter: {
    flex: 'none',
    width: 44,
    height: 4,
    borderRadius: 2,
    background: researchWarmAlpha(0.12),
    overflow: 'hidden',
  },
  meterCompact: {
    width: 24,
  },
  // Model of the last response, pinned to the right edge of the footer row.
  modelChip: {
    marginLeft: 'auto',
    flex: 'none',
    paddingLeft: 8,
    color: theme.palette.text.dim,
    whiteSpace: 'nowrap',
  },
  meterFill: {
    display: 'block',
    height: '100%',
    background: theme.palette.primary.main,
    borderRadius: 2,
  },
  meterFillHigh: {
    background: theme.palette.error?.main ?? theme.palette.primary.main,
  },
  hibernating: {
    color: researchWarmAlpha(0.45),
    fontStyle: 'italic',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  restartButton: {
    marginLeft: 'auto',
    flex: 'none',
    border: 'none',
    background: 'transparent',
    borderRadius: researchRadius.xs,
    fontFamily: researchMono,
    fontSize: 10.5,
    lineHeight: 1.4,
    color: theme.palette.text.dim,
    padding: '2px 6px',
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.text.primary,
      background: researchWarmAlpha(0.06),
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'default',
    },
  },
}));

interface MeterProps {
  fraction: number | null;
  compact?: boolean;
}

const Meter = ({ fraction, compact }: MeterProps) => {
  const classes = useStyles(styles);
  if (fraction == null) return null;
  const pct = Math.max(0, Math.min(1, fraction)) * 100;
  return (
    <span className={classNames(classes.meter, compact && classes.meterCompact)}>
      <span
        className={fraction >= 0.9 ? `${classes.meterFill} ${classes.meterFillHigh}` : classes.meterFill}
        style={{ width: `${pct}%` }}
      />
    </span>
  );
};

interface SandboxStatsFooterProps {
  conversationId: string;
  /** Model that served the last main-thread response (shown at the row's right edge). */
  model?: string | null;
}

export const SandboxStatsFooter = ({ conversationId, model }: SandboxStatsFooterProps) => {
  const classes = useStyles(styles);
  const { flash } = useMessages();
  const { data, refetch } = useQuery(SandboxStatsQuery, {
    variables: { conversationId },
    pollInterval: POLL_MS,
  });
  const [restartSandbox] = useMutation(RestartResearchSandboxMutation);
  const [restarting, setRestarting] = useState(false);
  const unmountedRef = useRef(false);

  // Track the footer's own rendered width so it can compact itself inside a
  // small tile. `dense` drops to percentage read-outs + smaller meters; `tight`
  // also hides the meters. React calls the callback ref with null on unmount,
  // which disconnects the observer.
  const [width, setWidth] = useState<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const measureRef = useCallback((el: HTMLDivElement | null) => {
    resizeObserverRef.current?.disconnect();
    if (!el || typeof ResizeObserver === 'undefined') {
      resizeObserverRef.current = null;
      return;
    }
    // observe() fires the callback immediately with the current content size, so
    // there's no need to seed the width separately (which would mix border-box
    // and content-box measurements).
    const observer = new ResizeObserver((entries) => {
      const measured = entries[0]?.contentRect.width;
      if (measured != null) setWidth(measured);
    });
    observer.observe(el);
    resizeObserverRef.current = observer;
  }, []);
  const dense = width != null && width < 460;
  const tight = width != null && width < 330;

  useEffect(() => {
    unmountedRef.current = false;
    return () => { unmountedRef.current = true; };
  }, []);

  const handleRestart = useCallback(async () => {
    if (restarting) return;
    setRestarting(true);
    try {
      const result = await retryWhileSandboxWarming(
        () => restartSandbox({ variables: { conversationId } }),
        () => unmountedRef.current,
      );
      if (result) await refetch();
    } catch (err) {
      if (!unmountedRef.current) {
        // eslint-disable-next-line no-console
        console.error('[research] restart sandbox failed', err);
        flash({ messageString: `Failed to restart sandbox: ${(err as Error).message}`, type: 'error' });
      }
    } finally {
      if (!unmountedRef.current) setRestarting(false);
    }
  }, [restarting, conversationId, restartSandbox, refetch, flash]);

  const modelChip = model
    ? <span className={classes.modelChip} title={model}>{formatModelName(model)}</span>
    : null;
  const rowClass = classNames(classes.root, dense && classes.rootCompact, tight && classes.rootTight);

  const stats = data?.researchSandboxStats;
  if (!stats) {
    return modelChip ? <div ref={measureRef} className={rowClass}>{modelChip}</div> : null;
  }

  if (!stats.running) {
    const since = stats.hibernatingSince
      ? ` since ${moment(stats.hibernatingSince).format('MMM D, h:mm A')}`
      : '';
    return (
      <div ref={measureRef} className={rowClass}>
        <span className={classes.hibernating}>Instance hibernating{since}</span>
        {modelChip}
        <button
          type="button"
          className={classes.restartButton}
          disabled={restarting}
          onClick={handleRestart}
          title="Resume this conversation's sandbox"
        >
          {restarting ? 'starting…' : 'restart'}
        </button>
      </div>
    );
  }

  const memFraction = stats.memUsed != null && stats.memTotal ? stats.memUsed / stats.memTotal : null;
  const diskFraction = stats.diskUsed != null && stats.diskTotal ? stats.diskUsed / stats.diskTotal : null;
  const hasAny = stats.cpuPct != null || memFraction != null || diskFraction != null;
  if (!hasAny) {
    return modelChip ? <div ref={measureRef} className={rowClass}>{modelChip}</div> : null;
  }

  return (
    <div ref={measureRef} className={rowClass}>
      {stats.cpuPct != null ? (
        <span className={classes.stat}>
          <span className={classes.label}>CPU</span>
          {!tight ? <Meter fraction={stats.cpuPct / 100} compact={dense} /> : null}
          <span className={classes.value}>{stats.cpuPct.toFixed(0)}%</span>
        </span>
      ) : null}
      {memFraction != null ? (
        <span className={classes.stat}>
          <span className={classes.label}>MEM</span>
          {!tight ? <Meter fraction={memFraction} compact={dense} /> : null}
          <span className={classes.value}>
            {dense
              ? `${Math.round(memFraction * 100)}%`
              : `${formatBytes(stats.memUsed!)} / ${formatBytes(stats.memTotal!)}`}
          </span>
        </span>
      ) : null}
      {diskFraction != null ? (
        <span className={classes.stat}>
          <span className={classes.label}>DISK</span>
          {!tight ? <Meter fraction={diskFraction} compact={dense} /> : null}
          <span className={classes.value}>
            {dense
              ? `${Math.round(diskFraction * 100)}%`
              : `${formatBytes(stats.diskUsed!)} / ${formatBytes(stats.diskTotal!)}`}
          </span>
        </span>
      ) : null}
      {modelChip}
    </div>
  );
};
