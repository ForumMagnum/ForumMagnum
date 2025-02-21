import React, { FC, ReactNode, createContext, useCallback, useContext, useState } from "react";
import { Components } from "../../../lib/vulcan-lib/components";
import { useCurrentUser, useRefetchCurrentUser } from "../../common/withUser";
import { UpdateCurrentUserFunction, useUpdateCurrentUser } from "../../hooks/useUpdateCurrentUser";
import { useTracking } from "../../../lib/analyticsEvents";

export type OnboardingStage = string

type EAOnboardingContext = {
  currentStage?: OnboardingStage,
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
  goToNextStage: async () => {},
  goToNextStageAfter: async () => {},
  nextStageIsLoading: false,
  currentUser: {} as UsersCurrent,
  updateCurrentUser: async () => {},
  captureOnboardingEvent: (type?: string, trackingData?: Record<string,any>) => {},
  viewAsAdmin: false,
});

export const EAOnboardingContextProvider: FC<{
  stages: Record<string, ReactNode>,
  onOnboardingComplete?: () => void,
  viewAsAdmin?: boolean,
}> = ({stages, onOnboardingComplete, viewAsAdmin}) => {
  const stageNames = Object.keys(stages)
  const [stage, setStage] = useState<OnboardingStage>(stageNames[0]);
  const [loading, setLoading] = useState(false);
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const refetchCurrentUser = useRefetchCurrentUser();
  const {captureEvent} = useTracking();

  const goToNextStage = useCallback(async () => {
    const getNextStage = (currentStage: OnboardingStage): OnboardingStage | undefined =>
      stageNames[stageNames.indexOf(currentStage) + 1]

    setLoading(true);
    await refetchCurrentUser();
    setLoading(false);
    const nextStage = getNextStage(stage);
    if (nextStage) {
      setStage(nextStage);
    } else {
      onOnboardingComplete?.();
    }
  }, [stage, onOnboardingComplete, refetchCurrentUser, stageNames]);

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
      {...Object.values(stages)}
    </eaOnboardingContext.Provider>
  );
}

export const useEAOnboarding = () => useContext(eaOnboardingContext);
