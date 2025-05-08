import React from 'react'
import { Components, registerComponent } from '../../lib/vulcan-lib/components'

const BasicOnboardingFlowInner = ({viewAsAdmin}: { viewAsAdmin?: boolean }) => <Components.OnboardingFlow
  viewAsAdmin={viewAsAdmin}
  stages={{
    user: <Components.EAOnboardingUserStage icon={null}/>,
  }}/>

export const BasicOnboardingFlow = registerComponent(
  'BasicOnboardingFlow',
  BasicOnboardingFlowInner,
)

declare global {
  interface ComponentTypes {
    BasicOnboardingFlow: typeof BasicOnboardingFlow
  }
}
