import React, { RefObject, useState } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useMutation } from "@apollo/client/react";
import { gql } from '@/lib/generated/gql-codegen';
import SplashImageEditingOptions from "./SplashImageEditingOptions";
import ImageCropPreview from "./ImageCropPreview";
import LWDialog from "../../../common/LWDialog";

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
  optionsDialogPaper: {
    width: 'calc(100vw - 80px)',
  },
}));

const SplashImageEditing = ({ imgRef, imageFlipped, setImageFlipped, post }: { imgRef: RefObject<HTMLImageElement|null>, imageFlipped: boolean, setImageFlipped: (imageFlipped: boolean) => void, post: PostsWithNavigation|PostsWithNavigationAndRevision}) => {
  const classes = useStyles(styles);
  const [optionsOpen, setOptionsOpen] = useState(false);

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
    <div className={classes.changeImageBox} onClick={() => setOptionsOpen(true)}>Change image</div>
    <LWDialog
      open={optionsOpen}
      onClose={() => setOptionsOpen(false)}
      maxWidth={false}
      paperClassName={classes.optionsDialogPaper}
    >
      <SplashImageEditingOptions post={post}/>
    </LWDialog>
  </div>
}

export default SplashImageEditing;
