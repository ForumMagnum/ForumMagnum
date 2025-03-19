import React, { useState, useRef, useEffect } from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions';
import { useCurrentUser } from '@/components/common/withUser';
import { useImageContext } from '../ImageContext';
import { ImagePreviewAndCrop } from './ImagePreviewAndCrop';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const widescreenImagesStyles = (theme: ThemeType) => ({
  backgroundImageWrapper: {
    position: 'fixed',
    width: '100vw',
    top: -100,
    [theme.breakpoints.down('xs')]: {
      top: -108
    },
  },
  backgroundImageWrapperInner: {
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    objectFit: 'cover',
    top: 0,
    right: 0,
    height: "100vh",
    width: "100vw",
  },
  overlayY: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100vw',
    height: '100vh',
    background: 'linear-gradient(180deg, #ffffff 164px, rgba(255,255,255,.8) 165px,  transparent 40%, #fff 87%)',
    pointerEvents: 'none',
    bottom: 0,
    left: 'auto',
    [theme.breakpoints.up('lg')]: {
      width: '100vw',
    }
  },
  overlayX: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100vw',
    height: '100vh',
    background: 'linear-gradient(-90deg, transparent 48%,#fff 95%)',
    pointerEvents: 'none',
  },
})

const styles = defineStyles("BestOfLWPostsPageSplashImage", (theme: ThemeType) => ({
  root: {
    position: 'relative',
  },
  ...widescreenImagesStyles(theme),
}));

export const BestOfLWPostsPageSplashImage = ({post}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision
}) => {
  const classes = useStyles(styles);
  const { selectedImageInfo } = useImageContext();

  const [backgroundImage, setBackgroundImage] = useState(post.reviewWinner?.reviewWinnerArt?.splashArtImageUrl);

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

  return <div className={classes.root}>
    <div className={classes.backgroundImageWrapper} style={{opacity}}>
      <div className={classes.backgroundImageWrapperInner}>
        <img ref={imgRef} src={backgroundImage} className={classes.backgroundImage} alt="Background Image" /> 
        <div className={classes.overlayY} />
        <div className={classes.overlayX} />
      </div>
    </div>
    {userIsAdminOrMod(currentUser) && <ImagePreviewAndCrop imgRef={imgRef} imageFlipped={imageFlipped} setImageFlipped={setImageFlipped} post={post} />}
  </div>
}

const BestOfLWPostsPageSplashImageComponent = registerComponent('BestOfLWPostsPageSplashImage', BestOfLWPostsPageSplashImage);

declare global {
  interface ComponentTypes {
    BestOfLWPostsPageSplashImage: typeof BestOfLWPostsPageSplashImageComponent
  }
}
