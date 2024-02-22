import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import { useImageContext } from './ImageContext';
import { useMulti } from '../../../lib/crud/withMulti';

const styles = (theme: ThemeType) => ({
  root: { 
    zIndex: theme.zIndexes.splashHeaderImageOptions,
    marginBottom: '40px', 
    height: '80vh',
    overflow: 'scroll'
  },
  imageContainer: {
    width: '200px',
    height: 'auto',
    cursor: 'pointer',
  },
});

export const SplashHeaderImageOptions = ({ post, classes }: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  classes: ClassesType<typeof styles>
}) => {

  const { setImageInfo } = useImageContext();

  const { results: images } = useMulti({
    collectionName: 'ReviewWinnerArts',
    fragmentName: 'ReviewWinnerArtImages',
    terms: {
      view: 'postArt',
      postId: post._id,
    }
  });

  return (
    <div className={classes.root}>
    {images?.map((image, index) => (
      <div
        className={classes.imageContainer}
        key={index}
        onClick={() => setImageInfo(image)}
      >
        <img
          src={image.splashArtImageUrl}
          alt={`Selectable ${index}`}
          style={{ maxWidth: '100%', height: 'auto' }}
          title={`Prompt: ${image.splashArtImagePrompt || 'No prompt'}`}
        />
      </div>
      ))}
    </div>
  );
};

const SplashHeaderImageOptionsComponent = registerComponent('SplashHeaderImageOptions', SplashHeaderImageOptions, {styles});

declare global {
  interface ComponentTypes {
    SplashHeaderImageOptions: typeof SplashHeaderImageOptionsComponent
  }
}
