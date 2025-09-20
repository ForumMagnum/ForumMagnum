import React from 'react';
import { EmailFormatDate } from './EmailFormatDate';
import PrettyEventDateTime from '@/components/events/modules/PrettyEventDateTime';
import { maybeDate } from '@/lib/utils/dateUtils';
import { EmailContextType } from './emailContext';
import { useEmailRecipientTimezone } from './useEmailRecipientTimezone';

export const EmailPostDate = ({post, emailContext}: {
  post: PostsBase
  emailContext: EmailContextType
}) => {
  const { timezone, timezoneIsKnown } = useEmailRecipientTimezone(emailContext)
  
  if (post.isEvent) {
    return <span><PrettyEventDateTime post={post} timezone={timezoneIsKnown ? timezone : undefined} /></span>
  } else if (post.curatedDate) {
    return <EmailFormatDate date={maybeDate(post.curatedDate)}/>
  } else {
    return <EmailFormatDate date={maybeDate(post.postedAt)}/>
  }
}
