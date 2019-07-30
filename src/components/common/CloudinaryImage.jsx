import { registerComponent, getSetting } from 'meteor/vulcan:core';
import React from 'react';
import { Image } from 'cloudinary-react';

const CloudinaryImage = ({width, height, publicId}) => {
  const cloudinaryCloudName = getSetting('cloudinary.cloudName', 'lesswrong-2-0')
  
  let sizeProps = {};
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

registerComponent('CloudinaryImage', CloudinaryImage);