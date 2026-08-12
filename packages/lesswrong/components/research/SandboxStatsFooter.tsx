'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { useMutation } from '@apollo/client/react';
import moment from '@/lib/moment-timezone';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useMessages } from '@/components/common/withMessages';
import { retryWhileSandboxWarming } from './sandboxWarming';
import { researchMono, researchRadius, researchWarmAlpha } from './researchStyleUtils';
import { formatBytes } from './formatBytes';

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
  meter: {
    flex: 'none',
    width: 44,
    height: 4,
    borderRadius: 2,
    background: researchWarmAlpha(0.12),
    overflow: 'hidden',
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
}

const Meter = ({ fraction }: MeterProps) => {
  const classes = useStyles(styles);
  if (fraction == null) return null;
  const pct = Math.max(0, Math.min(1, fraction)) * 100;
  return (
    <span className={classes.meter}>
      <span
        className={fraction >= 0.9 ? `${classes.meterFill} ${classes.meterFillHigh}` : classes.meterFill}
        style={{ width: `${pct}%` }}
      />
    </span>
  );
};

interface SandboxStatsFooterProps {
  conversationId: string;
}

export const SandboxStatsFooter = ({ conversationId }: SandboxStatsFooterProps) => {
  const classes = useStyles(styles);
  const { flash } = useMessages();
  const { data, refetch } = useQuery(SandboxStatsQuery, {
    variables: { conversationId },
    pollInterval: POLL_MS,
  });
  const [restartSandbox] = useMutation(RestartResearchSandboxMutation);
  const [restarting, setRestarting] = useState(false);
  const unmountedRef = useRef(false);

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

  const stats = data?.researchSandboxStats;
  if (!stats) return null;

  if (!stats.running) {
    const since = stats.hibernatingSince
      ? ` since ${moment(stats.hibernatingSince).format('MMM D, h:mm A')}`
      : '';
    return (
      <div className={classes.root}>
        <span className={classes.hibernating}>Instance hibernating{since}</span>
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
  if (!hasAny) return null;

  return (
    <div className={classes.root}>
      {stats.cpuPct != null ? (
        <span className={classes.stat}>
          <span className={classes.label}>CPU</span>
          <Meter fraction={stats.cpuPct / 100} />
          <span className={classes.value}>{stats.cpuPct.toFixed(0)}%</span>
        </span>
      ) : null}
      {memFraction != null ? (
        <span className={classes.stat}>
          <span className={classes.label}>MEM</span>
          <Meter fraction={memFraction} />
          <span className={classes.value}>{formatBytes(stats.memUsed!)} / {formatBytes(stats.memTotal!)}</span>
        </span>
      ) : null}
      {diskFraction != null ? (
        <span className={classes.stat}>
          <span className={classes.label}>DISK</span>
          <Meter fraction={diskFraction} />
          <span className={classes.value}>{formatBytes(stats.diskUsed!)} / {formatBytes(stats.diskTotal!)}</span>
        </span>
      ) : null}
    </div>
  );
};
