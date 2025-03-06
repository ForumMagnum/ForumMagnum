import React from 'react'
import { Components, registerComponent } from '../../../lib/vulcan-lib/components'
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import EAOnboardingUserStage from "@/components/ea-forum/onboarding/EAOnboardingUserStage";
import EAOnboardingSubscribeStage from "@/components/ea-forum/onboarding/EAOnboardingSubscribeStage";
import EAOnboardingWorkStage from "@/components/ea-forum/onboarding/EAOnboardingWorkStage";
import EAOnboardingThankYouStage from "@/components/ea-forum/onboarding/EAOnboardingThankYouStage";

const EAOnboardingFlow = ({viewAsAdmin}: {
  // if viewAsAdmin is true, this is an admin testing out the flow, so don't update their account
  viewAsAdmin?: boolean,
}) => {
  /**
   * Ordered list of all onboarding stages.
   * After saving a display name in the "user" the onboarding flow will not be
   * shown again after a refresh, so the easiest way to debug specific stages is
   * to create a new account and _not_ set the display name, then comment out all
   * of the preceding stages in this list.
   */
  return (
    <OnboardingFlow stages={{
      user: <EAOnboardingUserStage/>,
      subscribe: <EAOnboardingSubscribeStage/>,
      work: <EAOnboardingWorkStage/>,
      thankyou: <EAOnboardingThankYouStage/>,
    }} viewAsAdmin={viewAsAdmin}/>
  )
}

const EAOnboardingFlowComponent = registerComponent(
  'EAOnboardingFlow',
  EAOnboardingFlow,
)

declare global {
  interface ComponentTypes {
    EAOnboardingFlow: typeof EAOnboardingFlowComponent
  }
}

export default EAOnboardingFlowComponent;
