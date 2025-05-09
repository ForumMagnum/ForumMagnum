import React from 'react';
import { registerComponent } from '../../../../lib/vulcan-lib/components';
import { useMulti } from '../../../../lib/crud/withMulti';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { PostWithArtGrid } from './PostWithArtGrid';
import GenerateImagesButton from '@/components/review/GenerateImagesButton';
import { Loading } from "../../../vulcan-core/Loading";

const styles = defineStyles("SplashImageEditingOptions", (theme: ThemeType) => ({
  root: { 
    zIndex: theme.zIndexes.splashHeaderImageOptions,
    marginBottom: '40px', 
    gap: '10px',
    width: 'calc(100vw - 40px)',
    flexWrap: 'wrap',
    backgroundColor: theme.palette.background.paper,
    padding: 20,
    ...theme.typography.body2,
  },
  postWithArtGridContainer: {
    ...theme.typography.body2,
    backgroundColor: theme.palette.background.paper,
  },
  imageContainer: {
    width: '200px',
    height: 'auto',
    cursor: 'pointer',
    paddingRight: 5,
  },
  image: { 
    maxWidth: '100%',
    height: 'auto'
  },
}));

export const SplashImageEditingOptionsInner = ({ post }: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
}) => {
  const classes = useStyles(styles);

  const { results: images, loading } = useMulti({
    collectionName: 'ReviewWinnerArts',
    fragmentName: 'ReviewWinnerArtImages',
    terms: {
      view: 'postArt',
      postId: post._id,
      limit: 200,
    }
  });

  return (
    <div className={classes.root}>
      <GenerateImagesButton postId={post._id} allowCustomPrompt={true} />
      {images && <div className={classes.postWithArtGridContainer}><PostWithArtGrid post={post} images={images} defaultExpanded={true} /></div>}
      {loading && <Loading />}
    </div>
  );
};

export const SplashImageEditingOptions = registerComponent('SplashImageEditingOptions', SplashImageEditingOptionsInner);


