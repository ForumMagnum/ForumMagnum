import React from 'react';
import { registerComponent, Components } from '../../../../lib/vulcan-lib/components';
import { useMulti } from '../../../../lib/crud/withMulti';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { PostWithArtGrid } from './PostWithArtGrid';

const styles = defineStyles("SplashHeaderImageOptions", (theme: ThemeType) => ({
  root: { 
    zIndex: theme.zIndexes.splashHeaderImageOptions,
    marginBottom: '40px', 
    height: '80vh',
    overflow: 'scroll',
    display: 'flex',
    gap: '10px',
    width: 'calc(100vw - 40px)',
    flexWrap: 'wrap',
    backgroundColor: theme.palette.background.paper,
    padding: 20,
    ...theme.typography.body2,
    '& $PostWithArtRow': {
      ...theme.typography.body2,
      backgroundColor: theme.palette.background.paper,
    }
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
  }
}));

export const SplashHeaderImageOptions = ({ post }: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
}) => {
  const { Loading } = Components;
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
      {images && <PostWithArtGrid post={post} images={images} defaultExpanded={true} />}
      {loading && <Loading />}
    </div>
  );
};

const SplashHeaderImageOptionsComponent = registerComponent('SplashHeaderImageOptions', SplashHeaderImageOptions);

declare global {
  interface ComponentTypes {
    SplashHeaderImageOptions: typeof SplashHeaderImageOptionsComponent
  }
}
