import React, { useEffect, useState } from "react";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { Components } from "@/lib/vulcan-lib/components";
import groupBy from "lodash/groupBy";
import { useImageContext } from "../ImageContext";
import GenerateImagesButton from "@/components/review/GenerateImagesButton";
import { useCreate } from "@/lib/crud/withCreate";

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

  const { create: createSplashArtCoordinateMutation } = useCreate({
    collectionName: 'SplashArtCoordinates',
    fragmentName: 'SplashArtCoordinatesEdit'
  });   

  const handleSaveCoordinates = async (image: ReviewWinnerArtImages) => {
    const { errors } = await createSplashArtCoordinateMutation({ data: {
      reviewWinnerArtId: image._id,
      leftXPct: .25,
      leftYPct: 0,
      leftWidthPct: .25,
      leftHeightPct: 1,
      leftFlipped: false,
      middleXPct: .50,
      middleYPct: 0,
      middleWidthPct: .25,
      middleHeightPct: 1,
      middleFlipped: false,
      rightXPct: .75,
      rightYPct: 0,
      rightWidthPct: .25,
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

  return <div>
    {!defaultExpanded && <div><button onClick={() => setExpanded(!expanded)}>{expanded ? 'Collapse' : `Expand (${images.length})`}</button></div>}

    {expanded && currentImageThumbnailUrl && currentImageUrl && <div>
      <LWTooltip title={<img src={currentImageUrl} />} tooltip={false}>
        <img src={currentImageThumbnailUrl} />
      </LWTooltip>
    </div>}

    {expanded && Object.entries(imagesByPrompt).map(([prompt, promptImages]) => {
      const corePrompt = prompt.split(", aquarelle artwork fading")[0] || 'No prompt found';
      return <div key={prompt}>
        <h3>{corePrompt}</h3>
        <GenerateImagesButton 
          postId={post._id}
          prompt={corePrompt}
          allowCustomPrompt={false}
          buttonText="Generate More With This Prompt"
        />
        <div className={classes.postWrapper} >
          {promptImages.map((image) => {
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
