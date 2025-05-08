import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { Link } from '../../lib/reactRouterWrapper';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { spamRiskScoreThreshold } from '@/lib/collections/users/helpers';

const styles = (theme: ThemeType) => ({
  warningText: {
    margin: 10,
    padding: 20,
    border: theme.palette.border.slightlyIntense,
    ...theme.typography.body2
  },
  link: {
    color: theme.palette.primary.light
  }
})

const RecaptchaWarningInner = ({ currentUser, classes, children }: {
  currentUser: UsersCurrent | null,
  classes: any,
  children: React.ReactNode
}) => {
  if (!currentUser?.spamRiskScore || (currentUser.spamRiskScore > spamRiskScoreThreshold)) {
    return <> { children } </>
  }
  switch (forumTypeSetting.get()) {
    case 'AlignmentForum':
    case 'LessWrong':
      return <div className={classes.warningText}>
        You've been flagged by our spam detection system. Please message an admin via
        Intercom (the chat bubble in the bottom right corner) or send a private message to admin
        <Link className={classes.link} to="/users/habryka4"> habryka</Link> to activate posting- and commenting-privileges on your account.
      </div>
    default:
      return <div className={classes.warningText}>
        You've been flagged by our spam detection system. Please{' '}
        <Link className={classes.link} to="/contact">contact us</Link> to activate posting and commenting privileges on your account.
      </div>
  }
}


export const RecaptchaWarning = registerComponent('RecaptchaWarning', RecaptchaWarningInner, { styles }) 

declare global {
  interface ComponentTypes {
    RecaptchaWarning: typeof RecaptchaWarning
  }
}
