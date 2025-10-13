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
import Loading from 'app/loading';

const gridTemplateColumns = { gridTemplateColumns: '45px minmax(200px, 1fr)' };

const styles = defineStyles('PredictedTopPostsList', (theme: ThemeType) => ({
  root: {
    maxWidth: 765,
    margin: '0 auto',
    display: 'grid',
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
  intro: {
    marginLeft: 45,
    marginBottom: 45,
  },
  loading: {
    gridColumn: 2,
  }
}));

const ReviewPredictionPosts = gql(`
  query ReviewPredictionPosts($year: Int!, $limit: Int) {
    reviewPredictionPosts(year: $year, limit: $limit) {
      ...PostsListWithVotes
      annualReviewMarketProbability
      annualReviewMarketUrl
    }
  }
`);

const PredictionInefficiency = gql(`
  query PredictionInefficiency($year: Int!) {
    manifoldPredictionInefficiency(year: $year) {
      inefficiency
      totalPredicted
    }
  }
`);

const PredictedTop50Intro = ({ inefficiency, totalPredicted, loading }: { inefficiency: number, totalPredicted: number, loading: boolean }) => {
  const classes = useStyles(styles);
  const ineff = loading ? "..." : parseFloat(inefficiency.toPrecision(3)).toLocaleString('en-US', { maximumFractionDigits: 0 });
  const predictedCount = loading ? "..." : totalPredicted.toFixed(0);
  return (
    <ContentStyles contentType="post" className={classes.intro}>
      <p>
        The LessWrong Review highlights the posts most worth readers' time and attention.
        But its results take a while to appear.
        To bridge that gap, each popular post now has its own prediction market where users bet on whether it will rank among the year's top 50.
      </p>

      <p>
        Can we trust these markets?
        Here's a simple check: right now, they collectively predict that {predictedCount} posts will make the top 50 this year.
        {(!loading && inefficiency > 100) && (
          <> That means there's M${ineff} of free Mana (the platform's currency) for anyone who spots inconsistencies and brings the odds into line.</>
        )}
        <Link to="https://manifold.markets/topic/lesswrong-annual-review"> See the markets here.</Link>
      </p>
    </ContentStyles>
  );
};

const PostsList = ({ posts }: { posts: PostsListWithVotes[] }) => {
  const classes = useStyles(styles);
  return (
    <>
      {posts.map((p: PostsListWithVotes & { annualReviewMarketProbability: number, annualReviewMarketUrl?: string }, i: number) => (
        <React.Fragment key={p._id}>
          <LWTooltip title={`The Manifold prediction market predicts ${Math.round(p.annualReviewMarketProbability * 100)}% chance of being in the top 50 posts for this year.`}>
            {p.annualReviewMarketUrl ? (
              <Link to={p.annualReviewMarketUrl}>
                <div className={classes.prob}>{Math.round(p.annualReviewMarketProbability * 100)}%</div>
              </Link>
            ) : (
              <div className={classes.prob}>{Math.round(p.annualReviewMarketProbability * 100)}%</div>
            )}
          </LWTooltip>
          <PostsItem post={p} index={i} showKarma={true} showIcons={false} dense={true} showCommentsIcon={false} showPersonalIcon={false} />
        </React.Fragment>
      ))}
    </>
  );
};

export default function PredictedTopPostsList({ year }: { year: number }) {
  const classes = useStyles(styles);

  const { data, loading: postsLoading } = useQuery(ReviewPredictionPosts, {
    variables: { year, limit: 50 },
  });
  const posts = data?.reviewPredictionPosts ?? [];

  const { data: ineffData, loading: ineffLoading } = useQuery(PredictionInefficiency, {
    variables: { year },
  });
  const { inefficiency, totalPredicted } = ineffData?.manifoldPredictionInefficiency ?? { inefficiency: 0, totalPredicted: 0 };

  return (
    <div className={classes.root}>
      <PredictedTop50Intro inefficiency={inefficiency} totalPredicted={totalPredicted} loading={ineffLoading} />
      <div className={classes.predictedPostList}>
        {postsLoading ? <div className={classes.loading}><Loading /></div> : <PostsList posts={posts} />}
      </div>
    </div>
  );
}


