import React, { ComponentType } from 'react';
import { useRecommendations } from './withRecommendations';
import type { RecommendationsAlgorithm } from '../../lib/collections/users/recommendationSettings';
import PostsItem from "../posts/PostsItem";
import PostsLoading from "../posts/PostsLoading";
import { Typography } from "../common/Typography";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

export type RecommendationsListItem = ComponentType<{
  post: PostsListWithVotes|PostsListWithVotesAndSequence,
  translucentBackground?: boolean,
}>;

const styles = defineStyles('RecommendationsList', (theme: ThemeType) => ({
  noMoreMessage: {
  },
}), { stylePriority: -1 });

const RecommendationsList = ({algorithm, translucentBackground, ListItem = PostsItem, loadingFallback, className}: {
  algorithm: RecommendationsAlgorithm,
  translucentBackground?: boolean,
  ListItem?: RecommendationsListItem,
  loadingFallback?: React.JSX.Element,
  className?: string,
}) => {
  const classes = useStyles(styles);
  const {recommendationsLoading, recommendations} = useRecommendations({ algorithm });

  if (recommendationsLoading || !recommendations)
    return loadingFallback ?? <PostsLoading/>;

  return <div className={className}>
    {recommendations.map(post =>
      <ListItem
        key={post._id}
        post={post}
        translucentBackground={translucentBackground}
      />
    )}
    {recommendations.length === 0 &&
      <Typography variant="body1" className={classes.noMoreMessage}>
        <small>There are no more recommendations left.</small>
      </Typography>
    }
  </div>
}

export default RecommendationsList;


