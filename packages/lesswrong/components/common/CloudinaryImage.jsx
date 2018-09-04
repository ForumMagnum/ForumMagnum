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
  let imageStyle = {};
  
  if(props.width) {
    cloudinaryProps.w = props.width;
    imageStyle.width = props.width+"px";
  }
  if(props.height) {
    cloudinaryProps.h = props.height;
    imageStyle.height = props.height+"px";
  }
  
  const imageUrl = `http://res.cloudinary.com/${cloudinaryCloudName}/image/upload/${cloudinaryPropsToStr(cloudinaryProps)}/${props.publicId}`;
  
  return <img
    src={imageUrl}
    style={imageStyle}
  />
};

registerComponent('CloudinaryImage', CloudinaryImage);