// TODO: Import component in components.ts
import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { useMulti } from "../../lib/crud/withMulti";
import { SECTION_WIDTH } from '../common/SingleColumnSection';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { postBodyStyles } from '../../themes/stylePiping';
import { ContentBlock } from 'draft-js';

const styles = (theme: ThemeType) => ({
  root: {
    marginLeft: "auto",
    marginRight: "auto",
    maxWidth: SECTION_WIDTH,
  },
  postInfo: {
    position: "relative",
    zIndex: 1,
    background: "rgba(255,255,255,0.95)",
    padding: 1,
    borderRadius: 3,
    paddingLeft: 16,
    boxShadow: theme.palette.boxShadow,
    marginBottom: 16
  },
  body: {
    ...theme.typography.body2,
    lineHeight: 1.5,
    margin: "1rem 0 2rem",
  },
  title: {
    ...theme.typography.postStyle,
    fontSize: '1.8rem',
    textShadow: "0px 0px 30px rgba(255,255,255,1), 0px 0px 30px rgba(255,255,255,1), 0px 0px 30px rgba(255,255,255,1)",
    lineHeight: 1.2,
    fontVariant: 'small-caps'
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    right: "-10%",
    width: '70%',
    '-webkit-mask-image': `radial-gradient(ellipse at center top, ${theme.palette.text.alwaysBlack} 35%, transparent 70%)`,
  },
  contents: {
    ...postBodyStyles(theme),
    margin: "1rem 0",
  },
  metadata: {
    ...theme.typography.commentStyle,
    fontSize: "1.2rem",
    color: theme.palette.grey[600],
    lineHeight: 1.5,
    margin: "1rem 0",
  },
  bullet: {
    margin: "0 1rem",
  }
});

export const FullPageSpotlight = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  // const { UsersNameDisplay, ContentStyles, ContentItemBody } = Components
  // const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  // const {results} = useMulti({
  //     collectionName: "Spotlights",
  //     terms: {
  //         limit: 10,
  //     },
  //     fragmentName: "SpotlightMinimumInfo",
  // });
  // const reviewWinner = !!results?.length && results[1]
  // if (!reviewWinner || !reviewWinner.reviewWinnerArt || !reviewWinner.post) return null
  // const { post } = reviewWinner
  // const { splashArtImageUrl, splashArtImagePrompt } = reviewWinner.reviewWinnerArt

  // return <div className={classes.root}>
  //   <div className={classes.postInfo}>
  //     <h1 className={classes.title}><Link to={postGetPageUrl(reviewWinner.post)}>{reviewWinner.post.title}</Link></h1>
  //     <div className={classes.body}>{reviewWinner.post.customHighlight}</div>
  //     <ContentStyles contentType="comment">
  //       <ContentItemBody
  //         dangerouslySetInnerHTML={{__html: post?.contents?.htmlHighlight || ""}}
  //         description={`tag ${post?.title}`}
  //       />
  //     </ContentStyles>
  //     <div className={classes.metadata}>
  //       <span>
  //         by <UsersNameDisplay user={reviewWinner.post.user}/>
  //       </span>
  //       <span className={classes.bullet}>
  //         •
  //       </span>
  //       <span>
  //         <Link to="/leastwrong">Best of LessWrong {reviewWinner.reviewYear}</Link>
  //       </span>
  //     </div>
  //   </div>
  //   <img src={splashArtImageUrl} className={classes.backgroundImage} alt={splashArtImagePrompt} />
  // </div>;
  return null
}

const FullPageSpotlightComponent = registerComponent('FullPageSpotlight', FullPageSpotlight, {styles});

declare global {
  interface ComponentTypes {
    FullPageSpotlight: typeof FullPageSpotlightComponent
  }
}
