import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { isLWorAF } from '../../lib/instanceSettings';
import { spamRiskScoreThreshold } from '@/lib/collections/users/helpers';
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles("RecaptchaWarning", (theme: ThemeType) => ({
  warningText: {
    margin: 10,
    padding: 20,
    border: theme.palette.border.slightlyIntense,
    ...theme.typography.body2
  },
  link: {
    color: theme.palette.primary.light
  }
}))

const RecaptchaWarning = ({ currentUser, children }: {
  currentUser: UsersCurrent | null,
  children: React.ReactNode
}) => {
  if (!currentUser?.spamRiskScore || (currentUser.spamRiskScore > spamRiskScoreThreshold)) {
    return <> { children } </>
  }
  return <RecaptchaWarningInner/>
}

const RecaptchaWarningInner = () => {
  const classes = useStyles(styles);
  if (isLWorAF()) {
    return <div className={classes.warningText}>
      You've been flagged by our spam detection system. Please message an admin via
      Intercom (the chat bubble in the bottom right corner) or send a private message to admin
      <Link className={classes.link} to="/users/habryka4"> habryka</Link> to activate posting- and commenting-privileges on your account.
    </div>
  }

  return <div className={classes.warningText}>
    You've been flagged by our spam detection system. Please{' '}
    <Link className={classes.link} to="/contact">contact us</Link> to activate posting and commenting privileges on your account.
  </div>
}


export default RecaptchaWarning;


