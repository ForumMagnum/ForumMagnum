import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import type { RecommendationRubric } from '../../lib/recommendationTypes';
import { useSingle } from '../../lib/crud/withSingle';

const styles = (theme: ThemeType): JssStyles => ({
  postsListItemWithRubrics: {
    display: "flex",
    width: 900,
  },
  postsItemWithRubric: {
    display: "inline-block",
    width: 600
  },
  compactRubricWrapper: {
    display: "inline-block",
  },
});

const RecommendationExperimentListItem = ({postId, rubric, overallScore, classes}: {
  postId: "string",
  rubric: RecommendationRubric,
  overallScore: number,
  classes: ClassesType,
}) => {
  const {document: post, loading} = useSingle({
    documentId: postId,
    collectionName: "Posts",
    fragmentName: "PostsList",
  });
  const { Loading, PostsItem2, RecommendationsRubric, RecentDiscussionThread } = Components;
  
  if (loading || !post) {
    return <Loading/>;
  }
  
  return <div className={classes.postsListItemWithRubrics}>
    <span className={classes.postsItemWithRubric}>
      <PostsItem2 post={post} hideTrailingButtons={true}/>
    </span>
    <span className={classes.compactRubricWrapper}>
      <RecommendationsRubric format="compact" rubric={rubric} overallScore={overallScore} />
    </span>
  </div>
}

const RecommendationExperimentFeedItem = ({postId, rubric, overallScore, classes}: {
  postId: "string",
  rubric: RecommendationRubric,
  overallScore: number,
  classes: ClassesType,
}) => {
  const {document: post, loading} = useSingle({
    documentId: postId,
    collectionName: "Posts",
    fragmentName: "PostsRecentDiscussion",
    extraVariables: {
      af: 'Boolean',
      commentsLimit: 'Int',
      maxAgeHours: 'Int',
    },
    extraVariablesValues: {
      af: false,
      commentsLimit: 4,
      maxAgeHours: 18, //TODO: given a current-date override, `maxAgeHours` won't work sensibly
    },
  });
  const { Loading, PostsItem2, RecommendationsRubric, RecentDiscussionThread } = Components;
  
  if (loading || !post) {
    return <Loading/>;
  }
  
  return <div>
    <RecentDiscussionThread
      post={post}
      comments={post.recentComments}
      refetch={()=>{}}
    />
    <RecommendationsRubric format="full" rubric={rubric} overallScore={overallScore} />
  </div>
}

const RecommendationExperimentListItemComponent = registerComponent("RecommendationExperimentListItem", RecommendationExperimentListItem, {styles});
const RecommendationExperimentFeedItemComponent = registerComponent("RecommendationExperimentFeedItem", RecommendationExperimentFeedItem, {styles});

declare global {
  interface ComponentTypes {
    RecommendationExperimentListItem: typeof RecommendationExperimentListItemComponent
    RecommendationExperimentFeedItem: typeof RecommendationExperimentFeedItemComponent
  }
}

