import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { Link } from '@/lib/reactRouterWrapper';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import { getCloudinaryThumbnail } from '@/components/posts/PostsPage/BestOfLessWrong/PostWithArtGrid';
import { ImageProvider, useImageContext } from '@/components/posts/PostsPage/ImageContext';
import GenerateImagesButton from '../GenerateImagesButton';
import LWTooltip from '@/components/common/LWTooltip';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import classNames from 'classnames';
import groupBy from 'lodash/groupBy';
import {
  type AdminViewProps,
  type ReviewPostWithStatus,
  STATUS_COLORS,
  STATUS_LABELS,
  cleanPromptForDisplay,
} from './types';

const SplashArtCoordinatesEditMutation = gql(`
  mutation createSplashArtCoordinateCarouselView($data: CreateSplashArtCoordinateDataInput!) {
    createSplashArtCoordinate(data: $data) {
      data {
        ...SplashArtCoordinatesEdit
      }
    }
  }
`);

const UpscaleReviewWinnerArtMutation = gql(`
  mutation upscaleReviewWinnerArtCarouselView($reviewWinnerArtId: String!) {
    upscaleReviewWinnerArt(reviewWinnerArtId: $reviewWinnerArtId) {
      ...ReviewWinnerArtImages
    }
  }
`);

const styles = defineStyles("CarouselView", (theme: ThemeType) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  titleArea: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  postTitle: {
    ...theme.typography.body2,
    fontSize: 20,
    fontWeight: 600,
    margin: 0,
  },
  navArea: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  navButton: {
    ...theme.typography.body2,
    fontSize: 13,
    padding: '6px 16px',
    border: theme.palette.border.faint,
    borderRadius: 4,
    backgroundColor: 'transparent',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.greyAlpha(0.05),
    },
    '&:disabled': {
      opacity: 0.3,
      cursor: 'default',
    },
  },
  navCounter: {
    ...theme.typography.body2,
    fontSize: 12,
    color: theme.palette.grey[600],
    minWidth: 50,
    textAlign: 'center',
  },
  statusBadge: {
    ...theme.typography.body2,
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 10,
    color: theme.palette.text.alwaysWhite,
    fontWeight: 500,
  },
  promptSection: {
    marginBottom: 12,
  },
  promptLabel: {
    ...theme.typography.body2,
    fontSize: 12,
    color: theme.palette.grey[600],
    marginBottom: 6,
    fontStyle: 'italic',
  },
  imageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 10,
  },
  imageCard: {
    position: 'relative',
    borderRadius: 6,
    overflow: 'hidden',
    cursor: 'pointer',
    border: `2px solid transparent`,
    transition: 'border-color 0.15s',
    '&:hover': {
      borderColor: theme.palette.greyAlpha(0.3),
    },
  },
  imageCardSelected: {
    borderColor: theme.palette.grey[900],
  },
  image: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '6px 8px',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 6,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.5))',
  },
  actionButton: {
    ...theme.typography.body2,
    fontSize: 11,
    padding: '3px 10px',
    borderRadius: 3,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 500,
    color: theme.palette.text.alwaysWhite,
    backgroundColor: 'rgba(0,0,0,0.6)',
    '&:hover': {
      backgroundColor: 'rgba(0,0,0,0.8)',
    },
  },
  actionButtonPrimary: {
    backgroundColor: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  upscaleBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    ...theme.typography.body2,
    fontSize: 10,
    fontWeight: 600,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.text.alwaysWhite,
    padding: '1px 5px',
    borderRadius: 3,
  },
  filmstrip: {
    display: 'flex',
    gap: 3,
    overflowX: 'auto',
    padding: '8px 0',
    borderTop: theme.palette.border.faint,
  },
  filmstripItem: {
    width: 40,
    height: 20,
    minWidth: 40,
    borderRadius: 2,
    cursor: 'pointer',
    objectFit: 'cover',
    opacity: 0.6,
    transition: 'opacity 0.1s',
    '&:hover': {
      opacity: 1,
    },
  },
  filmstripItemActive: {
    opacity: 1,
    outline: `2px solid ${theme.palette.grey[900]}`,
    outlineOffset: 1,
  },
  filmstripPlaceholder: {
    width: 40,
    height: 20,
    minWidth: 40,
    borderRadius: 2,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 8,
    color: theme.palette.grey[500],
  },
  tooltipImage: {
    width: 800,
    height: 'auto',
  },
}));

function CarouselImageGrid({item, refetchImages}: {item: ReviewPostWithStatus; refetchImages: () => void}) {
  const classes = useStyles(styles);
  const { selectedImageInfo, setImageInfo } = useImageContext();

  const [createCoordsMutation] = useMutation(SplashArtCoordinatesEditMutation);
  const [upscaleMutation] = useMutation(UpscaleReviewWinnerArtMutation);
  const [upscalingId, setUpscalingId] = useState<string | null>(null);

  const imagesByPrompt = useMemo(() => groupBy(item.images, img => img.splashArtImagePrompt), [item.images]);

  // Initialize selected image from active coordinates
  useEffect(() => {
    if (!selectedImageInfo) {
      const active = item.images.find(img =>
        img.activeSplashArtCoordinates && img.activeSplashArtCoordinates.reviewWinnerArtId === img._id
      );
      if (active) {
        setImageInfo(active);
      }
    }
  }, [selectedImageInfo, setImageInfo, item.images]);

  async function handleSelect(image: ReviewWinnerArtImages) {
    const { error } = await createCoordsMutation({
      variables: {
        data: {
          reviewWinnerArtId: image._id,
          leftXPct: .33,
          leftYPct: .15,
          leftWidthPct: .33,
          leftHeightPct: .65,
          leftFlipped: true,
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
      }
    });
    if (!error) {
      setImageInfo(image);
    }
  }

  async function handleUpscale(e: React.MouseEvent, image: ReviewWinnerArtImages) {
    e.stopPropagation();
    setUpscalingId(image._id);
    try {
      await upscaleMutation({ variables: { reviewWinnerArtId: image._id } });
    } finally {
      setUpscalingId(null);
    }
  }

  return <div>
    {Object.entries(imagesByPrompt).map(([prompt, promptImages]) => (
      <div key={prompt} className={classes.promptSection}>
        <div className={classes.promptLabel}>{cleanPromptForDisplay(prompt)}</div>
        <div className={classes.imageGrid}>
          {promptImages.map(image => {
            const isSelected = selectedImageInfo?._id === image._id;
            const url = getCloudinaryThumbnail(image.splashArtImageUrl, 600);
            const tooltipUrl = image.upscaledImageUrl
              ? getCloudinaryThumbnail(image.upscaledImageUrl, 800)
              : getCloudinaryThumbnail(image.splashArtImageUrl, 800);
            const canUpscale = image.midjourneyJobId && !image.upscaledImageUrl;
            const isUpscaling = upscalingId === image._id;

            return <LWTooltip
              key={image._id}
              title={<img src={tooltipUrl} className={classes.tooltipImage} />}
              tooltip={false}
            >
              <div
                className={classNames(classes.imageCard, isSelected && classes.imageCardSelected)}
                onClick={() => handleSelect(image)}
              >
                <img className={classes.image} src={url} />
                {image.upscaledImageUrl && <div className={classes.upscaleBadge}>2x</div>}
                <div className={classes.imageOverlay}>
                  {!isSelected && <button className={classNames(classes.actionButton, classes.actionButtonPrimary)} onClick={e => { e.stopPropagation(); handleSelect(image); }}>
                    Select
                  </button>}
                  {canUpscale && <button className={classes.actionButton} onClick={e => handleUpscale(e, image)}>
                    {isUpscaling ? 'Upscaling...' : 'Upscale'}
                  </button>}
                </div>
              </div>
            </LWTooltip>;
          })}
        </div>
      </div>
    ))}
  </div>;
}

export function CarouselView({posts, refetchImages}: AdminViewProps) {
  const classes = useStyles(styles);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentPost = posts[currentIndex];

  const goNext = useCallback(() => {
    if (currentIndex < posts.length - 1) setCurrentIndex(currentIndex + 1);
  }, [currentIndex, posts.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  }, [currentIndex]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev]);

  if (!currentPost) return null;

  return <div className={classes.container}>
    <div className={classes.header}>
      <div className={classes.titleArea}>
        <h2 className={classes.postTitle}>
          <Link to={postGetPageUrl(currentPost.post)} target="_blank">
            {currentPost.post.title}
          </Link>
        </h2>
        <span
          className={classes.statusBadge}
          style={{backgroundColor: STATUS_COLORS[currentPost.status]}}
        >
          {STATUS_LABELS[currentPost.status]}
        </span>
      </div>
      <div className={classes.navArea}>
        <button className={classes.navButton} onClick={goPrev} disabled={currentIndex <= 0}>
          \u2190 Prev
        </button>
        <span className={classes.navCounter}>{currentIndex + 1} / {posts.length}</span>
        <button className={classes.navButton} onClick={goNext} disabled={currentIndex >= posts.length - 1}>
          Next \u2192
        </button>
      </div>
    </div>

    <ImageProvider key={currentPost.post._id}>
      <GenerateImagesButton
        postId={currentPost.post._id}
        allowCustomPrompt={true}
        buttonText="Generate More Images"
        onComplete={refetchImages}
      />
      <CarouselImageGrid item={currentPost} refetchImages={refetchImages} />
    </ImageProvider>

    <div className={classes.filmstrip}>
      {posts.map((item, idx) => {
        const thumbUrl = item.activeImage
          ? getCloudinaryThumbnail(item.activeImage.splashArtImageUrl, 80)
          : item.images[0]
            ? getCloudinaryThumbnail(item.images[0].splashArtImageUrl, 80)
            : null;

        if (thumbUrl) {
          return <img
            key={item.post._id}
            className={classNames(classes.filmstripItem, idx === currentIndex && classes.filmstripItemActive)}
            src={thumbUrl}
            style={{borderBottom: `2px solid ${STATUS_COLORS[item.status]}`}}
            onClick={() => setCurrentIndex(idx)}
          />;
        }
        return <div
          key={item.post._id}
          className={classNames(classes.filmstripPlaceholder, idx === currentIndex && classes.filmstripItemActive)}
          style={{borderBottom: `2px solid ${STATUS_COLORS[item.status]}`, backgroundColor: STATUS_COLORS[item.status] + '22'}}
          onClick={() => setCurrentIndex(idx)}
        >
          ?
        </div>;
      })}
    </div>
  </div>;
}
