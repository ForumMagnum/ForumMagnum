import React, { useCallback, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { useCurrentUser } from "../../common/withUser";

export const EAOnboarding = () => {
  const currentUser = useCurrentUser();
  const [isOnboarding, setIsOnboarding] = useState(currentUser?.usernameUnset);

  const onOnboardingComplete = useCallback(() => {
    setIsOnboarding(false);
  }, []);

  const {EAOnboardingFlow} = Components;
  return isOnboarding
    ? <EAOnboardingFlow onOnboardingComplete={onOnboardingComplete} />
    : null;
}

const EAOnboardingComponent = registerComponent(
  "EAOnboarding",
  EAOnboarding,
);

declare global {
  interface ComponentTypes {
    EAOnboarding: typeof EAOnboardingComponent
  }
}
