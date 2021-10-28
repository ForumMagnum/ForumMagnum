import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import moment from '../../lib/moment-timezone';

const eventTimeFormat = "Do MMMM YYYY h:mm A"
const eventTimeUTCFormat = "Do MMMM YYYY h:mm A [UTC]ZZ"

const EmailPostDate = ({post}: {
  post: PostsBase
}) => {
  const { EmailFormatDate } = Components;
  
  if (post.isEvent) {
    if (post.startTime) {
      return post.localStartTime ? (
        <span>Starts at {moment(post.localStartTime).utc().format(eventTimeFormat)}</span>
      ) : (
        <span>Starts at {moment(post.startTime).format(eventTimeUTCFormat)}</span>
      )
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
