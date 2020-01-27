import { registerComponent, getSetting } from 'meteor/vulcan:core';
import React from 'react';
import { Image } from 'cloudinary-react';

const CloudinaryImage = ({width, height, publicId}: {
  width?: number,
  height?: number,
  publicId: string,
}) => {
  const cloudinaryCloudName = getSetting('cloudinary.cloudName', 'lesswrong-2-0')
  
  let sizeProps: any = {};
  if (width)
    sizeProps.width = width;
  if (height)
    sizeProps.height = height;
  
  return <Image
    publicId={publicId}
    cloudName={cloudinaryCloudName}
    quality="auto"
    responsive={true}
    dpr="auto"
    crop="fill"
    gravity="custom"
    {...sizeProps}
  />
};

const CloudinaryImageComponent = registerComponent('CloudinaryImage', CloudinaryImage);

declare global {
  interface ComponentTypes {
    CloudinaryImage: typeof CloudinaryImageComponent
  }
}
