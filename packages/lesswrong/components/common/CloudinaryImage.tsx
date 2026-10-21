import React, { useEffect, useRef, useState } from 'react';
import { cloudinaryCloudName } from '@/lib/instanceSettings';

interface ImgPropsType {
  quality?: string,
  dpr?: string,
  crop?: string,
  gravity?: string,
  background?: string,
}

function imageUrl(publicId: string, width: number|string|undefined, height: number|string|undefined, imgProps: ImgPropsType, dpr: string) {
  const transformations = [
    `c_${imgProps.crop ?? 'fill'}`,
    `dpr_${dpr}`,
    `g_${imgProps.gravity ?? 'custom'}`,
    `q_${imgProps.quality ?? 'auto'}`,
  ];
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (imgProps.background) transformations.push(`b_${imgProps.background.replace(/^#/, 'rgb:')}`);
  const encodedPublicId = publicId.split('/').map(encodeURIComponent).join('/');
  return `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/${transformations.join(',')}/${encodedPublicId}`;
}

const CloudinaryImage = ({width, height, publicId, imgProps = {}}: {
  width?: number|string,
  height?: number|string,
  publicId: string,
  imgProps?: ImgPropsType
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>();

  useEffect(() => {
    if (width !== 'auto') return;
    const container = imageRef.current?.parentElement;
    if (!container) return;
    const observer = new ResizeObserver(entries => {
      const measuredWidth = Math.ceil(entries[0].contentRect.width);
      if (measuredWidth > 0) setContainerWidth(measuredWidth);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [width]);

  const imageWidth = width === 'auto' ? containerWidth : width;
  const dpr = imgProps.dpr ?? 'auto';
  const automaticDpr = dpr === 'auto';
  // Wait for layout before requesting an automatically sized banner.
  const src = width === 'auto' && !imageWidth ? undefined
    : imageUrl(publicId, imageWidth, height, imgProps, automaticDpr ? '1.0' : dpr);
  const sources: string[] = [];
  if (src && automaticDpr) {
    for (const density of [1, 2, 3, 4]) {
      sources.push(`${imageUrl(publicId, imageWidth, height, imgProps, `${density}.0`)} ${density}x`);
    }
  }
  const omitDimensions = ['fit', 'limit', 'lfill'].includes(imgProps.crop ?? 'fill');

  return <img
    ref={imageRef}
    src={src}
    srcSet={sources.length ? sources.join(', ') : undefined}
    width={!omitDimensions && width && Number(width) >= 1 ? width : undefined}
    height={!omitDimensions && height && Number(height) >= 1 ? height : undefined}
  />;
};

export default CloudinaryImage;
