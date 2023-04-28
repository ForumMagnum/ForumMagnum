import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import moment from 'moment';
import { isEAForum } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: 'flex',
    justifyContent: 'space-between',
    columnGap: 8,
    fontFamily: theme.typography.commentStyle.fontFamily,
    color: theme.palette.text.warning,
    fontSize: 14,
    lineHeight: '18px',
    fontWeight: '500',
    padding: '10px 8px',
    borderRadius: 4,
    backgroundColor: theme.palette.background.warningTranslucent,
    marginBottom: 8,
  },
  icon: {
    transform: "translateY(1px)",
    fontSize: 16,
  },
  message: {
    flexGrow: 1
  }
});

const RateLimitWarning = ({lastRateLimitExpiry, classes}: {
  lastRateLimitExpiry?: Date|null,
  classes: ClassesType,
}) => {
  // Sorry this is not great. Basically, I wanted to keep the previous functionality for the default case
  // (which shows how long you have until you can comment again), and then on the EA Forum, show the
  // particular copy that our product team wants. In the future we probably want to pass in the reason
  // that the user is currently rate-limited, to display the appropriate message.
  if (!isEAForum && !lastRateLimitExpiry) return null

  const time = moment(lastRateLimitExpiry).fromNow()
  const message = isEAForum ?
    `You've written more than 3 comments in the last 30 min. Please wait ${time} before commenting again. You'll be able to post more comments as your karma increases.` :
    `Please wait ${time} before commenting again.`
  
  return <div className={classes.root}>
    <Components.ForumIcon icon="Warning" className={classes.icon} />
    <div className={classes.message}>
      {message}
    </div>
  </div>
}

const RateLimitWarningComponent = registerComponent('RateLimitWarning', RateLimitWarning, {styles});

declare global {
  interface ComponentTypes {
    RateLimitWarning: typeof RateLimitWarningComponent
  }
}
