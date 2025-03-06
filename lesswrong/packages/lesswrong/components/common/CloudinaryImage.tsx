import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { Image } from 'cloudinary-react';
import { cloudinaryCloudNameSetting } from '../../lib/publicSettings';

type ImgPropsType = {
  quality?: string,
  dpr?: string,
  crop?: string,
  gravity?: string,
  background?: string,
}

const CloudinaryImage = ({width, height, publicId, imgProps = {}}: {
  width?: number|string,
  height?: number|string,
  publicId: string,
  imgProps?: ImgPropsType
}) => {
  const cloudinaryCloudName = cloudinaryCloudNameSetting.get()
  
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
    {...imgProps}
  />
};

const CloudinaryImageComponent = registerComponent('CloudinaryImage', CloudinaryImage);

declare global {
  interface ComponentTypes {
    CloudinaryImage: typeof CloudinaryImageComponent
  }
}

export default CloudinaryImageComponent;
