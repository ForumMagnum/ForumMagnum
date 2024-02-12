import React, { useCallback, useEffect, useState } from "react";
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

  // If `usernameUnset` is true, then we need to show the onboarding flow.
  // We cache the value in a `useState` as it gets set to false in the very
  // first stage (which is the only compulsary stage) - without caching the
  // value this would close the popup.
  const [isOnboarding, setIsOnboarding] = useState(currentUser?.usernameUnset);

  useEffect(() => {
    // Set `isOnboarding` to true after a new user signs up.
    setIsOnboarding((currentValue) => currentValue || currentUser?.usernameUnset);
  }, [currentUser?.usernameUnset]);

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
