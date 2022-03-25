import { registerComponent } from '../../lib/vulcan-lib';
import React, { CSSProperties } from 'react';
import { cloudinaryCloudNameSetting } from '../../lib/publicSettings';

const DEFAULT_HEADER_HEIGHT = 300;

// see their documentation: https://cloudinary.com/documentation/transformation_reference
export type CloudinaryPropsType = {
  dpr?: string, // device pixel ratio
  ar?: string,  // aspect ratio
  w?: string,   // width
  h?: string,   // height
  c?: string,   // crop
  g?: string,   // gravity
  q?: string    // quality
  f?: string    // format
}

function cloudinaryPropsToStr(props) {
  let sb: string[] = [];
  for(let k in props)
    sb.push(`${k}_${props[k]}`);
  return sb.join(",");
}

function makeCloudinaryImageUrl (publicId: string, cloudinaryProps: CloudinaryPropsType) {
  return `https://res.cloudinary.com/${cloudinaryCloudNameSetting.get()}/image/upload/${cloudinaryPropsToStr(cloudinaryProps)}/${publicId}`
}

// Cloudinary image without using cloudinary-react. Allows SSR. See:
// https://github.com/LessWrong2/Lesswrong2/pull/937 "Drop cloudinary react"
// https://github.com/LessWrong2/Lesswrong2/pull/964 "Temporarily revert removal of cloudinary-react"
const CloudinaryImage2 = ({width, height, objectFit, publicId, imgProps, header, className}: {
  width?: number|string,
  height?: number,
  objectFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down',
  publicId: string,
  imgProps?: CloudinaryPropsType,
  header?: boolean,
  className?: string,
}) => {
  let cloudinaryProps: CloudinaryPropsType = {
    c: "fill",
    dpr: "auto",
    g: "custom",
    q: "auto",
    f: "auto"
  };
  let imageStyle: CSSProperties = {};

  if (width) {
    cloudinaryProps.w = width.toString()
    imageStyle.width = width
  }
  // ignore input width if we're told we have a header
  if (header) {
    cloudinaryProps.w = 'iw'
    imageStyle.width="100%"
  }
  if (height) {
    cloudinaryProps.h = height.toString()
    imageStyle.height = height+"px";
  }
  if (objectFit) {
    imageStyle.objectFit = objectFit
  }
  
  cloudinaryProps = {...cloudinaryProps, ...imgProps}

  const imageUrl = makeCloudinaryImageUrl(publicId, cloudinaryProps)

  // header images are big and so need srcsets
  let srcSet = {}
  if (header) {
    const srcSetHeight = ((height || DEFAULT_HEADER_HEIGHT)*2).toString()
    srcSet = {
      // we generally double the size because lots of screens these days are
      // retina or similar
      srcSet: `
        ${makeCloudinaryImageUrl(publicId, {...cloudinaryProps, ...{w: '900', h: srcSetHeight}})} 450w,
        ${makeCloudinaryImageUrl(publicId, {...cloudinaryProps, ...{w: '1800', h: srcSetHeight}})} 900w,
        ${makeCloudinaryImageUrl(publicId, {...cloudinaryProps, ...{w: '3000', h: srcSetHeight}})} 1500w,
      `
    }
  }

  return <img
    src={imageUrl}
    {...srcSet}
    style={imageStyle}
    className={className}
  />
};

const CloudinaryImage2Component = registerComponent('CloudinaryImage2', CloudinaryImage2);

declare global {
  interface ComponentTypes {
    CloudinaryImage2: typeof CloudinaryImage2Component
  }
}
