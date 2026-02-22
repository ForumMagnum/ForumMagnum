import React, { ComponentType } from 'react';
import type { RecommendationsAlgorithm } from '../../lib/collections/users/recommendationSettings';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { Typography } from "../common/Typography";
import PostsItem from "../posts/PostsItem";
import PostsLoading from "../posts/PostsLoading";
import { useRecommendations } from './withRecommendations';

export type RecommendationsListItem = ComponentType<{
  post: PostsListWithVotes|PostsListWithVotesAndSequence,
  translucentBackground?: boolean,
}>;

const styles = (theme: ThemeType) => ({
  noMoreMessage: {
},
});

const RecommendationsList = ({
  algorithm,
  translucentBackground,
  ListItem = PostsItem,
  loadingFallback,
  className,
  classes,
}: {
  algorithm: RecommendationsAlgorithm,
  translucentBackground?: boolean,
  ListItem?: RecommendationsListItem,
  loadingFallback?: React.JSX.Element,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
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

export default registerComponent(
  'RecommendationsList',
  RecommendationsList,
  {styles, stylePriority: -1},
);


