import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { prettyEventDateTimes } from '../../lib/collections/posts/helpers';

const EmailPostDate = ({post}: {
  post: PostsBase
}) => {
  const { EmailFormatDate } = Components;
  
  if (post.isEvent) {
    return <span>{prettyEventDateTimes(post)}</span>
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
