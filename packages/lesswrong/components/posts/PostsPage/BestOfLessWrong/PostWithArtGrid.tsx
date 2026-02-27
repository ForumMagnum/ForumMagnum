import React, { useEffect, useState } from "react";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import groupBy from "lodash/groupBy";
import { useImageContext } from "../ImageContext";
import GenerateImagesButton from "@/components/review/GenerateImagesButton";
import { cleanPromptForDisplay, SELECTION_DEFAULT_COORDINATES } from '@/components/review/reviewAdminViews/types';
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

const UpscaleReviewWinnerArtMutation = gql(`
  mutation upscaleReviewWinnerArtPostWithArtGrid($reviewWinnerArtId: String!) {
    upscaleReviewWinnerArt(reviewWinnerArtId: $reviewWinnerArtId) {
      ...ReviewWinnerArtImages
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
    marginTop: 3,
  },
  postWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    width: '100%',
    ...theme.typography.body2,
  },
  image: {
    width: '100%',
    height: 200,
    objectFit: 'cover',
    cursor: 'pointer',
    display: 'block',
  },
  imageTooltipContainer: {
    width: 800,
    height: 'fit-content',
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
    width: 400,
    transition: 'opacity 0.15s',
  },
  imageWrapperFaded: {
    opacity: 0.25,
  },
  imageId: {
    ...theme.typography.body2,
    color: theme.palette.grey[400],
    fontSize: 10,
  },
  content: {
    marginLeft: 10,
  },
  selectedImage: {
    border: `2px solid ${theme.palette.grey[900]}`,
  },
  imageActions: {
    display: 'flex',
    gap: 6,
    marginTop: 3,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upscaleBadge: {
    ...theme.typography.body2,
    fontSize: 11,
    fontWeight: 600,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.text.alwaysWhite,
    padding: '1px 6px',
    borderRadius: 3,
  },
  upscaleButton: {
    ...theme.typography.body2,
    fontSize: 11,
    cursor: 'pointer',
    color: theme.palette.primary.main,
    backgroundColor: theme.palette.greyAlpha(0.08),
    padding: '2px 8px',
    borderRadius: 3,
    border: 'none',
    '&:hover': {
      backgroundColor: theme.palette.greyAlpha(0.18),
    },
  },
}));

type Post = {_id: string, slug: string, title: string}

export const PostWithArtGrid = ({post, images, defaultExpanded = false, fadeNonUpscaled = false, refetchImages}: {post: Post, images: ReviewWinnerArtImages[], defaultExpanded?: boolean, fadeNonUpscaled?: boolean, refetchImages?: () => void}) => {
  const classes = useStyles(artRowStyles);
  const imagesByPrompt = groupBy(images, (image) => image.splashArtImagePrompt);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { selectedImageInfo, setImageInfo } = useImageContext();

  const [createSplashArtCoordinateMutation] = useMutation(SplashArtCoordinatesEditMutation);
  const [upscaleReviewWinnerArtMutation] = useMutation(UpscaleReviewWinnerArtMutation);
  const [upscalingImageId, setUpscalingImageId] = useState<string | null>(null);

  const handleSaveCoordinates = async (image: ReviewWinnerArtImages) => {
    const { error } = await createSplashArtCoordinateMutation({
      variables: {
        data: {
          reviewWinnerArtId: image._id,
          ...SELECTION_DEFAULT_COORDINATES,
        }
      } });

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Error saving coordinates', error);
    } else {
      setImageInfo(image);
    }
  }

  const handleUpscale = async (e: React.MouseEvent, image: ReviewWinnerArtImages) => {
    e.stopPropagation();
    setUpscalingImageId(image._id);
    try {
      await upscaleReviewWinnerArtMutation({
        variables: { reviewWinnerArtId: image._id },
        onCompleted: () => {
          refetchImages?.();
        },
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error upscaling image', err);
    } finally {
      setUpscalingImageId(null);
    }
  };

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
      const corePrompt = cleanPromptForDisplay(prompt)
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
              const smallUrl = getCloudinaryThumbnail(image.splashArtImageUrl, 400);
              const tooltipImageUrl = image.upscaledImageUrl
                ? getCloudinaryThumbnail(image.upscaledImageUrl, 800)
                : getCloudinaryThumbnail(image.splashArtImageUrl, 800);

              const tooltip = <img src={tooltipImageUrl} className={classes.imageTooltipContainer} />

              const canUpscale = image.midjourneyJobId && !image.upscaledImageUrl;
              const isUpscaling = upscalingImageId === image._id;

              return <LWTooltip key={image._id} title={tooltip} tooltip={false}>
                <div className={classNames(classes.imageWrapper, fadeNonUpscaled && !image.upscaledImageUrl && classes.imageWrapperFaded)}>
                  <img className={classNames(classes.image, selectedImageInfo?._id === image._id && classes.selectedImage)} src={smallUrl} onClick={() => handleSaveCoordinates(image)} />
                  <div className={classes.imageActions}>
                    <span className={classes.imageId}>{image._id}</span>
                    <span>
                      {image.upscaledImageUrl && (
                        <span className={classes.upscaleBadge}>2x</span>
                      )}
                      {canUpscale && (
                        <button
                          className={classes.upscaleButton}
                          onClick={(e) => handleUpscale(e, image)}
                        >
                          {isUpscaling ? 'Upscaling...' : 'Upscale'}
                        </button>
                      )}
                    </span>
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
