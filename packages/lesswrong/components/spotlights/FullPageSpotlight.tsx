// TODO: Import component in components.ts
import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { useMulti } from "../../lib/crud/withMulti";
import { SECTION_WIDTH } from '../common/SingleColumnSection';

const styles = (theme: ThemeType) => ({
  root: {
    
  },
  postInfo: {
    marginLeft: "auto",
    marginRight: "auto",
    maxWidth: SECTION_WIDTH,
    position: "relative",
    zIndex: 1
  },
  body: {
    ...theme.typography.body2,
    lineHeight: 1.5,
    margin: "1rem 0 2rem",
  },
  title: {
    ...theme.typography.postStyle,
    fontSize: '2.5rem',
    textShadow: "0px 0px 30px rgba(255,255,255,1), 0px 0px 30px rgba(255,255,255,1), 0px 0px 30px rgba(255,255,255,1)",
    lineHeight: 1.2,
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    right: "-10%",
    width: '70%',
    '-webkit-mask-image': `radial-gradient(ellipse at center top, ${theme.palette.text.alwaysBlack} 35%, transparent 70%)`,
  },
  metadata: {
    ...theme.typography.commentStyles,
    fontSize: "1.2rem",
    color: theme.palette.grey[600],
    lineHeight: 1.5,
    margin: "1rem 0 2rem",
  }
});

export const FullPageSpotlight = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { UsersNameDisplay } = Components
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const {results} = useMulti({
      collectionName: "ReviewWinners",
      terms: {
          limit: 10,
      },
      fragmentName: "ReviewWinnerSpotlight",
  });
  const reviewWinner = !!results?.length && results[1]
  if (!reviewWinner || !reviewWinner.reviewWinnerArt || !reviewWinner.post) return null
  const { splashArtImageUrl, splashArtImagePrompt } = reviewWinner.reviewWinnerArt

  return <div className={classes.root}>
    <div className={classes.postInfo}>
      <h1 className={classes.title}>{reviewWinner.post.title}</h1>
      <div className={classes.body}>{reviewWinner.post.customHighlight}</div>
      <div className={classes.metadata}>
        by <UsersNameDisplay user={reviewWinner.post.user}/>
        •
        Best of LessWrong
      </div>
    </div>
    <img src={splashArtImageUrl} className={classes.backgroundImage} alt={splashArtImagePrompt} />
  </div>;
}

const FullPageSpotlightComponent = registerComponent('FullPageSpotlight', FullPageSpotlight, {styles});

declare global {
  interface ComponentTypes {
    FullPageSpotlight: typeof FullPageSpotlightComponent
  }
}
