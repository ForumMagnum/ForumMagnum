import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import moment from 'moment';
import { isEAForum } from '../../lib/instanceSettings';
import { RateLimitType } from '../../server/callbacks/rateLimits';

// Tells the user when they can next comment or post if they're rate limited, and a brief explanation
const RateLimitWarning = ({lastRateLimitExpiry, rateLimitMessage, rateLimitType}: {
  lastRateLimitExpiry: Date,
  rateLimitMessage?: string,
  rateLimitType?: RateLimitType
}) => {
  // default message tells the user how long they have to wait
  const fromNow = moment(lastRateLimitExpiry).fromNow()
  let message = `Please wait ${fromNow} before commenting again. ${rateLimitMessage ?? ''}`

  if (isEAForum) {
    const diffInMin = moment(lastRateLimitExpiry).diff(moment(), 'minutes')
    const reason = rateLimitType === 'lowKarma' ? " You'll be able to post more comments as your karma increases." : ""
    message = `You've written more than 3 comments in the last 30 min. Please wait ${diffInMin} min before commenting again.${reason}`
  }

  return <Components.WarningBanner message={message} />
}

const RateLimitWarningComponent = registerComponent('RateLimitWarning', RateLimitWarning);

declare global {
  interface ComponentTypes {
    RateLimitWarning: typeof RateLimitWarningComponent
  }
}
