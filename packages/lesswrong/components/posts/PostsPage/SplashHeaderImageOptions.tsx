import React, { useState } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import classNames from 'classnames';
import { ImageProvider, useImageContext } from './ImageContext';
// import PostsPageSplashHeader from './PostsPageSplashHeader';


const styles = (theme: ThemeType) => ({
  root: {
    zIndex: theme.zIndexes.splashHeaderImageOptions,
  },
  idk: { 
    display: 'flex', 
    flexDirection: 'column',
    justifyContent: 'space-around',
    marginBottom: '40px', 
  },
  imageContainer: {
    width: '200px',
    height: 'auto',
    cursor: 'pointer',
    // style={{ cursor: 'pointer', display: 'inline-block', maxWidth: '200px' }}
  },
});

export const SplashHeaderImageOptions = ({ images, post, classes } : {
  images: string[],
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  classes: ClassesType<typeof styles>
}) => {
  // const { PostsPodcastPlayer, T3AudioPlayer } = Components;

  const [selectedImage, setSelectedImage] = useState(images[0]);
  const { setImageURL, } = useImageContext();

  const handleImageClick = (imageUrl : string) => {
    setSelectedImage(imageUrl);
    setImageURL(imageUrl); // Step 3
  };

  return (
      <div className={classes.root}>
        <div className={classes.idk}>
        {images.slice(0, 8).map((image, index) => (
          <div 
            className={classes.imageContainer}
            key={index}
            onClick={() => handleImageClick(image)}
          >
            <img
              src={image}
              alt={`Selectable ${index}`}
              style={{ maxWidth: '100%', height: 'auto' }} // Ensure the image scales within the div
            />
          </div>
          ))}
        </div>
      </div>
  );
};

const SplashHeaderImageOptionsComponent = registerComponent('SplashHeaderImageOptions', SplashHeaderImageOptions, {styles});

declare global {
  interface ComponentTypes {
    SplashHeaderImageOptions: typeof SplashHeaderImageOptionsComponent
  }
}
