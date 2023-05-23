import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import moment from 'moment';
import { isEAForum } from '../../lib/instanceSettings';

// Tells the user when they can next comment or post if they're rate limited, and a brief explanation
const RateLimitWarning = ({lastRateLimitExpiry, rateLimitMessage}: {
  lastRateLimitExpiry: Date,
  rateLimitMessage?: string
}) => {

  // "fromNow" makes for a more human readable "how long till I can comment/post?".
  // moment.relativeTimeThreshold ensures that it doesn't appreviate unhelpfully to "now"
  moment.relativeTimeThreshold('ss', 0);
  const fromNow = moment(lastRateLimitExpiry).fromNow()

  let message = `Please wait ${fromNow} before posting again. ${rateLimitMessage ?? ''}`
  if (isEAForum) {
    const diffInMin = moment(lastRateLimitExpiry).diff(moment(), 'minutes')
    message = `You've written more than 3 comments in the last 30 min. Please wait ${diffInMin} min before commenting again. ${rateLimitMessage ?? ''}`
  }

  return <Components.WarningBanner message={message} />
}

const RateLimitWarningComponent = registerComponent('RateLimitWarning', RateLimitWarning);

declare global {
  interface ComponentTypes {
    RateLimitWarning: typeof RateLimitWarningComponent
  }
}
