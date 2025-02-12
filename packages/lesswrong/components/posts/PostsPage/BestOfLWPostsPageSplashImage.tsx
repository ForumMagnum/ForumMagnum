// TODO: Import component in components.ts
import React, { useState } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import { useTracking } from '../../../lib/analyticsEvents';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("BestOfLWPostsPageSplashImage", (theme: ThemeType) => ({
  root: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100%',
    height: '100%',
    zIndex: -1,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  }
}));

export const BestOfLWPostsPageSplashImage = ({post}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision
}) => {
  console.log("post", post);
  const classes = useStyles(styles);
  const [backgroundImage, setBackgroundImage] = useState(post.reviewWinner?.reviewWinnerArt?.splashArtImageUrl);
  return <div className={classes.root}>
    <img src={backgroundImage} className={classes.backgroundImage} alt="Background Image" />
  </div>;
}

const BestOfLWPostsPageSplashImageComponent = registerComponent('BestOfLWPostsPageSplashImage', BestOfLWPostsPageSplashImage);

declare global {
  interface ComponentTypes {
    BestOfLWPostsPageSplashImage: typeof BestOfLWPostsPageSplashImageComponent
  }
}
