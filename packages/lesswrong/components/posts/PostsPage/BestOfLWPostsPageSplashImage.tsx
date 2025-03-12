// TODO: Import component in components.ts
import React, { useState } from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { useTracking } from '@/lib/analyticsEvents';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("BestOfLWPostsPageSplashImage", (theme: ThemeType) => ({
  root: {
  },
  backgroundImage: {
    width: '100vw',
    objectFit: 'cover',
    position: 'relative'
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100vw',
    height: '120%',
    background: 'linear-gradient(180deg,rgba(255,255,255,.87) 64px,transparent 40%,transparent 48%,#fff 97%)',
    pointerEvents: 'none',
  },
  diagonalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100vw',
    height: '120%',
    background: 'linear-gradient(to bottom left, transparent 0%, white 85%)',
    pointerEvents: 'none',
  }
}));

export const BestOfLWPostsPageSplashImage = ({post}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision
}) => {
  const classes = useStyles(styles);
  const [backgroundImage, setBackgroundImage] = useState(post.reviewWinner?.reviewWinnerArt?.splashArtImageUrl);
  return <div className={classes.root}>
    <img src={backgroundImage} className={classes.backgroundImage} alt="Background Image" />
    <div className={classes.overlay} />
    <div className={classes.diagonalOverlay} />
  </div>
}

const BestOfLWPostsPageSplashImageComponent = registerComponent('BestOfLWPostsPageSplashImage', BestOfLWPostsPageSplashImage);

declare global {
  interface ComponentTypes {
    BestOfLWPostsPageSplashImage: typeof BestOfLWPostsPageSplashImageComponent
  }
}
