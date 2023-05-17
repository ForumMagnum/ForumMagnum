import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import moment from 'moment';

// Tells the user when they can next comment or post if they're rate limited, and a brief explanation
const RateLimitWarning = ({lastRateLimitExpiry, rateLimitMessage}: {
  lastRateLimitExpiry: Date,
  rateLimitMessage?: string
}) => {
  // default message tells the user how long they have to wait
  const fromNow = moment(lastRateLimitExpiry).fromNow()
  let message = `Please wait ${fromNow} before posting again. ${rateLimitMessage ?? ''}`

  return <Components.WarningBanner message={message} />
}

const RateLimitWarningComponent = registerComponent('RateLimitWarning', RateLimitWarning);

declare global {
  interface ComponentTypes {
    RateLimitWarning: typeof RateLimitWarningComponent
  }
}
