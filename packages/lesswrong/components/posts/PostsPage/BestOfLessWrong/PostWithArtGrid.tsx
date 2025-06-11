import React, { useEffect, useState } from "react";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import groupBy from "lodash/groupBy";
import { useImageContext } from "../ImageContext";
import GenerateImagesButton, { artPrompt } from "@/components/review/GenerateImagesButton";
import classNames from "classnames";
import LWTooltip from "../../../common/LWTooltip";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";

const SplashArtCoordinatesEditMutation = gql(`
  mutation createSplashArtCoordinatePostWithArtGrid($data: CreateSplashArtCoordinateDataInput!) {
    createSplashArtCoordinate(data: $data) {
      data {
        ...SplashArtCoordinatesEdit
      }
    }
  }
`);

export const getCloudinaryThumbnail = (url: string, width = 300): string => {
  // Check if it's a Cloudinary URL
  if (!url.includes('cloudinary.com')) return url;
  
  // Split the URL at 'upload'
  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;

  // Combine with width transformation
  return `${parts[0]}/upload/w_${width}/${parts[1]}`;
}

const artRowStyles = defineStyles("PostWithArtGrid", (theme: ThemeType) => ({
  row: {
    maxWidth: "100%",
    borderTop: theme.palette.border.normal,
    paddingTop: 10,
  },
  postWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    width: '100%',
    ...theme.typography.body2,
  },
  image: {
    width: '200px',
    maxWidth: '100%',
    height: 'auto',
    cursor: 'pointer',
    paddingRight: 5,
  },
  imageTooltipContainer: {
    width: 800,
    height: 400,
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    position: 'relative',
    boxShadow: theme.palette.boxShadow.lwCard,
  },
  expandButton: {
    cursor: 'pointer',
    marginBottom: 10,
    color: theme.palette.primary.main,
    '&:hover': {
      opacity: 0.5
    }
  },
  imageWrapper: {
    position: 'relative',
  },
  imageId: {
    ...theme.typography.body2,
    color: theme.palette.grey[400],
    fontSize: 10,
    position: 'absolute',
    bottom: 2,
    left: 2,
  },
  content: {
    marginLeft: 10,
  },
  selectedImage: {
    border: `2px solid ${theme.palette.grey[900]}`,
  }
}));

type Post = {_id: string, slug: string, title: string}

export const PostWithArtGrid = ({post, images, defaultExpanded = false}: {post: Post, images: ReviewWinnerArtImages[], defaultExpanded?: boolean}) => {
  const classes = useStyles(artRowStyles);
  const imagesByPrompt = groupBy(images, (image) => image.splashArtImagePrompt);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { selectedImageInfo, setImageInfo } = useImageContext();

  const [createSplashArtCoordinateMutation] = useMutation(SplashArtCoordinatesEditMutation);

  const handleSaveCoordinates = async (image: ReviewWinnerArtImages) => {
    // This makes a best-guess about how to crop the image for the /bestoflesswrongpage
    const { errors } = await createSplashArtCoordinateMutation({
      variables: {
        data: {
          reviewWinnerArtId: image._id,
          leftXPct: .33, // note: XPcts are right-aligned, not left-aligned like you might expect
          leftYPct: .15,
          leftWidthPct: .33, // widths need to be < .33 of the image, because they'll be 3x'd 
          // when we render them on the /bestoflesswrong page (so that when you expand the panel
          // to 3x it's size there is a background image the whole way
          leftHeightPct: .65,
          leftFlipped: true, // for the 2025+ styling (for the 2023) and onward, we want to flip
          // the left-side images because the images are designed to have most of the content on the right side by default (but we want it to show up on the left there)
          middleXPct: .66,
          middleYPct: .15,
          middleWidthPct: .33,
          middleHeightPct: 1,
          middleFlipped: false,
          rightXPct: 0,
          rightYPct: .15,
          rightWidthPct: .33,
          rightHeightPct: .65,
          rightFlipped: false,
        }
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

  return <div>
    {!defaultExpanded && <div className={classes.expandButton} onClick={() => setExpanded(!expanded)}>{expanded ? 'Collapse' : `Expand (${images.length})`}</div>}

    {expanded && Object.entries(imagesByPrompt).map(([prompt, promptImages]) => {
      const corePrompt = prompt.split(artPrompt)[0]
      return <div key={prompt} className={classes.row}>
        <h3>{corePrompt}</h3>
        <div className={classes.content}>
          <GenerateImagesButton 
            postId={post._id}
            prompt={prompt}
            allowCustomPrompt={false}
            buttonText="Generate More With This Prompt"
          />
          <div className={classes.postWrapper} >
            {promptImages.map((image) => {
              const smallUrl = getCloudinaryThumbnail(image.splashArtImageUrl);
              const medUrl = getCloudinaryThumbnail(image.splashArtImageUrl, 800);

              const tooltip = <img src={medUrl} className={classes.imageTooltipContainer} />

              return <LWTooltip key={image._id} title={tooltip} tooltip={false}>
                <div key={image._id} className={classes.imageWrapper}>
                  <img className={classNames(classes.image, selectedImageInfo?._id === image._id && classes.selectedImage)} src={smallUrl} onClick={() => handleSaveCoordinates(image)} />
                  <div className={classes.imageId}>
                    {image._id}
                  </div>
                </div>
              </LWTooltip>
            })} 
          </div>
        </div>
      </div>
    })}
  </div>
}
