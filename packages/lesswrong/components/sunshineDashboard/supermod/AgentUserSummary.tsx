'use client';

import React from 'react';
import moment from 'moment';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import { renderAgentMarkdown } from './agentMarkdown';

const LatestSummaryForUserQuery = gql(`
  query multiModerationSummariesForUserQuery($selector: ModerationSummarySelector, $limit: Int) {
    moderationSummaries(selector: $selector, limit: $limit) {
      results {
        ...ModerationSummaryDisplay
      }
    }
  }
`);

const styles = defineStyles('AgentUserSummary', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  heading: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: theme.palette.grey[600],
  },
  meta: {
    fontSize: 11,
    color: theme.palette.grey[500],
  },
  contents: {
    fontSize: 13,
    lineHeight: 1.45,
    color: theme.palette.text.normal,
    maxHeight: 220,
    overflowY: 'auto',
    '& p, & ul, & ol': {
      marginTop: 0,
      marginBottom: 6,
    },
    '& :last-child': {
      marginBottom: 0,
    },
    '& ul, & ol': {
      paddingLeft: 18,
    },
  },
}));

/** The most recent agent-written moderation summary for the opened user */
const AgentUserSummary = ({ user }: { user: SunshineUsersList }) => {
  const classes = useStyles(styles);
  const { data } = useQuery(LatestSummaryForUserQuery, {
    variables: {
      selector: { summariesForUser: { targetUserId: user._id } },
      limit: 1,
    },
    ssr: false,
  });

  const summary = data?.moderationSummaries?.results?.[0];
  if (!summary) return null;

  return (
    <div className={classes.root}>
      <div className={classes.heading}>Agent summary</div>
      <div className={classes.meta}>
        {moment(new Date(summary.createdAt)).fromNow()}
        {summary.createdByUser?.displayName ? ` · session by ${summary.createdByUser.displayName}` : ''}
      </div>
      <div className={classes.contents} dangerouslySetInnerHTML={{ __html: renderAgentMarkdown(summary.contents ?? '') }} />
    </div>
  );
};

export default AgentUserSummary;
