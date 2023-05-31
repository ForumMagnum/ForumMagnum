import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import moment from 'moment';
import { isEAForum } from '../../lib/instanceSettings';

// Tells the user when they can next comment or post if they're rate limited, and a brief explanation
const RateLimitWarning = ({lastRateLimitExpiry, rateLimitMessage}: {
  lastRateLimitExpiry: Date,
  rateLimitMessage?: string
}) => {

  const getTimeUntilNextPost = () => {
    const diffInSeconds = moment(lastRateLimitExpiry).diff(moment(), 'seconds')
    const diffInMin = moment(lastRateLimitExpiry).diff(moment(), 'minutes')
    const diffInHours = moment(lastRateLimitExpiry).diff(moment(), 'hours')
    const diffInDays = moment(lastRateLimitExpiry).diff(moment(), 'days')
    const diffInWeeks = moment(lastRateLimitExpiry).diff(moment(), 'weeks')
    if (diffInSeconds < 60) {
      return `${diffInSeconds} second${diffInSeconds > 1 ? 's' : ''}`
    }
    if (diffInMin < 60) {
      return `${diffInMin} minute${diffInMin > 1 ? 's' : ''}}`
    }
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''}`
    }
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''}`
    }
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''}`
  }

  let message = `Please wait ${getTimeUntilNextPost()} before posting again. ${rateLimitMessage ?? ''}`
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
