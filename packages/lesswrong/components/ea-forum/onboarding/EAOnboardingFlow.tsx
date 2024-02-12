import React, { useCallback, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { useCurrentUser } from "../../common/withUser";
import { EAOnboardingContextProvider } from "./useEAOnboarding";

const styles = (_theme: ThemeType) => ({
  root: {
    padding: 0,
  },
});

const EAOnboardingFlow = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const [isOnboarding, setIsOnboarding] = useState(currentUser?.usernameUnset);

  const onOnboardingComplete = useCallback(() => {
    setIsOnboarding(false);
  }, []);

  if (!isOnboarding) {
    return null;
  }

  const {
    BlurredBackgroundModal, EAOnboardingUserStage, EAOnboardingSubscribeStage,
    EAOnboardingWorkStage, EAOnboardingThankYouStage,
  } = Components;
  return (
    <BlurredBackgroundModal open className={classes.root}>
      <EAOnboardingContextProvider onOnboardingComplete={onOnboardingComplete}>
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
