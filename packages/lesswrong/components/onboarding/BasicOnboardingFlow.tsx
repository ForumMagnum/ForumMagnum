import React from 'react'
import { registerComponent } from '../../lib/vulcan-lib/components'
import { OnboardingFlow } from "./OnboardingFlow";
import { EAOnboardingUserStage } from "../ea-forum/onboarding/EAOnboardingUserStage";

const BasicOnboardingFlowInner = ({viewAsAdmin}: { viewAsAdmin?: boolean }) => <OnboardingFlow
  viewAsAdmin={viewAsAdmin}
  stages={{
    user: <EAOnboardingUserStage icon={null}/>,
  }}/>

export const BasicOnboardingFlow = registerComponent(
  'BasicOnboardingFlow',
  BasicOnboardingFlowInner,
)


