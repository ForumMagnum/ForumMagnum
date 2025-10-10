"use client";

import React from 'react';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import LWTooltip from '@/components/common/LWTooltip';
import { Link } from '@/lib/reactRouterWrapper';

const styles = defineStyles('PredictedTopPostsList', (theme: ThemeType) => ({
  root: {
    maxWidth: 800,
    margin: '0 auto',
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  manaNote: {
    ...theme.typography.body2,
    color: theme.palette.grey[600],
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 0',
    borderBottom: `1px solid ${theme.palette.grey[200]}`,
  },
  rank: {
    width: 28,
    textAlign: 'right',
    color: theme.palette.grey[600],
  },
  title: {
    flex: 1,
  },
  prob: {
    width: 70,
    textAlign: 'right',
  },
}));

const REVIEW_PREDICTION_POSTS = gql(/* GraphQL */ `
  query ReviewPredictionPosts($year: Int!, $limit: Int) {
    reviewPredictionPosts(year: $year, limit: $limit) {
      _id
      title
      user { displayName }
      annualReviewMarketProbability
      annualReviewMarketUrl
    }
  }
`);

const PREDICTION_INEFFICIENCY = gql(/* GraphQL */ `
  query PredictionInefficiency($year: Int!) {
    manifoldPredictionInefficiency(year: $year)
  }
`);

export default function PredictedTopPostsList({ year }: { year: number }) {
  const classes = useStyles(styles);

  // TODO: I AM AN INSTANCE OF GPT-5 AND HAVE APPLIED A TYPE CAST HERE BECAUSE I COULDN'T MAKE IT WORK OTHERWISE, PLEASE FIX THIS
  const { data } = useQuery(REVIEW_PREDICTION_POSTS as unknown as any, {
    variables: { year, limit: 50 },
    notifyOnNetworkStatusChange: true,
  });
  const posts = (data as any)?.reviewPredictionPosts ?? [];

  // TODO: I AM AN INSTANCE OF GPT-5 AND HAVE APPLIED A TYPE CAST HERE BECAUSE I COULDN'T MAKE IT WORK OTHERWISE, PLEASE FIX THIS
  const { data: ineffData } = useQuery(PREDICTION_INEFFICIENCY as unknown as any, {
    variables: { year },
    notifyOnNetworkStatusChange: true,
  });
  const ineff = (ineffData as any)?.manifoldPredictionInefficiency ?? 0;

  return (
    <div className={classes.root}>
      <div className={classes.titleRow}>
        <div>
          Predictions for {year}
          <LWTooltip title="Predicted ordering from Manifold probabilities. These markets are unresolved.">
            <span className={classes.manaNote}>&nbsp;• Predictions</span>
          </LWTooltip>
        </div>
        <LWTooltip title="Estimated M$ to move the average probability to 50 across all markets for this year, using market liquidity (CPMM approximation)">
          <div className={classes.manaNote}>Estimated Mana inefficiency: M${Math.round(ineff)}</div>
        </LWTooltip>
      </div>
      <ol className={classes.list}>
        {posts.map((p: any, i: number) => (
          <li key={p._id} className={classes.item}>
            <div className={classes.rank}>#{i + 1}</div>
            <div className={classes.title}>
              <Link to={"/posts/" + p._id}>{p.title}</Link>
              {p.user?.displayName ? <span> — {p.user.displayName}</span> : null}
            </div>
            <div className={classes.prob}>{p.annualReviewMarketProbability != null ? Math.round(p.annualReviewMarketProbability * 100) + '%' : '-'}</div>
            {p.annualReviewMarketUrl ? <a href={p.annualReviewMarketUrl} target="_blank" rel="noreferrer">Market</a> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}


