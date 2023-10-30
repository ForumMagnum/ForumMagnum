import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import moment from 'moment';
import { isEAForum } from '../../lib/instanceSettings';
import AlarmIcon from '@material-ui/icons/Alarm';
import { interpolateRateLimitMessage, timeFromNowInWords } from '../../lib/rateLimits/utils';

const styles = (theme: ThemeType): JssStyles => ({
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
const RateLimitWarning = ({lastRateLimitExpiry, rateLimitMessage, classes}: {
  lastRateLimitExpiry: Date,
  rateLimitMessage?: string,
  classes: ClassesType
}) => {
  const { ContentStyles, ContentItemBody } = Components

  const message = interpolateRateLimitMessage(rateLimitMessage ?? '', timeFromNowInWords(lastRateLimitExpiry));

  if (isEAForum) {
    return <Components.WarningBanner message={message}/>
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
