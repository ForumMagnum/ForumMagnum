import React, { useRef, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { AnalyticsContext, useTracking } from '../../lib/analyticsEvents';
import { useMessages } from '../common/withMessages';
import { useCurrentUser } from '../common/withUser';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { getBrowserLocalStorage } from '../editor/localStorageHandlers';
import { userHasEmailAddress } from '../../lib/collections/users/helpers';
import TextField from '@material-ui/core/TextField';
import { eaForumDigestSubscribeURL } from '../recentDiscussion/RecentDiscussionSubscribeReminder';
import { Link } from '../../lib/reactRouterWrapper';
import classNames from 'classnames';
import { hasDigests } from '../../lib/betas';

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
    display: 'flex',
    alignItems: 'baseline',
    columnGap: 8,
    rowGap: '12px'
  },
  formInput: {
    flexGrow: 1,
    background: theme.palette.grey[0],
    borderRadius: theme.borderRadius.default,
    '& .MuiInputLabel-outlined': {
      transform: 'translate(14px,12px) scale(1)',
      '&.MuiInputLabel-shrink': {
        transform: 'translate(14px,-6px) scale(0.75)',
      }
    },
    '& .MuiNotchedOutline-root': {
      borderRadius: theme.borderRadius.default,
    },
    '& .MuiOutlinedInput-input': {
      padding: 11
    }
  },
  formBtnWideScreen: {
    '@media(max-width: 1450px)': {
      display: 'none'
    }
  },
  formBtnNarrowScreen: {
    display: 'none',
    '@media(max-width: 1450px)': {
      display: 'inline'
    }
  },
  formBtnArrow: {
    transform: 'translateY(3px)',
    fontSize: 16
  },
  success: {
    display: 'flex',
    alignItems: 'center',
    columnGap: 10,
    fontSize: 13,
    lineHeight: '19px',
    color: theme.palette.grey[800],
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
 * It has some overlap with the Forum Digest ad that appears in "Recent discussion".
 * In particular, both components use currentUser.hideSubscribePoke,
 * so for logged in users, hiding one ad hides the other.
 *
 * See RecentDiscussionSubscribeReminder.tsx for the other component.
 */
const DigestAd = ({className, classes}: {
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser()
  const updateCurrentUser = useUpdateCurrentUser()
  const emailRef = useRef<HTMLInputElement|null>(null)
  const ls = getBrowserLocalStorage()
  const [isHidden, setIsHidden] = useState(
    // logged out user clicked the X in this ad, or previously submitted the form
    (!currentUser && ls?.getItem('hideHomeDigestAd')) ||
    // user is already subscribed
    currentUser?.subscribedToDigest ||
    // user is logged in and clicked the X in this ad, or "Don't ask again" in the ad in "Recent discussion"
    currentUser?.hideSubscribePoke
  )
  const [loading, setLoading] = useState(false)
  const [subscribeClicked, setSubscribeClicked] = useState(false)
  const { flash } = useMessages()
  const { captureEvent } = useTracking()
  
  // Only show this on sites that have a digest
  if (!hasDigests) return null
  
  // This should never happen, but just exit if it does.
  if (!currentUser && !ls) return null
  
  // If the user just submitted the form, make sure not to hide it, so that it properly finishes submitting.
  // Alternatively, if the logged in user just clicked "Subscribe", show the success text rather than hiding this.
  if (isHidden && !subscribeClicked) return null
  
  // If the user is logged in and has an email address, we show their email address and the "Subscribe" button.
  // Otherwise, we show the form with the email address input.
  const showForm = !currentUser || !userHasEmailAddress(currentUser)
  
  const handleClose = () => {
    setIsHidden(true)
    captureEvent("digestAdClosed")
    if (currentUser) {
      void updateCurrentUser({hideSubscribePoke: true})
    } else {
      ls.setItem('hideHomeDigestAd', true)
    }
  }
  
  const handleUserSubscribe = async () => {
    setLoading(true)
    setSubscribeClicked(true)
    captureEvent("digestAdSubscribed")
    
    if (currentUser) {
      try {
        await updateCurrentUser({
          subscribedToDigest: true,
          unsubscribeFromAll: false
        })
      } catch(e) {
        flash('There was a problem subscribing you to the digest. Please try again later.')
      }
    }
    if (showForm && emailRef.current?.value) {
      ls.setItem('hideHomeDigestAd', true)
    }
    
    setLoading(false)
  }
  
  const { ForumIcon, EAButton } = Components
  
  const buttonProps = loading ? {disabled: true} : {}
  // button either says "Subscribe" or has a right arrow depending on the screen width
  const buttonContents = <>
    <span className={classes.formBtnWideScreen}>Subscribe</span>
    <span className={classes.formBtnNarrowScreen}>
      <ForumIcon icon="ArrowRight" className={classes.formBtnArrow} />
    </span>
  </>
  
  // Show the form to submit to Mailchimp directly,
  // or display the logged in user's email address and the Subscribe button
  let formNode = showForm ? (
    <form action={eaForumDigestSubscribeURL} method="post" className={classes.form}>
      <TextField
        inputRef={emailRef}
        variant="outlined"
        label="Email address"
        placeholder="example@email.com"
        name="EMAIL"
        required
        className={classes.formInput}
      />
      <EAButton type="submit" onClick={handleUserSubscribe} {...buttonProps}>
        {buttonContents}
      </EAButton>
    </form>
  ) : (
    <div className={classes.form}>
      <TextField
        variant="outlined"
        value={currentUser.email}
        className={classes.formInput}
        disabled={true}
      />
      <EAButton onClick={handleUserSubscribe} {...buttonProps}>
        {buttonContents}
      </EAButton>
    </div>
  )
  
  // If a logged in user with an email address subscribes, show the success message.
  if (!showForm && subscribeClicked) {
    formNode = <div className={classes.success}>
      <ForumIcon icon="CheckCircle" className={classes.successCheckIcon} />
      <div>
        Thanks for subscribing! You can edit your subscription via
        your <Link to={'/account?highlightField=subscribedToDigest'} className={classes.successLink}>
          account settings
        </Link>.
      </div>
    </div>
  }
  
  return <AnalyticsContext pageSubSectionContext="digestAd">
    <div className={classNames(classes.root, className)}>
      <div className={classes.headingRow}>
        <h2 className={classes.heading}>Get the best posts in your email</h2>
        <ForumIcon icon="Close" className={classes.close} onClick={handleClose} />
      </div>
      <div className={classes.body}>
        Sign up for the EA Forum Digest to get curated recommendations every week
      </div>
      {formNode}
    </div>
  </AnalyticsContext>
}

const DigestAdComponent = registerComponent("DigestAd", DigestAd, {styles});

declare global {
  interface ComponentTypes {
    DigestAd: typeof DigestAdComponent
  }
}
