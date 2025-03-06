import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import moment from 'moment';
import AlarmIcon from '@material-ui/icons/Alarm';
import { isFriendlyUI } from '../../themes/forumTheme';
import { ContentStyles } from "@/components/common/ContentStyles";
import ContentItemBody from "@/components/common/ContentItemBody";
import WarningBanner from "@/components/common/WarningBanner";

const styles = (theme: ThemeType) => ({
  lwBanner: {
    padding: 12,
    backgroundColor: theme.palette.background.warningTranslucent,
    display: "flex",
    alignItems: "center",
    '& p': {
      marginBottom: 6,
    }
  },
  icon: {
    marginLeft: 8,
    marginRight: 16,
    height: 24,
    color: theme.palette.grey[500]
  }
});

// Tells the user when they can next comment or post if they're rate limited, and a brief explanation
const RateLimitWarning = ({contentType, lastRateLimitExpiry, rateLimitMessage, classes}: {
  contentType: 'comment' | 'post',
  lastRateLimitExpiry: Date,
  rateLimitMessage?: string,
  classes: ClassesType<typeof styles>
}) => {
  const getTimeUntilNextPost = () => {
    const lastExpiry = moment(lastRateLimitExpiry)
    const now = moment()
    const diffInSeconds = lastExpiry.diff(now, 'seconds')
    const diffInMin = lastExpiry.diff(now, 'minutes')
    const diffInHours = lastExpiry.diff(now, 'hours')
    const diffInDays = lastExpiry.diff(now, 'days')
    const diffInWeeks =lastExpiry.diff(now, 'weeks')
    if (diffInSeconds < 60) {
      return `${diffInSeconds} second${diffInSeconds > 1 ? 's' : ''}`
    }
    if (diffInMin < 60) {
      return `${diffInMin} minute${diffInMin > 1 ? 's' : ''}`
    }
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''}`
    }
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''}`
    }
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''}`
  }

  let message = `<p>You can submit again in ${getTimeUntilNextPost()}.</p> ${rateLimitMessage ?? ''}`
  if (isFriendlyUI) {
    message = `Please wait ${getTimeUntilNextPost()} before ${contentType === 'comment' ? 'commenting' : 'posting'} again. ${rateLimitMessage ?? ''}`
  }

  if (isFriendlyUI) {
    return <WarningBanner message={message}/>
  } else {
    return <ContentStyles contentType="comment" className={classes.lwBanner}>
      <AlarmIcon className={classes.icon} />
      <ContentItemBody dangerouslySetInnerHTML={{__html: message }}/>
    </ContentStyles>
  }
}

const RateLimitWarningComponent = registerComponent('RateLimitWarning', RateLimitWarning, {styles});

declare global {
  interface ComponentTypes {
    RateLimitWarning: typeof RateLimitWarningComponent
  }
}

export default RateLimitWarningComponent;
