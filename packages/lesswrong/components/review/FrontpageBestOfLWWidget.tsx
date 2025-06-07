import React from 'react';
import { RecommendationsAlgorithm } from '../../lib/collections/users/recommendationSettings';
import { Link } from '../../lib/reactRouterWrapper';
import { ReviewYear, REVIEW_YEAR } from '../../lib/reviewUtils';
import { registerComponent } from '../../lib/vulcan-lib/components';
import SingleColumnSection, { SECTION_WIDTH } from '../common/SingleColumnSection';
import * as _ from 'underscore';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/crud/wrapGql";
import SectionTitle from "../common/SectionTitle";
import RecommendationsList from "../recommendations/RecommendationsList";
import PostsItem from "../posts/PostsItem";

const PostsListWithVotesQuery = gql(`
  query FrontpageBestOfLWWidget($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsListWithVotes
      }
    }
  }
`);

const styles = (theme: ThemeType) => ({
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

export const FrontpageBestOfLWWidget = ({classes, reviewYear}: {
  classes: ClassesType<typeof styles>,
  reviewYear: ReviewYear
}) => {
  const { data } = useQuery(PostsListWithVotesQuery, {
    variables: { documentId: "zajNa9fdr8JYJpxrG" },
  });
  const postVoting = data?.post?.result;
  
  return <div className={classes.root}>
    <Link className={classes.imageWrapper} to="/posts/zajNa9fdr8JYJpxrG/voting-results-for-the-2021-review"><img className={classes.image} src={"https://res.cloudinary.com/lesswrong-2-0/image/upload/v1644368355/enlarge_books-8_bk0yj6_eoige0_gpqvvr.webp"}/></Link>
    <SingleColumnSection>
      <div className={classes.title}><SectionTitle title={`Best of LessWrong ${reviewYear}`}>
      </SectionTitle></div>
      {postVoting && <PostsItem post={postVoting} translucentBackground forceSticky />}
      <RecommendationsList algorithm={recommendationsAlgorithm} translucentBackground/>
    </SingleColumnSection>
  </div>;
}

export default registerComponent('FrontpageBestOfLWWidget', FrontpageBestOfLWWidget, {
  styles,
  allowNonThemeColors: true, // Overlayed on an image
});



