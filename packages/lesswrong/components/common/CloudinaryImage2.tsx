import { registerComponent, getSetting } from 'meteor/vulcan:core';
import React from 'react';
import { SECTION_WIDTH } from './SingleColumnSection';

function cloudinaryPropsToStr(props) {
  let sb: string[] = [];
  for(let k in props)
    sb.push(`${k}_${props[k]}`);
  return sb.join(",");
}

// TODO; docstring
const CloudinaryImage2 = ({width, height, objectFit, publicId}: {
  width?: number,
  height?: number,
  objectFit?: string,
  publicId: string,
}) => {
  const cloudinaryCloudName = getSetting('cloudinary.cloudName', 'lesswrong-2-0')

  let cloudinaryProps: any = {
    c: "fill",
    dpr: "auto",
    g: "custom",
    q: "auto",
  };
  let imageStyle: any = {};

  if (width) {
    cloudinaryProps.w = SECTION_WIDTH; // TODO; no
    imageStyle.width = '100%'
  }
  if (height) {
    cloudinaryProps.h = height;
    imageStyle.height = height+"px";
  }
  if (objectFit) {
    imageStyle.objectFit = objectFit
  }

  const imageUrl = `http://res.cloudinary.com/${cloudinaryCloudName}/image/upload/${cloudinaryPropsToStr(cloudinaryProps)}/${publicId}`;

  return <img
    src={imageUrl}
    style={imageStyle}
  />
};

registerComponent('CloudinaryImage2', CloudinaryImage2);
