

import React from 'react';
import { RecommendationsAlgorithm } from '../../lib/collections/users/recommendationSettings';
import { useSingle } from '../../lib/crud/withSingle';
import { annualReviewVotingResultsPostPath } from '../../lib/publicSettings';
import { Link } from '../../lib/reactRouterWrapper';
import { REVIEW_YEAR } from '../../lib/reviewUtils';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { SECTION_WIDTH } from '../common/SingleColumnSection';
import { getReviewAlgorithm } from './FrontpageReviewWidget';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    position: "relative",
    zIndex: theme.zIndexes.frontpageSplashImage,
    width: SECTION_WIDTH,
    margin: "auto",
    marginTop: 200,
    marginBottom:40
  },
  image: {
    position: "absolute",
    zIndex: theme.zIndexes.frontpageSplashImage,
    left: "50%",
    top: -245,
    width: "115%",
    transform: "translate(-50%, 0)"
  },
  title: {
    textShadow: "0 0 50px rgb(250 255 250), 0 0 50px rgb(250 255 250), 0 0 50px rgb(250 255 250), 0 0 50px rgb(250 255 250)"
  },
  viewResultsCTA: {
    background: "white",
    padding: 8,
    paddingLeft: 16,
    paddingRight: 16,
    color: theme.palette.primary.main,
    textTransform: "uppercase",
    border: `solid 1px ${theme.palette.primary.main}`,
    borderRadius: 3
  }
});

export const recommendationsAlgorithm: RecommendationsAlgorithm = {
  method: 'sample',
  count: 2,
  scoreOffset: 0,
  scoreExponent: 0,
  personalBlogpostModifier: 0,
  frontpageModifier: 0,
  curatedModifier: 0,
  includePersonal: true,
  includeMeta: true,
  reviewFinal: REVIEW_YEAR,
  onlyUnread: false,
  excludeDefaultRecommendations: true
}

export const FrontpageBestOfLWWidget = ({classes}: {
  classes: ClassesType,
}) => {
  const { SectionTitle, RecommendationsList, SingleColumnSection, PostsItem2, RecommendationsPersonal } = Components

  const { document: post } = useSingle({
    documentId: "TSaJ9Zcvc3KWh3bjX",
    collectionName: "Posts",
    fragmentName: "PostsList"
  });
  
  return <div className={classes.root}>
    <img className={classes.image} src={"https://res.cloudinary.com/lesswrong-2-0/image/upload/v1644205079/books-4_ayvfhd.png"}/>
    <SingleColumnSection>
      <div className={classes.title}><SectionTitle title="Best of LessWrong 2020">

      </SectionTitle></div>
      {post && <PostsItem2 post={post} translucentBackground />}
      <RecommendationsList algorithm={recommendationsAlgorithm} translucentBackground/>

      <RecommendationsPersonal />

    </SingleColumnSection>
  </div>;
}

const FrontpageBestOfLWWidgetComponent = registerComponent('FrontpageBestOfLWWidget', FrontpageBestOfLWWidget, {styles});

declare global {
  interface ComponentTypes {
    FrontpageBestOfLWWidget: typeof FrontpageBestOfLWWidgetComponent
  }
}

