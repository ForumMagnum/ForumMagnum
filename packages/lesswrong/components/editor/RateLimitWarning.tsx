import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import moment from 'moment';
import { isEAForum } from '../../lib/instanceSettings';

// Tells the user when they can next comment or post if they're rate limited, and a brief explanation
const RateLimitWarning = ({lastRateLimitExpiry, rateLimitMessage}: {
  lastRateLimitExpiry?: Date|null,
  rateLimitMessage?: string|null
}) => {
  // Sorry this is not great. Basically, I wanted to keep the previous functionality for the default case
  // (which shows how long you have until you can comment again), and then on the EA Forum, show the
  // particular copy that our product team wants. In the future we probably want to pass in the reason
  // that the user is currently rate-limited, to display the appropriate message.
  if (!isEAForum && !lastRateLimitExpiry) return null

  const diffInMin = moment(lastRateLimitExpiry).diff(moment(), 'minutes')
  const fromNow = moment(lastRateLimitExpiry).fromNow()
  const eaForumMessage = `You've written more than 3 comments in the last 30 min. Please wait ${diffInMin} min before commenting again. You'll be able to post more comments as your karma increases.`
  const defaultMessage = `Please wait ${fromNow} before commenting again. ${rateLimitMessage ?? ''}`
  const message = isEAForum ? eaForumMessage : defaultMessage
    
  return <Components.WarningBanner message={message} />
}

const RateLimitWarningComponent = registerComponent('RateLimitWarning', RateLimitWarning);

declare global {
  interface ComponentTypes {
    RateLimitWarning: typeof RateLimitWarningComponent
  }
}
