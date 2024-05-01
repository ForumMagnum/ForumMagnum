import React, { FC, ReactNode, createContext, useCallback, useContext, useState } from "react";
import { Components } from "../../../lib/vulcan-lib";
import { useCurrentUser, useRefetchCurrentUser } from "../../common/withUser";
import { UpdateCurrentUserFunction, useUpdateCurrentUser } from "../../hooks/useUpdateCurrentUser";
import { useTracking } from "../../../lib/analyticsEvents";

/**
 * Ordered list of all onboarding stages.
 * After saving a display name in the "user" the onboarding flow will not be
 * shown again after a refresh, so the easiest way to debug specific stages is
 * to create a new account and _not_ set the display name, then comment out all
 * of the preceding stages in this list.
 */
const onboardingStages = [
  "user",
  "subscribe",
  "work",
  "thankyou",
] as const;

export type OnboardingStage = typeof onboardingStages[number];

export const getFirstStage = (): OnboardingStage => onboardingStages[0];

const getNextStage = (
  currentStage: OnboardingStage,
): OnboardingStage | undefined =>
  onboardingStages[onboardingStages.indexOf(currentStage) + 1];

type EAOnboardingContext = {
  currentStage: OnboardingStage,
  goToNextStage: () => Promise<void>,
  goToNextStageAfter: <T>(promise: Promise<T>) => Promise<void>,
  nextStageIsLoading: boolean,
  currentUser: UsersCurrent,
  updateCurrentUser: UpdateCurrentUserFunction,
  captureOnboardingEvent: (type?: string, trackingData?: Record<string,any>) => void,
  // if viewAsAdmin is true, this is an admin testing out the flow, so don't update their account
  viewAsAdmin?: boolean,
}

const eaOnboardingContext = createContext<EAOnboardingContext>({
  currentStage: onboardingStages[0],
  goToNextStage: async () => {},
  goToNextStageAfter: async () => {},
  nextStageIsLoading: false,
  currentUser: {} as UsersCurrent,
  updateCurrentUser: async () => {},
  captureOnboardingEvent: (type?: string, trackingData?: Record<string,any>) => {},
  viewAsAdmin: false,
});

export const EAOnboardingContextProvider: FC<{
  onOnboardingComplete?: () => void,
  viewAsAdmin?: boolean,
  children: ReactNode,
}> = ({onOnboardingComplete, viewAsAdmin, children}) => {
  const [stage, setStage] = useState<OnboardingStage>(onboardingStages[0]);
  const [loading, setLoading] = useState(false);
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const refetchCurrentUser = useRefetchCurrentUser();
  const {captureEvent} = useTracking();

  const goToNextStage = useCallback(async () => {
    setLoading(true);
    await refetchCurrentUser();
    setLoading(false);
    const nextStage = getNextStage(stage);
    if (nextStage) {
      setStage(nextStage);
    } else {
      onOnboardingComplete?.();
    }
  }, [stage, onOnboardingComplete, refetchCurrentUser]);

  const goToNextStageAfter = useCallback(async function<T>(promise: Promise<T>) {
    setLoading(true);
    await promise;
    await goToNextStage();
  }, [goToNextStage]);
  
  /**
   * Wrapper around captureEvent() that suppresses events when we are viewing as admin
   */
  const captureOnboardingEvent = useCallback((type?: string, trackingData?: Record<string,any>) => {
    !viewAsAdmin && captureEvent(type, trackingData);
  }, [viewAsAdmin, captureEvent])

  // This should never happen
  if (!currentUser) {
    const {LoginForm} = Components;
    return (
      <LoginForm />
    );
  }

  return (
    <eaOnboardingContext.Provider value={{
      currentStage: stage,
      goToNextStage,
      goToNextStageAfter,
      nextStageIsLoading: loading,
      currentUser,
      updateCurrentUser,
      captureOnboardingEvent,
      viewAsAdmin,
    }}>
      {children}
    </eaOnboardingContext.Provider>
  );
}

export const useEAOnboarding = () => useContext(eaOnboardingContext);
