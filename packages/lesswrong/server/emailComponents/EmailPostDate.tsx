import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useTimezone } from '../../components/common/withTimezone';

const EmailPostDate = ({post}: {
  post: PostsBase
}) => {
  const { timezone, timezoneIsKnown } = useTimezone()
  
  const { EmailFormatDate, PrettyEventDateTime } = Components;
  
  if (post.isEvent) {
    return <span><PrettyEventDateTime post={post} timezone={timezoneIsKnown ? timezone : undefined} /></span>
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
