import React from 'react'
import { registerComponent } from '../../../lib/vulcan-lib/components'
import OnboardingFlow from "../../onboarding/OnboardingFlow";
import EAOnboardingUserStage from "./EAOnboardingUserStage";
import EAOnboardingSubscribeStage from "./EAOnboardingSubscribeStage";
import EAOnboardingWorkStage from "./EAOnboardingWorkStage";
import EAOnboardingThankYouStage from "./EAOnboardingThankYouStage";

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

export default registerComponent(
  'EAOnboardingFlow',
  EAOnboardingFlow,
);


