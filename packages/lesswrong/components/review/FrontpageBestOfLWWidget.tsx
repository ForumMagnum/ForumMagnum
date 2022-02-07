

import React from 'react';
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
    opacity: .7,
    width: "115%",
    transform: "translate(-50%, 0)"
  },
});

export const recommendationsAlgorithm = {
  method: "sample",
  count: 3,
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
  const { SectionTitle, RecommendationsList, SingleColumnSection } = Components
  return <div className={classes.root}>
    <img className={classes.image} src={"https://res.cloudinary.com/lesswrong-2-0/image/upload/v1644137659/books-and-gems-white-2_d9waeq.png"}/>
    <SingleColumnSection>
      <SectionTitle title="Best of LessWrong 2020"/>
      >
      <RecommendationsList algorithm={getReviewAlgorithm()} translucentBackground/>
    </SingleColumnSection>
  </div>;
}

const FrontpageBestOfLWWidgetComponent = registerComponent('FrontpageBestOfLWWidget', FrontpageBestOfLWWidget, {styles});

declare global {
  interface ComponentTypes {
    FrontpageBestOfLWWidget: typeof FrontpageBestOfLWWidgetComponent
  }
}

