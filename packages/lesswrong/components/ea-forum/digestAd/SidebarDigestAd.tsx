import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { AnalyticsContext } from '../../../lib/analyticsEvents';
import { useCurrentUser } from '../../common/withUser';
import { eaForumDigestSubscribeURL } from '../../recentDiscussion/RecentDiscussionSubscribeReminder';
import { Link } from '../../../lib/reactRouterWrapper';
import classNames from 'classnames';
import { useDigestAd } from './useDigestAd';

export const DIGEST_AD_HEADLINE_TEXT = 'Sign up for the weekly EA Forum Digest'
export const DIGEST_AD_BODY_TEXT = 'A curated reading list of Forum posts, every Wednesday'

const styles = (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.grey[200],
    fontSize: 13,
    fontWeight: 450,
    fontFamily: theme.typography.fontFamily,
    padding: '12px 16px',
    borderRadius: theme.borderRadius.default,
  },
  headingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    columnGap: 8,
    marginBottom: 12
  },
  heading: {
    fontWeight: 600,
    fontSize: 16,
    margin: 0
  },
  close: {
    height: 16,
    width: 16,
    color: theme.palette.grey[600],
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.grey[800],
    }
  },
  body: {
    fontSize: 13,
    lineHeight: '19px',
    fontWeight: 500,
    color: theme.palette.grey[600],
    textWrap: 'pretty',
    marginBottom: 15
  },
  form: {
    flexGrow: 1,
    display: 'flex',
    columnGap: 8,
    rowGap: '12px'
  },
  formInput: {
    minWidth: 0,
    flex: '1 1 0',
    background: theme.palette.grey[0],
    padding: 11,
    borderRadius: theme.borderRadius.default,
    border: theme.palette.border.normal,
    '&:hover': {
      border: theme.palette.border.slightlyIntense2,
    },
    '&:focus': {
      border: `1px solid ${theme.palette.primary.main}`,
    }
  },
  formBtn: {
    flex: 'none',
  },
  formBtnArrow: {
    fontSize: 15
  },
  success: {
    display: 'flex',
    alignItems: 'center',
    columnGap: 10,
    fontSize: 13,
    lineHeight: '19px',
    color: theme.palette.grey[800],
    textWrap: 'pretty',
  },
  successCheckIcon: {
    color: theme.palette.icon.greenCheckmark
  },
  successLink: {
    color: theme.palette.primary.main
  },
});

/**
 * This is the Forum Digest ad that appears at the top of the EA Forum home page right hand side.
 */
const SidebarDigestAd = ({className, classes}: {
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser()
  const { showDigestAd, emailRef, showForm, loading, subscribeClicked, handleClose, handleUserSubscribe } = useDigestAd()
  
  if (!showDigestAd) return null
  
  const { AnalyticsInViewTracker, ForumIcon, EAButton } = Components
  
  const buttonProps = loading ? {disabled: true} : {}
  const arrow = <ForumIcon icon="ArrowRight" className={classes.formBtnArrow} />
  
  // Show the form to submit to Mailchimp directly,
  // or display the logged in user's email address and the arrow button
  let formNode = (showForm || !currentUser) ? (
    <form action={eaForumDigestSubscribeURL} method="post" className={classes.form}>
      <input ref={emailRef} name="EMAIL" placeholder="Email address" className={classes.formInput} required={true} />
      <EAButton type="submit" onClick={handleUserSubscribe} className={classes.formBtn} {...buttonProps}>
        {arrow}
      </EAButton>
    </form>
  ) : (
    <div className={classes.form}>
      <input value={currentUser.email} className={classes.formInput} disabled={true} required={true} />
      <EAButton onClick={handleUserSubscribe} className={classes.formBtn} {...buttonProps}>
        {arrow}
      </EAButton>
    </div>
  )
  
  // If a logged in user with an email address subscribes, show the success message.
  if (!showForm && subscribeClicked) {
    formNode = <div className={classes.success}>
      <ForumIcon icon="CheckCircle" className={classes.successCheckIcon} />
      <div>
        Thanks for signing up! You can edit your subscription via
        your <Link to={'/account?highlightField=subscribedToDigest'} className={classes.successLink}>
          account settings
        </Link>.
      </div>
    </div>
  }
  
  return <AnalyticsContext pageSubSectionContext="digestAd">
    <AnalyticsInViewTracker eventProps={{inViewType: "sidebarDigestAd"}}>
      <div className={classNames(classes.root, className)}>
        <div className={classes.headingRow}>
          <h2 className={classes.heading}>{DIGEST_AD_HEADLINE_TEXT}</h2>
          <ForumIcon icon="Close" className={classes.close} onClick={handleClose} />
        </div>
        <div className={classes.body}>
          {DIGEST_AD_BODY_TEXT}
        </div>
        {formNode}
      </div>
    </AnalyticsInViewTracker>
  </AnalyticsContext>
}

const SidebarDigestAdComponent = registerComponent("SidebarDigestAd", SidebarDigestAd, {styles, stylePriority: -1});

declare global {
  interface ComponentTypes {
    SidebarDigestAd: typeof SidebarDigestAdComponent
  }
}
