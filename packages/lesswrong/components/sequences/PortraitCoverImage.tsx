import React from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import CloudinaryImage2 from '@/components/common/CloudinaryImage2';

const styles = defineStyles('PortraitCoverImage', (theme: ThemeType) => ({
  image: {
    display: 'block',
    boxShadow: `0 1px 3px ${theme.palette.boxShadowColor(0.15)}`,
  },
  fallback: {
    display: 'flex',
    alignItems: 'flex-end',
    boxSizing: 'border-box',
    padding: '0.55em',
    background: theme.palette.grey[300],
    boxShadow: `0 1px 3px ${theme.palette.boxShadowColor(0.15)}`,
    overflow: 'hidden',
  },
  fallbackTitle: {
    fontFamily: theme.typography.headerStyle.fontFamily,
    fontWeight: 500,
    color: theme.palette.grey[710],
    lineHeight: 1.25,
  },
}));

/**
 * Portrait (~3:4) book-cover art for a sequence or collection.
 * Falls back from the dedicated portrait cover to a Cloudinary center-crop of
 * the landscape card/banner art, and finally to a title-on-panel placeholder
 * for items with no art at all.
 */
const PortraitCoverImage = ({coverImageId, gridImageId, bannerImageId, title, width, height, className}: {
  coverImageId?: string | null,
  gridImageId?: string | null,
  bannerImageId?: string | null,
  title: string,
  width: number,
  height: number,
  className?: string,
}) => {
  const classes = useStyles(styles);
  const imageId = coverImageId || gridImageId || bannerImageId;

  if (imageId) {
    return <CloudinaryImage2
      publicId={imageId}
      width={width}
      height={height}
      objectFit="cover"
      className={classNames(classes.image, className)}
    />;
  }

  return <div
    className={classNames(classes.fallback, className)}
    style={{width, height, fontSize: Math.max(9, Math.round(width * 0.11))}}
  >
    <span className={classes.fallbackTitle}>{title}</span>
  </div>;
};

export default PortraitCoverImage;
