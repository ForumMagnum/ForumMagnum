import React, { useEffect, useState } from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib/components';
import { useImageContext } from './ImageContext';
import { useMulti } from '../../../lib/crud/withMulti';
import groupBy from 'lodash/groupBy';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useCreate } from '@/lib/crud/withCreate';

export const getCloudinaryThumbnail = (url: string, width = 300): string => {
  // Check if it's a Cloudinary URL
  if (!url.includes('cloudinary.com')) return url;
  
  // Split the URL at 'upload'
  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;
  
  // Combine with width transformation
  return `${parts[0]}/upload/w_${width}/${parts[1]}`;
}

const artRowStyles = defineStyles("SplashHeaderImageOptions", (theme: ThemeType) => ({
  postWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    ...theme.typography.body2,
  },
  image: {
    width: '200px',
    height: 'auto',
    cursor: 'pointer',
    paddingRight: 5,
  },
  imageTooltipContainer: {
    width: 800,
    height: 400,
    backgroundColor: theme.palette.background.pageActiveAreaBackground
  }
}));

type Post = {_id: string, slug: string, title: string}

export const PostWithArtGrid = ({post, images, defaultExpanded = false}: {post: Post, images: ReviewWinnerArtImages[], defaultExpanded?: boolean}) => {
  const classes = useStyles(artRowStyles);
  const imagesByPrompt = groupBy(images, (image) => image.splashArtImagePrompt);
  const { LWTooltip } = Components;
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { selectedImageInfo, setImageInfo } = useImageContext();

  const { create: createSplashArtCoordinateMutation, loading, error } = useCreate({
    collectionName: 'SplashArtCoordinates',
    fragmentName: 'SplashArtCoordinatesEdit'
  });   

  const handleSaveCoordinates = async (image: ReviewWinnerArtImages) => {
    const { errors } = await createSplashArtCoordinateMutation({ data: {
      reviewWinnerArtId: image._id,
      leftXPct: 0,
      leftYPct: 0,
      leftWidthPct: .33,
      leftHeightPct: 1,
      leftFlipped: false,
      middleXPct: .33,
      middleYPct: 0,
      middleWidthPct: .33,
      middleHeightPct: 1,
      middleFlipped: false,
      rightXPct: .66,
      rightYPct: 0,
      rightWidthPct: .33,
      rightHeightPct: 1, 
      rightFlipped: false,
    } });
    if (errors) {
      // eslint-disable-next-line no-console
      console.error('Error saving coordinates', errors);
    } else {
      setImageInfo(image);
    }
  }

  useEffect(() => {
    if (!selectedImageInfo) {
      const newImageInfos = images.filter(image => 
        image.activeSplashArtCoordinates && 
        image.activeSplashArtCoordinates.reviewWinnerArtId === image?._id
      );
      const newImageInfo = newImageInfos.sort((a, b) => {
        const dateA = a.activeSplashArtCoordinates?.createdAt ? new Date(a.activeSplashArtCoordinates.createdAt).getTime() : 0;
        const dateB = b.activeSplashArtCoordinates?.createdAt ? new Date(b.activeSplashArtCoordinates.createdAt).getTime() : 0;
        return dateB - dateA;
      })[0];
      if (newImageInfo) {
        setImageInfo(newImageInfo);
      }
    }
  }, [selectedImageInfo, setImageInfo, images]);

  const currentImageThumbnailUrl = selectedImageInfo?.splashArtImageUrl ? getCloudinaryThumbnail(selectedImageInfo?.splashArtImageUrl, 300) : null

  const currentImageUrl = selectedImageInfo?.splashArtImageUrl ? getCloudinaryThumbnail(selectedImageInfo?.splashArtImageUrl, 800) : null

  return <div key={post._id}>

    {!defaultExpanded && <div><button onClick={() => setExpanded(!expanded)}>{expanded ? 'Collapse' : `Expand (${images.length})`}</button></div>}

    {expanded && currentImageThumbnailUrl && currentImageUrl && <div>
      <LWTooltip title={<img src={currentImageUrl} />} tooltip={false}>
        <img src={currentImageThumbnailUrl} />
      </LWTooltip>
    </div>}

    {expanded && Object.entries(imagesByPrompt).map(([prompt, images]) => {
      return <div key={prompt}>
        <p> {prompt.split(", aquarelle artwork fading")[0] || 'No prompt found'} </p>
        <div className={classes.postWrapper} >
          {images.map((image) => {
            const smallUrl = getCloudinaryThumbnail(image.splashArtImageUrl);
            const medUrl = getCloudinaryThumbnail(image.splashArtImageUrl, 800);

            const tooltip = <div className={classes.imageTooltipContainer}><img src={medUrl} alt={image.splashArtImagePrompt}/></div>

            return <LWTooltip key={image._id} title={tooltip} tooltip={false}>
              <img className={classes.image} key={image._id} src={smallUrl} style={{border: selectedImageInfo?._id === image._id ? '2px solid #000' : 'none'}} onClick={() => handleSaveCoordinates(image)} />
            </LWTooltip>
          })} 
        </div>
      </div>
    })}
  </div>
}

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
