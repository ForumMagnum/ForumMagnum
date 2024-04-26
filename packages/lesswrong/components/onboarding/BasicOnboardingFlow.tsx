import React from 'react'
import {Components, registerComponent} from '../../lib/vulcan-lib'

const BasicOnboardingFlow = () => <Components.OnboardingFlow stages={{
  user: <Components.EAOnboardingUserStage/>,
}} />

const BasicOnboardingFlowComponent = registerComponent(
  'BasicOnboardingFlow',
  BasicOnboardingFlow,
)

declare global {
  interface ComponentTypes {
    BasicOnboardingFlow: typeof BasicOnboardingFlowComponent
  }
}
