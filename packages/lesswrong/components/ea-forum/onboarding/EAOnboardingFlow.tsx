import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";

const styles = (_theme: ThemeType) => ({
  root: {
    padding: 0,
  },
});

export const EAOnboardingFlow = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {BlurredBackgroundModal, EAOnboardingUserStage} = Components;
  return (
    <BlurredBackgroundModal open className={classes.root}>
      <EAOnboardingUserStage />
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
