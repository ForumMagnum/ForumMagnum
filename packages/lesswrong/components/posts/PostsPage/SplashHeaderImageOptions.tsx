import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib/components';
import { useImageContext } from './ImageContext';
import { useMulti } from '../../../lib/crud/withMulti';

const styles = (theme: ThemeType) => ({
  root: { 
    zIndex: theme.zIndexes.splashHeaderImageOptions,
    marginBottom: '40px', 
    height: '80vh',
    overflow: 'scroll',
    width: 200
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
});

export const SplashHeaderImageOptions = ({ post, classes }: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  classes: ClassesType<typeof styles>
}) => {
  const { setImageInfo } = useImageContext();
  const { LWTooltip, Loading } = Components;

  const { results: images, loading } = useMulti({
    collectionName: 'ReviewWinnerArts',
    fragmentName: 'ReviewWinnerArtImages',
    terms: {
      view: 'postArt',
      postId: post._id,
      limit: 100,
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
        <LWTooltip title={`Prompt: ${image.splashArtImagePrompt.split(", aquarelle artwork fading")[0] || 'No prompt found'}`} placement="left-start">
          <img
            src={image.splashArtImageUrl}
            alt={`Selectable ${index}`}
            className={classes.image}
          />
        </LWTooltip>
      </div>
      ))}
      {loading && <Loading />}
    </div>
  );
};

const SplashHeaderImageOptionsComponent = registerComponent('SplashHeaderImageOptions', SplashHeaderImageOptions, {styles});

declare global {
  interface ComponentTypes {
    SplashHeaderImageOptions: typeof SplashHeaderImageOptionsComponent
  }
}
