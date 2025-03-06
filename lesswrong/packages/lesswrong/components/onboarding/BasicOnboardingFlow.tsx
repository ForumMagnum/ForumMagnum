import React from 'react'
import { Components, registerComponent } from '../../lib/vulcan-lib/components'
import EAOnboardingUserStage from "@/components/ea-forum/onboarding/EAOnboardingUserStage";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";

const BasicOnboardingFlow = ({viewAsAdmin}: { viewAsAdmin?: boolean }) => <OnboardingFlow
  viewAsAdmin={viewAsAdmin}
  stages={{
    user: <EAOnboardingUserStage icon={null}/>,
  }}/>

const BasicOnboardingFlowComponent = registerComponent(
  'BasicOnboardingFlow',
  BasicOnboardingFlow,
)

declare global {
  interface ComponentTypes {
    BasicOnboardingFlow: typeof BasicOnboardingFlowComponent
  }
}

export default BasicOnboardingFlowComponent;
