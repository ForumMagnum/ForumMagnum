import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';


// ea-forum look here (you will want to set this to whatever is appropriate for you)
export const spamRiskScoreThreshold = 0.16 // Corresponds to recaptchaScore of 0.2

const styles = (theme: ThemeType): JssStyles => ({
  warningText: {
    margin: 10,
    padding: 20,
    border: '1px solid #ccc',
    ...theme.typography.body2
  },
  link: {
    color: theme.palette.primary.light
  }
})

const RecaptchaWarning = ({ currentUser, classes, children }: {
  currentUser: UsersCurrent | null,
  classes: any,
  children: React.ReactNode
}) => {
  if (!currentUser?.spamRiskScore || (currentUser.spamRiskScore > spamRiskScoreThreshold)) {
    return <> { children } </>
  }
  // ea-forum look here: You will want to change where this links to
  return <div className={classes.warningText}>
    You've been flagged by our spam detection system. Please message an admin via 
    Intercom (the chat bubble in the bottom right corner) or send a private message to admin 
    <Link className={classes.link} to="/users/habryka"> habryka</Link> to activate posting- and commenting-privileges on your account.
  </div>
}


const RecaptchaWarningComponent = registerComponent('RecaptchaWarning', RecaptchaWarning, { styles }) 

declare global {
  interface ComponentTypes {
    RecaptchaWarning: typeof RecaptchaWarningComponent
  }
}

