// TODO: Import component in components.ts
import React, { useState, useRef, useEffect } from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { useTracking } from '@/lib/analyticsEvents';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { SplashHeaderImageOptions } from './SplashHeaderImageOptions';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions';
import { useCurrentUser } from '@/components/common/withUser';
import { useHover } from '@/components/common/withHover';
import { useImageContext } from './ImageContext';
import { Coordinates } from './ImageCropPreview';

const styles = defineStyles("BestOfLWPostsPageSplashImage", (theme: ThemeType) => ({
  root: {
    position: 'relative',
  },
  backgroundImageWrapper: {
    position: 'fixed',
    width: '100vw',
    top: 0,
    [theme.breakpoints.up('sm')]: {
      top: 0
    },
    right: -300
  },
  backgroundImage: {
    position: 'absolute',
    objectFit: 'cover',
    top: 0,
    right: 0,

    [theme.breakpoints.up('sm')]: {
      height: "100vh"
    },
    [theme.breakpoints.up('lg')]: {
      width: '70%',
      height: 'unset'
    }
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    // background: 'red',
    background: 'linear-gradient(180deg, transparent 48%,#fff 87%)',
    [theme.breakpoints.up('sm')]: {
      background: 'linear-gradient(180deg,rgba(255,255,255,.87) 100px,transparent 25%, transparent 48%,#fff 87%)',
    },
    [theme.breakpoints.up('lg')]: {
      background: 'linear-gradient(180deg,rgba(255,255,255,.87) 100px,transparent 35%, transparent 48%,#fff 87%)',
    },
    pointerEvents: 'none',
  },
  // overlay2: {
  //   position: 'absolute',
  //   top: 0,
  //   left: 0,
  //   width: '100vw',
  //   height: '100vh',
  //   background: 'linear-gradient(180deg, transparent 48%,#fff 87%)',
  // },
  diagonalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'radial-gradient(circle at 100% 0%, transparent 50%, white 85%)',
    pointerEvents: 'none',
  },
  rightSectionBelowBottomRow: {
    position: 'absolute',
    top: 200,
    right: 25,
    display: 'flex',
    flexDirection: 'row-reverse',
    paddingLeft: 8,
    paddingRight: 8,
    paddingBottom: 8,
    zIndex: 2,
  },
  changeImageBox: {
    ...theme.typography.commentStyle,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '8px',
    borderRadius: '4px',
    backgroundColor: theme.palette.panelBackground.reviewGold,
    color: theme.palette.text.alwaysWhite,
    cursor: 'pointer',
    marginBottom: 8,
    opacity: 0.3,
    '&:hover': {
      opacity: 1
    }
  },
  
}));

export const BestOfLWPostsPageSplashImage = ({post}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision
}) => {
  const classes = useStyles(styles);
  const { SplashHeaderImageOptions, ImageCropPreview, LWPopper } = Components;
  const imageContext = useImageContext();

  const { selectedImageInfo } = imageContext;
  const [backgroundImage, setBackgroundImage] = useState(post.reviewWinner?.reviewWinnerArt?.splashArtImageUrl);
  const [cropPreviewEnabled, setCropPreviewEnabled] = useState(false);
  const [imageFlipped, setImageFlipped] = useState(false);
  const [opacity, setOpacity] = useState(1);
  
  const currentUser = useCurrentUser();
  const { anchorEl, hover, eventHandlers } = useHover();
  
  const imgRef = useRef<HTMLImageElement>(null);
  const backgroundImgWrapperRef = useRef<HTMLDivElement>(null);
  const backgroundImgCropPreviewRef = useRef<HTMLDivElement>(null);

  const toggleImageFlip = () => setImageFlipped(!imageFlipped);

  const setCropPreview = (coordinates?: Coordinates) => {
    if (imgRef.current && backgroundImgWrapperRef.current && backgroundImgCropPreviewRef.current) {
      if (coordinates) {
        const updatedMask = `
          linear-gradient(#000 0 0) ${coordinates.x}px ${coordinates.y}px/${coordinates.width}px ${coordinates.height}px,
          linear-gradient(rgba(0,0,0,0.4) 0 0)
        `;
        imgRef.current.style.mask = `${updatedMask} no-repeat`;
        imgRef.current.style.webkitMask = updatedMask;
        imgRef.current.style.webkitMaskRepeat = 'no-repeat';

        setCropPreviewEnabled(true);
      } else {
        imgRef.current.style.mask = '';
        imgRef.current.style.webkitMask = '';
        imgRef.current.style.webkitMaskRepeat = '';

        setCropPreviewEnabled(false);
      }
    }
  };

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

  const imagePreviewAndCrop = (
    <div className={classes.rightSectionBelowBottomRow}>
      <div {...eventHandlers}>
        <div className={classes.changeImageBox}>Change image</div>
        <div className={classes.changeImageBox} onClick={toggleImageFlip}>Flip image</div>
        <LWPopper open={hover} anchorEl={anchorEl} placement="bottom-start" clickable={true}>
          <div>
            <SplashHeaderImageOptions post={post} />
          </div>
        </LWPopper>
      </div>
      <div className={classes.rightSectionBelowBottomRow}>
        <ImageCropPreview imgRef={imgRef} setCropPreview={setCropPreview} flipped={imageFlipped} />
      </div>
    </div>
  );

  return <div className={classes.root}>
    {/* <div ref={backgroundImgWrapperRef}>
      <img src={backgroundImage} className={classes.backgroundImage} alt="Background Image" />
    </div> */}
    <div className={classes.backgroundImageWrapper} style={{opacity}}>
      <img ref={imgRef} src={backgroundImage} className={classes.backgroundImage} alt="Background Image" />
      <div className={classes.overlay} />
      <div className={classes.diagonalOverlay} />
    </div>
    {userIsAdminOrMod(currentUser) && imagePreviewAndCrop}
  </div>
}

const BestOfLWPostsPageSplashImageComponent = registerComponent('BestOfLWPostsPageSplashImage', BestOfLWPostsPageSplashImage);

declare global {
  interface ComponentTypes {
    BestOfLWPostsPageSplashImage: typeof BestOfLWPostsPageSplashImageComponent
  }
}
