import React, { useState, useRef, useEffect } from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions';
import { useCurrentUser } from '@/components/common/withUser';
import { ImageProvider, useImageContext } from '../ImageContext';
import SplashImageEditing from './SplashImageEditing';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("BestOfLWPostsPageSplashImage", (theme: ThemeType) => ({
  root: {
    position: 'relative',
  },
  backgroundImageWrapper: {
    position: 'fixed',
    width: 'calc(100vw + 100px)',
    top: -100,
    right: -100,
    [theme.breakpoints.down('xs')]: {
      top: -175,
      right: -100,
    },
  },
  backgroundImage: {
    position: 'absolute',
    objectFit: 'cover',
    objectPosition: 'right',
    top: 0,
    right: 0,
    height: "100vh",
    width: "100vw",
    [theme.breakpoints.down('xs')]: {
      objectPosition: 'center',
      width: '200vw',
    },
  },
  overlayY: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100vw',
    height: '100vh',
    background: `linear-gradient(180deg, ${theme.palette.panelBackground.default} 0px, ${theme.palette.panelBackground.translucent} 165px,  transparent 45%, ${theme.palette.panelBackground.default} 87%)`,
    pointerEvents: 'none',
    bottom: 0,
    left: 'auto',
    [theme.breakpoints.up('lg')]: {
      width: '100vw',
    },
  },
  overlayX: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100vw',
    height: '100vh',
    background: `linear-gradient(-90deg, transparent 48%, ${theme.palette.panelBackground.default} 95%)`,
    pointerEvents: 'none',
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    }
  },
  overlayDiag: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100vw',
    height: '100vh',
    background: `linear-gradient(225deg, transparent 48%, ${theme.palette.panelBackground.default} 95%)`,
    pointerEvents: 'none', 
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    }
  }
}));

export const BestOfLWPostsPageSplashImage = ({post}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision
}) => {
  const classes = useStyles(styles);
  const { selectedImageInfo, setImageInfo } = useImageContext();
  const [backgroundImage, setBackgroundImage] = useState(selectedImageInfo?.splashArtImageUrl || post.reviewWinner?.reviewWinnerArt?.splashArtImageUrl);

  const [imageFlipped, setImageFlipped] = useState(false);
  const [opacity, setOpacity] = useState(1);
  
  const currentUser = useCurrentUser();
  
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const postLastSavedImage = post.reviewWinner?.reviewWinnerArt?.splashArtImageUrl;
    const newBackgroundImage = selectedImageInfo?.splashArtImageUrl || postLastSavedImage;

    if (newBackgroundImage) {
      setBackgroundImage(newBackgroundImage.replace('upload/', imageFlipped ? 'upload/a_hflip/' : 'upload/'));
    }
  }, [post, selectedImageInfo, imageFlipped]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      // Start fading at 100px scroll, complete fade by 400px
      const newOpacity = Math.max(0, 1 - ((scrollPosition - 100) / 400));
      setOpacity(newOpacity);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return <ImageProvider>
    <div className={classes.root}>
      <div className={classes.backgroundImageWrapper} style={{opacity}}>
        <img ref={imgRef} src={backgroundImage} className={classes.backgroundImage} alt="Background Image" /> 
        <div className={classes.overlayY} />
        <div className={classes.overlayX} />
        <div className={classes.overlayDiag} />
    </div>
      {userIsAdminOrMod(currentUser) && <SplashImageEditing imgRef={imgRef} imageFlipped={imageFlipped} setImageFlipped={setImageFlipped} post={post} />}
    </div>
  </ImageProvider>
}

const BestOfLWPostsPageSplashImageComponent = registerComponent('BestOfLWPostsPageSplashImage', BestOfLWPostsPageSplashImage);

declare global {
  interface ComponentTypes {
    BestOfLWPostsPageSplashImage: typeof BestOfLWPostsPageSplashImageComponent
  }
}
