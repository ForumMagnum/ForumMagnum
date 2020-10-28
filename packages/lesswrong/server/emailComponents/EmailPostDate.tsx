import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import moment from '../../lib/moment-timezone';

const eventTimeFormat = "Do MMMM YYYY h:mm A"

const EmailPostDate = ({post}: {
  post: PostsBase
}) => {
  const { EmailFormatDate } = Components;
  
  if (post.isEvent) {
    if (post.startTime) {
      return <span>Starts at {moment(post.localStartTime).utc().format(eventTimeFormat)}</span>
    } else {
      return <span>TBD</span>;
    }
  } else if (post.curatedDate) {
    return <EmailFormatDate date={post.curatedDate}/>
  } else {
    return <EmailFormatDate date={post.postedAt}/>
  }
}

const EmailPostDateComponent = registerComponent("EmailPostDate", EmailPostDate);

declare global {
  interface ComponentTypes {
    EmailPostDate: typeof EmailPostDateComponent
  }
}
