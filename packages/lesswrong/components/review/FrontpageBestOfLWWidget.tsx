import React from 'react';
import { RecommendationsAlgorithm } from '../../lib/collections/users/recommendationSettings';
import { useSingle } from '../../lib/crud/withSingle';
import { Link } from '../../lib/reactRouterWrapper';
import { ReviewYear, REVIEW_YEAR } from '../../lib/reviewUtils';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { SECTION_WIDTH } from '../common/SingleColumnSection';
import * as _ from 'underscore';

const styles = (theme: ThemeType) => ({
  root: {
    position: "relative",
    zIndex: theme.zIndexes.frontpageSplashImage,
    maxWidth: SECTION_WIDTH,
    margin: "auto",
    marginBottom:20
  },
  image: {
    position: "absolute",
    zIndex: theme.zIndexes.frontpageSplashImage,
    left: "50%",
    top: -245,
    maxWidth: "115%",
    transform: "translate(-50%, 0)",
    [theme.breakpoints.down('sm')]: {
      top: -145,
      width: "100%"
    },
  },
  imageWrapper: {
    '&:hover': {
      opacity: "1 !important"
    }
  },
  title: {
    // This is how much text-shadow you need in order to have the black text reliably show up against complex dark backgrounds
    textShadow: _.times(16, i=>"0 0 35px rgb(250 255 250)").join(", ")
  },
  viewResultsCTA: {
    background: theme.palette.panelBackground.default,
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

export const FrontpageBestOfLWWidget = ({classes, reviewYear}: {
  classes: ClassesType<typeof styles>,
  reviewYear: ReviewYear
}) => {
  const { SectionTitle, RecommendationsList, SingleColumnSection, PostsItem } = Components

  const { document: postVoting } = useSingle({
    documentId: "zajNa9fdr8JYJpxrG",
    collectionName: "Posts",
    fragmentName: "PostsListWithVotes",
  });
  
  return <div className={classes.root}>
    <SingleColumnSection>
      <div className={classes.title}><SectionTitle title={`${reviewYear} LessWrong Review: Results`}>
      </SectionTitle></div>
      {/* {postVoting && <PostsItem post={postVoting} translucentBackground forceSticky />} */}
      <RecommendationsList algorithm={recommendationsAlgorithm} translucentBackground/>
    </SingleColumnSection>
  </div>;
}

const FrontpageBestOfLWWidgetComponent = registerComponent('FrontpageBestOfLWWidget', FrontpageBestOfLWWidget, {
  styles,
  allowNonThemeColors: true, // Overlayed on an image
});

declare global {
  interface ComponentTypes {
    FrontpageBestOfLWWidget: typeof FrontpageBestOfLWWidgetComponent
  }
}

