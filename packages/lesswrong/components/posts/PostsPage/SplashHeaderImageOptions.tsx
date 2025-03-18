import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib/components';
import { useImageContext } from './ImageContext';
import { useMulti } from '../../../lib/crud/withMulti';
import groupBy from 'lodash/groupBy';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = (theme: ThemeType) => ({
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
    boxShadow: theme.palette.boxShadow.lwCard,
    padding: 20
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

export const getCloudinaryThumbnail = (url: string, width = 200): string => {
  // Check if it's a Cloudinary URL
  if (!url.includes('cloudinary.com')) return url;
  
  // Split the URL at 'upload'
  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;
  
  // Combine with width transformation
  return `${parts[0]}/upload/w_${width}/${parts[1]}`;
}

type Post = {_id: string, slug: string, title: string}

const artRowStyles = defineStyles("SplashHeaderImageOptions", (theme: ThemeType) => ({
  root: {
  
  },
  postWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px'
  }
}));



export const PostWithArtRow = ({post, images}: {post: Post, images: ReviewWinnerArtImages[]}) => {
  const classes = useStyles(artRowStyles);
  const imagesByPrompt = groupBy(images, (image) => image.splashArtImagePrompt);
  const { LWTooltip } = Components;
  return <div key={post._id}>
    {Object.entries(imagesByPrompt).map(([prompt, images]) => {
      return <div key={prompt}>
        <p> {prompt.split(", aquarelle artwork fading")[0] || 'No prompt found'} </p>
        <div className={classes.postWrapper} >
          {images.map((image) => {
            const smallUrl = getCloudinaryThumbnail(image.splashArtImageUrl);
            const medUrl = getCloudinaryThumbnail(image.splashArtImageUrl, 800);
            return <LWTooltip key={image._id} title={<img src={medUrl} alt={image.splashArtImagePrompt}/>} tooltip={false}>
              <img key={image._id} src={smallUrl} alt={image.splashArtImagePrompt} />
            </LWTooltip>
          })} 
        </div>
      </div>
    })}
  </div>
}


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
      {images && <PostWithArtRow post={post} images={images} />}
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
