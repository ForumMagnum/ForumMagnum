import React, { ComponentType } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useRecommendations } from './withRecommendations';
import type { RecommendationsAlgorithm } from '../../lib/collections/users/recommendationSettings';
import { isFriendlyUI } from '../../themes/forumTheme';
import PostsLoading from "@/components/posts/PostsLoading";
import { Typography } from "@/components/common/Typography";
import PostsItem from "@/components/posts/PostsItem";

export type RecommendationsListItem = ComponentType<{
  post: PostsListWithVotes|PostsListWithVotesAndSequence,
  translucentBackground?: boolean,
}>;

const styles = (theme: ThemeType) => ({
  noMoreMessage: {
    fontFamily: isFriendlyUI ? theme.palette.fonts.sansSerifStack : undefined,
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
  loadingFallback?: JSX.Element,
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

const RecommendationsListComponent = registerComponent(
  'RecommendationsList',
  RecommendationsList,
  {styles, stylePriority: -1},
);

declare global {
  interface ComponentTypes {
    RecommendationsList: typeof RecommendationsListComponent
  }
}

export default RecommendationsListComponent;
