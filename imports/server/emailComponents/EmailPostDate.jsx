import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';

const EmailPostDate = ({post}) => {
  const { EmailFormatDate } = Components;
  
  if (post.isEvent) {
    if (post.startTime) {
      return <span>Starts at <EmailFormatDate date={post.startTime}/></span>
    } else {
      return "TBD";
    }
  } else if (post.curatedDate) {
    return <EmailFormatDate date={post.curatedDate}/>
  } else {
    return <EmailFormatDate date={post.postedAt}/>
  }
}

registerComponent("EmailPostDate", EmailPostDate);
