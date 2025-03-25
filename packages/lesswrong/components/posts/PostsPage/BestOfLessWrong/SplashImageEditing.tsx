import React, { useState, useRef, RefObject } from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useHover } from '@/components/common/withHover';
import { Coordinates } from './ImageCropPreview';
import { gql, useMutation } from '@apollo/client';

const styles = defineStyles("SplashImageEditing", (theme: ThemeType) => ({ 
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
    [theme.breakpoints.down('md')]: {
      display: 'none',
    },
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
  splashContent: {
    padding: 8,
    backgroundColor: theme.palette.background.paper,
  },
  controlButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  }
}));

const SplashImageEditing = ({ imgRef, imageFlipped, setImageFlipped, post }: { imgRef: RefObject<HTMLImageElement>, imageFlipped: boolean, setImageFlipped: (imageFlipped: boolean) => void, post: PostsWithNavigation|PostsWithNavigationAndRevision}) => {
  const classes = useStyles(styles);
  const { SplashHeaderImageOptions, ImageCropPreview, LWPopper } = Components;

  const { anchorEl, hover, eventHandlers } = useHover();

  const [flipMutation] = useMutation(gql`
    mutation flipSplashArtImage($reviewWinnerArtId: String!) {
      flipSplashArtImage(reviewWinnerArtId: $reviewWinnerArtId)
    }
  `); 

  const toggleImageFlip = async () => {
    setImageFlipped(!imageFlipped);
    await flipMutation({ variables: { reviewWinnerArtId: post.reviewWinner?.reviewWinnerArt?._id } }); 
  }

  return <div className={classes.rightSectionBelowBottomRow}>
    <div className={classes.controlButtons}>
      <div {...eventHandlers}>
        <div className={classes.changeImageBox}>Change image</div>
        <LWPopper open={hover} anchorEl={anchorEl} placement="bottom-start" clickable={true}>
          <div className={classes.splashContent}>
          <SplashHeaderImageOptions post={post}/>
        </div>
      </LWPopper>
      </div>
      <div className={classes.changeImageBox} onClick={toggleImageFlip}>Flip image</div>
    </div>
    <div className={classes.rightSectionBelowBottomRow}>
      <ImageCropPreview imgRef={imgRef} flipped={imageFlipped} />
    </div>
  </div>
}

const SplashImageEditingComponent = registerComponent('SplashImageEditing', SplashImageEditing);

declare global {
  interface ComponentTypes {
    SplashImageEditing: typeof SplashImageEditingComponent
  }
}

export default SplashImageEditing;
