import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import React from 'react';

function cloudinaryPropsToStr(props) {
  let sb = [];
  for(let k in props)
    sb.push(k+'_'+props[k]);
  return sb.join(",");
}

const CloudinaryImage = (props, context) => {
  const cloudinaryCloudName = getSetting('cloudinary.cloudName', 'lesswrong-2-0')
  
  let cloudinaryProps = {
    c: "fill",
    dpr: "auto",
    g: "custom",
    q: "auto",
  };
  
  let sizeProps = {};
  if(props.width) {
    cloudinaryProps.w = props.width;
    if(parseInt(props.width))
      sizeProps.width = props.width+"px";
  }
  if(props.height) {
    cloudinaryProps.h = props.height;
    if(parseInt(props.height))
      sizeProps.height = props.height+"px";
  }
  
  const imageUrl = `http://res.cloudinary.com/${cloudinaryCloudName}/image/upload/${cloudinaryPropsToStr(cloudinaryProps)}/${props.publicId}`;
  
  return <img
    sizes="100vw"
    src={imageUrl}
    {...sizeProps}
  />
};

registerComponent('CloudinaryImage', CloudinaryImage);