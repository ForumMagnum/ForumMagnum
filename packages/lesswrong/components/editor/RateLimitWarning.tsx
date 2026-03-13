import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import moment from 'moment';
import AlarmIcon from '@/lib/vendor/@material-ui/icons/src/Alarm';
import { isFriendlyUI } from '../../themes/forumTheme';
import WarningBanner from "../common/WarningBanner";
import ContentStyles from "../common/ContentStyles";
import { ContentItemBody } from "../contents/ContentItemBody";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('RateLimitWarning', (theme: ThemeType) => ({
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
}));

// Tells the user when they can next comment or post if they're rate limited, and a brief explanation
const RateLimitWarning = ({contentType, lastRateLimitExpiry, rateLimitMessage}: {
  contentType: 'comment' | 'post',
  lastRateLimitExpiry: Date,
  rateLimitMessage?: string,
}) => {
  const classes = useStyles(styles);
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
  return <ContentStyles contentType="comment" className={classes.lwBanner}>
    <AlarmIcon className={classes.icon} />
    <ContentItemBody dangerouslySetInnerHTML={{__html: message }}/>
  </ContentStyles>
}

export default RateLimitWarning;


