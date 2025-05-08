import React, {ReactNode, useCallback, useEffect, useState} from 'react'
import { registerComponent } from '../../lib/vulcan-lib/components'
import {useCurrentUser} from '../common/withUser'
import {EAOnboardingContextProvider} from '../ea-forum/onboarding/useEAOnboarding'
import { BlurredBackgroundModal } from "../common/BlurredBackgroundModal";

const styles = (_theme: ThemeType) => ({
  root: {
    padding: 0,
  },
})

const OnboardingFlowInner = ({stages, viewAsAdmin, classes}: {
  stages: Record<string, ReactNode>,
  // if viewAsAdmin is true, this is an admin testing out the flow, so don't update their account
  viewAsAdmin?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser()

  // If `usernameUnset` is true, then we need to show the onboarding flow.
  // We cache the value in a `useState` as it gets set to false in the very
  // first stage (which is the only compulsary stage) - without caching the
  // value this would close the popup.
  const [isOnboarding, setIsOnboarding] = useState(currentUser?.usernameUnset || viewAsAdmin)

  useEffect(() => {
    // Set `isOnboarding` to true after a new user signs up.
    setIsOnboarding((currentValue) => currentValue || !!currentUser?.usernameUnset)
  }, [currentUser?.usernameUnset])

  const onOnboardingComplete = useCallback(() => {
    setIsOnboarding(false)
  }, [])

  if (!isOnboarding) {
    return null
  }
  return (
    <BlurredBackgroundModal open className={classes.root} data-testid="onboarding-flow">
      <EAOnboardingContextProvider stages={stages} onOnboardingComplete={onOnboardingComplete} viewAsAdmin={viewAsAdmin}/>
    </BlurredBackgroundModal>
  )
}

export const OnboardingFlow = registerComponent(
  'OnboardingFlow',
  OnboardingFlowInner,
  {styles},
)

declare global {
  interface ComponentTypes {
    OnboardingFlow: typeof OnboardingFlow
  }
}
