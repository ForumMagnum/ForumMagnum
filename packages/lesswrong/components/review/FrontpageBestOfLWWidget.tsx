

import React from 'react';
import { RecommendationsAlgorithm } from '../../lib/collections/users/recommendationSettings';
import { useSingle } from '../../lib/crud/withSingle';
import { REVIEW_YEAR } from '../../lib/reviewUtils';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { SECTION_WIDTH } from '../common/SingleColumnSection';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    position: "relative",
    zIndex: theme.zIndexes.frontpageSplashImage,
    maxWidth: SECTION_WIDTH,
    margin: "auto",
    marginTop: 200,
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
    }
  },
  title: {
    // This is how much text-shadow you need in order to have the black text reliably show up against complex dark backgrounds
    textShadow: "0 0 35px rgb(250 255 250), 0 0 35px rgb(250 255 250), 0 0 35px rgb(250 255 250), 0 0 35px rgb(250 255 250), 0 0 35px rgb(250 255 250), 0 0 35px rgb(250 255 250), 0 0 35px rgb(250 255 250), 0 0 35px rgb(250 255 250), 0 0 35px rgb(250 255 250), 0 0 35px rgb(250 255 250), 0 0 35px rgb(250 255 250), 0 0 35px rgb(250 255 250), 0 0 35px rgb(250 255 250), 0 0 35px rgb(250 255 250), 0 0 35px rgb(250 255 250), 0 0 35px rgb(250 255 250)"
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
  const { SectionTitle, RecommendationsList, SingleColumnSection, PostsItem2 } = Components

  const { document: post } = useSingle({
    documentId: "TSaJ9Zcvc3KWh3bjX",
    collectionName: "Posts",
    fragmentName: "PostsList"
  });
  
  return <div className={classes.root}>
    <img className={classes.image} src={"https://res.cloudinary.com/lesswrong-2-0/image/upload/v1644368355/enlarge_books-8_bk0yj6_eoige0_gpqvvr.webp"}/>
    <SingleColumnSection>
      <div className={classes.title}><SectionTitle title="Best of LessWrong 2020">

      </SectionTitle></div>
      {post && <PostsItem2 post={post} translucentBackground forceSticky />}
      <RecommendationsList algorithm={recommendationsAlgorithm} translucentBackground/>

    </SingleColumnSection>
  </div>;
}

const FrontpageBestOfLWWidgetComponent = registerComponent('FrontpageBestOfLWWidget', FrontpageBestOfLWWidget, {styles});

declare global {
  interface ComponentTypes {
    FrontpageBestOfLWWidget: typeof FrontpageBestOfLWWidgetComponent
  }
}

