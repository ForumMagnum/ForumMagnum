import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { EAOnboardingContextProvider } from "./useEAOnboarding";

const styles = (_theme: ThemeType) => ({
  root: {
    padding: 0,
  },
});

export const EAOnboardingFlow = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {
    BlurredBackgroundModal, EAOnboardingUserStage, EAOnboardingSubscribeStage,
    EAOnboardingWorkStage, EAOnboardingThankYouStage,
  } = Components;
  return (
    <BlurredBackgroundModal open className={classes.root}>
      <EAOnboardingContextProvider>
        <EAOnboardingUserStage />
        <EAOnboardingSubscribeStage />
        <EAOnboardingWorkStage />
        <EAOnboardingThankYouStage />
      </EAOnboardingContextProvider>
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
