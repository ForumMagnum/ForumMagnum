import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { AnalyticsContext } from '../../../lib/analyticsEvents';
import { useCurrentUser } from '../../common/withUser';
import { eaForumDigestSubscribeURL } from '../../recentDiscussion/RecentDiscussionSubscribeReminder';
import { Link } from '../../../lib/reactRouterWrapper';
import classNames from 'classnames';
import { useDigestAd } from './useDigestAd';
import { DIGEST_AD_BODY_TEXT, DIGEST_AD_HEADLINE_TEXT } from './SidebarDigestAd';
import { getBrowserLocalStorage } from '../../editor/localStorageHandlers';

const styles = (theme: ThemeType) => ({
  '@keyframes digest-fade-in': {
    '0%': {
      opacity: 0,
    },
    '100%': {
      opacity: 1,
    }
  },
  root: {
    animation: 'digest-fade-in 1s ease',
    position: 'fixed',
    bottom: 28,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 880,
    maxWidth: '85%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 20,
    backgroundColor: theme.palette.grey[900],
    color: theme.palette.grey[0],
    fontSize: 13,
    fontWeight: 450,
    fontFamily: theme.typography.fontFamily,
    padding: '16px 20px',
    borderRadius: theme.borderRadius.default,
    zIndex: theme.zIndexes.intercomButton,
    // Once the contents start to wrap, we instead force a smaller width,
    // so that the form doesn't get too wide
    '@media (max-width: 1000px)': {
      display: 'block',
      width: 500,
      maxWidth: '90%',
    },
  },
  textCol: {
    flexGrow: 1,
  },
  heading: {
    fontWeight: 600,
    fontSize: 19,
    margin: '0 0 4px',
    [theme.breakpoints.down('sm')]: {
      fontSize: 18,
    }
  },
  body: {
    fontSize: 14,
    lineHeight: '20px',
    fontWeight: 500,
    color: theme.palette.grey[400],
    textWrap: 'pretty',
    marginBottom: 0,
    '@media (max-width: 1000px)': {
      fontSize: 13,
      marginBottom: 12,
    },
  },
  form: {
    flexGrow: 1,
    display: 'flex',
    columnGap: 4,
    rowGap: '8px',
    flexWrap: 'wrap',
  },
  formInput: {
    minWidth: 240,
    flex: '1 1 0',
    fontSize: 14,
    background: theme.palette.text.alwaysWhite,
    color: theme.palette.text.alwaysBlack,
    padding: 12,
    borderRadius: theme.borderRadius.default,
    border: theme.palette.border.grey800,
    '&:focus': {
      border: `1px solid ${theme.palette.primary.main}`,
      color: theme.palette.text.alwaysBlack,
    },
    '&::placeholder': {
      color: theme.palette.grey[600],
    },
  },
  formBtns: {
    display: 'flex',
    columnGap: 4,
  },
  formBtn: {
    flex: 'none',
  },
  noThanksBtn: {
    background: theme.palette.buttons.digestAdBannerNoThanks.background,
    color: theme.palette.grey[0],
    '&:hover': {
      background: theme.palette.buttons.digestAdBannerNoThanks.hoverBackground,
    },
  },
  success: {
    display: 'flex',
    alignItems: 'center',
    columnGap: 10,
    fontSize: 13,
    lineHeight: '19px',
    color: theme.palette.grey[400],
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
 * This is the Forum Digest ad that appears fixed to the bottom of the screen on the EA Forum post page.
 */
const StickyDigestAd = ({className, classes}: {
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser()
  const { showDigestAd, emailRef, showForm, loading, subscribeClicked, handleClose, handleUserSubscribe } = useDigestAd()
  const ls = getBrowserLocalStorage()
  
  const postReadCount = parseInt(ls?.getItem('postReadCount') ?? '0')
  // We only show this after the client has viewed a few posts.
  if (!showDigestAd || postReadCount < 10) return null
  
  const { AnalyticsInViewTracker, ForumIcon, EAButton } = Components
  
  const buttonProps = loading ? {disabled: true} : {}
  const noThanksBtn = (
    <EAButton
      onClick={handleClose}
      className={classNames(classes.formBtn, classes.noThanksBtn)}
      {...buttonProps}
    >
      No thanks
    </EAButton>
  )
  
  // Show the form to submit to Mailchimp directly,
  // or display the logged in user's email address and the "Sign up" button
  let formNode = (showForm || !currentUser) ? (
    <form action={eaForumDigestSubscribeURL} method="post" className={classes.form}>
      <input ref={emailRef} name="EMAIL" placeholder="Email address" className={classes.formInput} required={true} />
      <div className={classes.formBtns}>
        <EAButton type="submit" onClick={handleUserSubscribe} className={classes.formBtn} {...buttonProps}>
          Sign up
        </EAButton>
        {noThanksBtn}
      </div>
    </form>
  ) : (
    <div className={classes.form}>
      <input value={currentUser.email ?? undefined} className={classes.formInput} disabled={true} required={true} />
      <div className={classes.formBtns}>
        <EAButton onClick={handleUserSubscribe} className={classes.formBtn} {...buttonProps}>
          Sign up
        </EAButton>
        {noThanksBtn}
      </div>
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
    <AnalyticsInViewTracker eventProps={{inViewType: "stickyDigestAd"}}>
      <div className={classNames(classes.root, className)}>
        <div className={classes.textCol}>
          <h2 className={classes.heading}>{DIGEST_AD_HEADLINE_TEXT}</h2>
          <div className={classNames(classes.body)}>
            {DIGEST_AD_BODY_TEXT}
          </div>
        </div>
        {formNode}
      </div>
    </AnalyticsInViewTracker>
  </AnalyticsContext>
}

const StickyDigestAdComponent = registerComponent("StickyDigestAd", StickyDigestAd, {styles, stylePriority: -1});

declare global {
  interface ComponentTypes {
    StickyDigestAd: typeof StickyDigestAdComponent
  }
}
