import React, { RefObject } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useHover } from '@/components/common/withHover';
import { useMutation } from "@apollo/client/react";
import { gql } from '@/lib/generated/gql-codegen';
import SplashImageEditingOptions from "./SplashImageEditingOptions";
import ImageCropPreview from "./ImageCropPreview";
import LWPopper from "../../../common/LWPopper";

const styles = defineStyles("SplashImageEditing", (theme: ThemeType) => ({ 
  root: {
    position: 'absolute',
    top: 200,
    right: 25,
    display: 'flex',
    flexDirection: 'column',
    paddingLeft: 8,
    paddingRight: 8,
    paddingBottom: 8,
    zIndex: 2,
    opacity: 0,
    gap: '8px',
    '&:hover': {
      opacity: 1
    },
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
  },
  splashContent: {
    padding: 8,
    minHeight: '50vh',
    minWidth: '100vw',
    backgroundColor: theme.palette.background.paper,
  },
}));

const SplashImageEditing = ({ imgRef, imageFlipped, setImageFlipped, post }: { imgRef: RefObject<HTMLImageElement|null>, imageFlipped: boolean, setImageFlipped: (imageFlipped: boolean) => void, post: PostsWithNavigation|PostsWithNavigationAndRevision}) => {
  const classes = useStyles(styles);
  const { anchorEl, hover, eventHandlers } = useHover();

  const [flipMutation] = useMutation(gql(`
    mutation flipSplashArtImage($reviewWinnerArtId: String!) {
      flipSplashArtImage(reviewWinnerArtId: $reviewWinnerArtId)
    }
  `)); 

  const toggleImageFlip = async () => {
    if (!post.reviewWinner?.reviewWinnerArt?._id) {
      return;
    }
    
    setImageFlipped(!imageFlipped);
    await flipMutation({ variables: { reviewWinnerArtId: post.reviewWinner.reviewWinnerArt._id } }); 
  }

  return <div className={classes.root}>
    <div className={classes.changeImageBox} onClick={toggleImageFlip}>Flip image</div>
    <ImageCropPreview imgRef={imgRef} flipped={imageFlipped} />
    <div {...eventHandlers}>
      <div className={classes.changeImageBox}>Change image</div>
      <LWPopper open={hover} anchorEl={anchorEl} placement="bottom-end" clickable={true} flip={true}>
        <div className={classes.splashContent}>
          <SplashImageEditingOptions post={post}/>
        </div>
      </LWPopper>
    </div>
  </div>
}

export default SplashImageEditing;
