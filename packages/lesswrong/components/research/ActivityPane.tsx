"use client";

import React from 'react';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import Loading from '../vulcan-core/Loading';

interface ActivityPaneProps {
  projectId: string;
}

const ResearchProjectActivityQuery = gql(`
  query ResearchProjectActivityQuery($projectId: String!, $since: Date) {
    researchProjectActivity(projectId: $projectId, since: $since) {
      kind
      timestamp
      conversationId
      documentId
      title
      summary
    }
  }
`);

const styles = defineStyles('ActivityPane', (theme: ThemeType) => ({
  root: {
    padding: '12px 16px',
    height: '100%',
    overflow: 'auto',
  },
  empty: {
    padding: 24,
    textAlign: 'center',
    color: theme.palette.text.dim,
    fontSize: 13,
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  item: {
    padding: '10px 0',
    borderBottom: theme.palette.greyBorder('1px', 0.05),
  },
  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 11,
    color: theme.palette.text.dim,
    marginBottom: 4,
  },
  kindLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: 600,
  },
  title: {
    fontSize: 14,
    fontWeight: 500,
    color: theme.palette.text.primary,
    marginBottom: 4,
  },
  summary: {
    fontSize: 13,
    color: theme.palette.text.dim,
    lineHeight: 1.4,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
  },
}));

const ActivityPane = ({ projectId }: ActivityPaneProps) => {
  const classes = useStyles(styles);
  const { data, loading } = useQuery(ResearchProjectActivityQuery, {
    variables: { projectId, since: null },
    fetchPolicy: 'cache-and-network',
    pollInterval: 15_000,
  });

  const items = data?.researchProjectActivity ?? [];

  if (loading && items.length === 0) {
    return <div className={classes.root}><Loading /></div>;
  }

  if (items.length === 0) {
    return <div className={classes.empty}>No activity yet.</div>;
  }

  return (
    <div className={classes.root}>
      <ul className={classes.list}>
        {items.map((item, idx) => (
          <li key={`${item.kind}-${item.timestamp}-${idx}`} className={classes.item}>
            <div className={classes.meta}>
              <span className={classes.kindLabel}>{labelForKind(item.kind)}</span>
              <span>{formatTimestamp(item.timestamp)}</span>
            </div>
            {item.title ? <div className={classes.title}>{item.title}</div> : null}
            {item.summary ? <div className={classes.summary}>{item.summary}</div> : null}
          </li>
        ))}
      </ul>
    </div>
  );
};

function labelForKind(kind: string): string {
  switch (kind) {
    case 'conversation_event': return 'Chat';
    case 'document_edit': return 'Edit';
    default: return kind;
  }
}

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleString();
  } catch {
    return ts;
  }
}

export default ActivityPane;
