import { useCallback, useRef, useState } from "react";
import { useCurrentUser } from "../../common/withUser";
import { useUpdateCurrentUser } from "../../hooks/useUpdateCurrentUser";
import { getBrowserLocalStorage } from "../../editor/localStorageHandlers";
import { useMessages } from "../../common/withMessages";
import { useTracking } from "../../../lib/analyticsEvents";
import { hasDigests } from "../../../lib/betas";
import { userHasEmailAddress } from "../../../lib/collections/users/helpers";

/**
 * Handles some shared logic around the EA Forum digest ad:
 * in particular, logged in vs logged out forms function differently.
 *
 * This has some functionality overlap with the Forum Digest ad that appears in "Recent discussion".
 * Specifically, both components use currentUser.hideSubscribePoke,
 * so for logged in users, hiding one ad hides the other.
 * See RecentDiscussionSubscribeReminder.tsx for the other component.
 */
export const useDigestAd = () => {
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
  
  // If the user is logged in and has an email address, we show their email address and the "Subscribe" button.
  // Otherwise, we show the form with the email address input.
  const showForm = !currentUser || !userHasEmailAddress(currentUser)
  
  /**
   * Close the digest ad, and make sure it doesn't appear again
   */
  const handleClose = useCallback(() => {
    setIsHidden(true)
    captureEvent("digestAdClosed")
    if (currentUser) {
      void updateCurrentUser({hideSubscribePoke: true})
    } else {
      ls?.setItem('hideHomeDigestAd', 'true')
    }
  }, [setIsHidden, captureEvent, currentUser, updateCurrentUser, ls])
  
  /**
   * When the user clicks the "Sign up" button,
   * if they are logged in, subscribe them to the digest,
   * and if they are logged out, set hideHomeDigestAd
   */
  const handleUserSubscribe = useCallback(async () => {
    setLoading(true)
    setSubscribeClicked(true)
    captureEvent("digestAdSubscribed")
    
    if (currentUser) {
      try {
        await updateCurrentUser({
          subscribedToDigest: true
        })
      } catch(e) {
        setSubscribeClicked(false)
        flash('There was a problem subscribing you to the digest. Please try again later.')
      }
    }
    if (showForm && emailRef.current?.value) {
      ls?.setItem('hideHomeDigestAd', 'true')
    }
    
    setLoading(false)
  }, [setLoading, setSubscribeClicked, captureEvent, currentUser, updateCurrentUser, flash, showForm, ls])

  // Only show this on sites that have a digest
  if (!hasDigests) {
    return {
      showDigestAd: false,
    }
  }
  // Make sure we only show it to logged out users if they have the ability to hide it
  if (!currentUser && !ls) {
    return {
      showDigestAd: false,
    }
  }
  // If the user just submitted the form, make sure not to hide it, so that it properly finishes submitting.
  // Alternatively, if the logged in user just clicked "Subscribe", show the success text rather than hiding this.
  if (isHidden && !subscribeClicked) {
    return {
      showDigestAd: false,
    }
  }

  return {
    showDigestAd: true,
    emailRef,
    showForm,
    loading,
    subscribeClicked,
    handleClose,
    handleUserSubscribe
  }
}
