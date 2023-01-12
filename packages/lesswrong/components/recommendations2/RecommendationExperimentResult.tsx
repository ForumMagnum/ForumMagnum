import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import type { RecommendationRubric } from '../../lib/recommendationTypes';
import { useSingle } from '../../lib/crud/withSingle';

const styles = (theme: ThemeType): JssStyles => ({
  postsListItemWithRubrics: {
    display: "flex",
    width: 765,
  },
  postsItemWithRubric: {
    display: "inline-block",
    width: 600
  },
  compactRubricWrapper: {
    display: "inline-block",
  },
});

const RecommendationExperimentResult = ({displayStyle, postId, rubric, overallScore, classes}: {
  displayStyle: "list"|"feed",
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
  const { Loading, PostsItem2, RecommendationsRubric } = Components;
  
  if (loading || !post) {
    return <Loading/>;
  }
  
  if (displayStyle === "list") {
    return <div className={classes.postsListItemWithRubrics}>
      <span className={classes.postsItemWithRubric}>
        <PostsItem2 post={post} hideTrailingButtons={true}/>
      </span>
      <span className={classes.compactRubricWrapper}>
        <RecommendationsRubric format="compact" rubric={rubric} overallScore={overallScore} />
      </span>
    </div>
  } else {
    return <div>
      <PostsItem2 post={post}/> {/*TODO*/}
      <RecommendationsRubric format="full" rubric={rubric} overallScore={overallScore} />
    </div>
  }
}

const RecommendationExperimentResultComponent = registerComponent("RecommendationExperimentResult", RecommendationExperimentResult, {styles});

declare global {
  interface ComponentTypes {
    RecommendationExperimentResult: typeof RecommendationExperimentResultComponent
  }
}

