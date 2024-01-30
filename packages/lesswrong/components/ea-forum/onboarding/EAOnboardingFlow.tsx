import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";

const styles = (_theme: ThemeType) => ({
  root: {
    padding: 0,
  },
});

const stages = {
  user: Components.EAOnboardingUserStage,
  subscribe: Components.EAOnboardingSubscribeStage,
} as const;

export const EAOnboardingFlow = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const stage = "subscribe";
  const StageComponent = stages[stage];
  const {BlurredBackgroundModal} = Components;
  return (
    <BlurredBackgroundModal open className={classes.root}>
      <StageComponent />
    </BlurredBackgroundModal>
  );
}

const EAOnboardingFlowComponent = registerComponent(
  "EAOnboardingFlow",
  EAOnboardingFlow,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAOnboardingFlow: typeof EAOnboardingFlowComponent
  }
}
