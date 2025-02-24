import React from 'react'
import { Components, registerComponent } from '../../lib/vulcan-lib/components'

const BasicOnboardingFlow = ({viewAsAdmin}: { viewAsAdmin?: boolean }) => <Components.OnboardingFlow
  viewAsAdmin={viewAsAdmin}
  stages={{
    user: <Components.EAOnboardingUserStage icon={null}/>,
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
