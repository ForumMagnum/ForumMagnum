import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import moment from '../../lib/moment-timezone';

const eventTimeFormat = "Do MMMM YYYY h:mm A"

const EmailPostDate = ({post}) => {
  const { EmailFormatDate } = Components;
  
  if (post.isEvent) {
    if (post.startTime) {
      return <span>Starts at {moment(post.localStartTime).utc().format(eventTimeFormat)}</span>
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
