'use client';

import React from 'react';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { researchMono, researchWarmAlpha } from './researchStyleUtils';

const SandboxStatsQuery = gql(`
  query ResearchSandboxStats($conversationId: String!) {
    researchSandboxStats(conversationId: $conversationId) {
      running
      cpuPct
      memUsed
      memTotal
      diskUsed
      diskTotal
    }
  }
`);

const POLL_MS = 5000;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(0)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

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
  // A thin usage bar; the fill is the sage accent, warming toward the
  // error color as it approaches full.
  meter: {
    flex: 'none',
    width: 44,
    height: 4,
    borderRadius: 2,
    background: researchWarmAlpha(0.12),
    overflow: 'hidden',
  },
  meterFill: {
    // Must be block: width/height are ignored on an inline <span>, so without
    // this the fill collapses to zero and the meter never shades.
    display: 'block',
    height: '100%',
    background: theme.palette.primary.main,
    borderRadius: 2,
  },
  meterFillHigh: {
    background: theme.palette.error?.main ?? theme.palette.primary.main,
  },
  idle: {
    color: researchWarmAlpha(0.4),
    fontStyle: 'italic',
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

/**
 * Compact resource-utilization strip for a conversation's sandbox: CPU %,
 * memory used/total, and workspace disk used/total, each with a thin meter.
 * Polls while mounted; renders nothing (no footer) when the sandbox is down or
 * stats are unavailable, so it never shows a dead bar.
 */
export const SandboxStatsFooter = ({ conversationId }: SandboxStatsFooterProps) => {
  const classes = useStyles(styles);
  const { data } = useQuery(SandboxStatsQuery, {
    variables: { conversationId },
    pollInterval: POLL_MS,
  });
  const stats = data?.researchSandboxStats;

  if (!stats || !stats.running) return null;

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
