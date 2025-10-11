"use client";

import React from 'react';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import LWTooltip from '@/components/common/LWTooltip';
import { Link } from '@/lib/reactRouterWrapper';
import PostsItem from '../posts/PostsItem';
import ContentStyles from '../common/ContentStyles';

const gridTemplateColumns = { gridTemplateColumns: '45px minmax(200px, 1fr)' };

const styles = defineStyles('PredictedTopPostsList', (theme: ThemeType) => ({
  root: {
    maxWidth: 765,
    margin: '0 auto',
    display: 'grid',
  },
  titleRow: {
    display: 'grid',
    ...gridTemplateColumns,
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
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
    marginRight: 16,
    width: 28,
    textAlign: 'right',
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[500],
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    },
  },
  predictedPostList: {
    display: 'grid',
    width: '100%',
    alignItems: 'center',
    ...gridTemplateColumns,
    ...theme.typography.body2,
  },
  manaNote: {
    marginLeft: 45,
    marginBottom: 30,
  }
}));

const REVIEW_PREDICTION_POSTS = gql(`
  query ReviewPredictionPosts($year: Int!, $limit: Int) {
    reviewPredictionPosts(year: $year, limit: $limit) {
      ...PostsListWithVotes
      annualReviewMarketProbability
      annualReviewMarketUrl
    }
  }
`);

const PREDICTION_INEFFICIENCY = gql(`
  query PredictionInefficiency($year: Int!) {
    manifoldPredictionInefficiency(year: $year) {
      inefficiency
      totalPredicted
    }
  }
`);

const PredictedTop50Intro = ({ inefficiency, totalPredicted }: { inefficiency: number, totalPredicted: number }) => {
  const classes = useStyles(styles);
  const ineff = parseFloat(inefficiency.toPrecision(3)).toLocaleString('en-US', { maximumFractionDigits: 0 });
  return (
    <ContentStyles contentType="post" className={classes.manaNote}>
      <p>The LessWrong Review helps find the posts that are most worthy of readers' time & attention. But there's a problem: we've not yet done it for more recent posts. To find the best posts of recent years, there's a prediction market for every popular post, which predicts whether it will be in the top 50 posts for its year. Here you can see the 50 posts that the market participants judge to be most likely to make it.</p>
      <p>A natural question to ask is: how much should we trust the predictions of these markets? Here's some evidence: the markets currently predict that {totalPredicted.toFixed(0)} posts will be in the top 50 posts for this year. This means there's free Mana (the prediction market platform's currency) just in making the markets more consistent: <Link to="https://manifold.markets/topic/lesswrong-annual-review">there's about M${ineff} of free Mana waiting</Link>.</p>
    </ContentStyles>
  );
};

export default function PredictedTopPostsList({ year }: { year: number }) {
  const classes = useStyles(styles);

  const { data } = useQuery(REVIEW_PREDICTION_POSTS, {
    variables: { year, limit: 50 },
    notifyOnNetworkStatusChange: true,
  });
  const posts = data?.reviewPredictionPosts ?? [];

  const { data: ineffData } = useQuery(PREDICTION_INEFFICIENCY, {
    variables: { year },
    notifyOnNetworkStatusChange: true,
  });
  const { inefficiency, totalPredicted } = ineffData?.manifoldPredictionInefficiency ?? { inefficiency: 0, totalPredicted: 0 };

  return (
    <div className={classes.root}>
      <PredictedTop50Intro inefficiency={inefficiency} totalPredicted={totalPredicted} />
      <div className={classes.predictedPostList}>
        {posts.map((p: PostsListWithVotes & { annualReviewMarketProbability: number }, i: number) => (
          <>
            <LWTooltip title={`The Manifold prediction market predicts ${Math.round(p.annualReviewMarketProbability*100)}% chance of being in the top 50 posts for this year.`}>
              <div className={classes.prob}>{Math.round(p.annualReviewMarketProbability*100)}%</div>
            </LWTooltip>
            <PostsItem post={p} index={i} showKarma={true} showIcons={false} dense={true} showCommentsIcon={false} showPersonalIcon={false} />
          </>
        ))}
      </div>
    </div>
  );
}


