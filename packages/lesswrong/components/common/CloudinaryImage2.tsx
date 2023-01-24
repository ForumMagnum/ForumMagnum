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

export function makeCloudinaryImageUrl (publicId: string, cloudinaryProps: CloudinaryPropsType) {
  return `https://res.cloudinary.com/${cloudinaryCloudNameSetting.get()}/image/upload/c_crop,g_custom/${cloudinaryPropsToStr(cloudinaryProps)}/${publicId}`
}

// Cloudinary image without using cloudinary-react. Allows SSR.
const CloudinaryImage2 = ({width, height, objectFit, publicId, imgProps, fullWidthHeader, className}: {
  /** Overridden if fullWidthHeader is true */
  width?: number|string,
  height?: number,
  objectFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down',
  publicId: string,
  imgProps?: CloudinaryPropsType,
  /** Overrides width */
  fullWidthHeader?: boolean,
  className?: string,
}) => {
  let cloudinaryProps: CloudinaryPropsType = {
    c: "fill",
    dpr: "auto",
    q: "auto",
    f: "auto",
    g: "auto:faces"
  };
  let imageStyle: CSSProperties = {};

  if (width) {
    cloudinaryProps.w = width.toString()
    imageStyle.width = width
  }
  if (height) {
    cloudinaryProps.h = height.toString()
    imageStyle.height = height+"px";
  }
  // ignore input width if we're told we have a fullWidthHeader
  if (fullWidthHeader) {
    // cloudinary props will be used for src, but srcset will effectively
    // overwrite these, unless client is IE
    cloudinaryProps.h = ((height || DEFAULT_HEADER_HEIGHT)*2).toString()
    cloudinaryProps.w = 'iw'
    imageStyle.width="100%"
  }
  if (objectFit) {
    imageStyle.objectFit = objectFit
  }
  
  cloudinaryProps = {...cloudinaryProps, ...imgProps}

  const imageUrl = makeCloudinaryImageUrl(publicId, cloudinaryProps)

  // fullWidthHeader images are big and so need srcsets
  let srcSet = {}
  if (fullWidthHeader) {
    // We always double the height, to account for high dpi screens. We can't
    // combine srcset width-checking with DPI-checking unfortunately.
    const srcSetHeight = ((height || DEFAULT_HEADER_HEIGHT)*2).toString()
    // NB: we lie about the final width here, we don't know it
    srcSet = {
      srcSet: `
        ${makeCloudinaryImageUrl(publicId, {...cloudinaryProps, ...{w: '450', h: srcSetHeight}})} 450w,
        ${makeCloudinaryImageUrl(publicId, {...cloudinaryProps, ...{w: '900', h: srcSetHeight}})} 900w,
        ${makeCloudinaryImageUrl(publicId, {...cloudinaryProps, ...{w: '1500', h: srcSetHeight}})} 1500w,
        ${makeCloudinaryImageUrl(publicId, {...cloudinaryProps, ...{w: 'iw', h: srcSetHeight}})} 3000w,
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
