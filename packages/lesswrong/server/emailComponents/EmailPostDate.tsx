import React from 'react';
import { Components } from '../../lib/vulcan-lib/components';
import { useTimezone } from '../../components/common/withTimezone';
import { EmailFormatDate } from './EmailFormatDate';

export const EmailPostDate = ({post}: {
  post: PostsBase
}) => {
  const { timezone, timezoneIsKnown } = useTimezone()
  
  const { PrettyEventDateTime } = Components;
  
  if (post.isEvent) {
    return <span><PrettyEventDateTime post={post} timezone={timezoneIsKnown ? timezone : undefined} /></span>
  } else if (post.curatedDate) {
    return <EmailFormatDate date={post.curatedDate}/>
  } else {
    return <EmailFormatDate date={post.postedAt}/>
  }
}
