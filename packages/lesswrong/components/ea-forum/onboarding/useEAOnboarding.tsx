import React, { FC, ReactNode, createContext, useCallback, useContext, useState } from "react";
import { Components } from "../../../lib/vulcan-lib";
import { useCurrentUser } from "../../common/withUser";
import { UpdateCurrentUserFunction, useUpdateCurrentUser } from "../../hooks/useUpdateCurrentUser";

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
  onboardingComplete: boolean,
  goToNextStage: () => void,
  currentUser: UsersCurrent,
  updateCurrentUser: UpdateCurrentUserFunction,
}

const eaOnboardingContext = createContext<EAOnboardingContext>({
  currentStage: onboardingStages[0],
  onboardingComplete: false,
  goToNextStage: () => {},
  currentUser: {} as UsersCurrent,
  updateCurrentUser: async () => {},
});

export const EAOnboardingContextProvider: FC<{
  children: ReactNode,
}> = ({children}) => {
  const [stage, setStage] = useState<OnboardingStage>(onboardingStages[0]);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();

  const goToNextStage = useCallback(() => {
    const nextStage = getNextStage(stage);
    if (nextStage) {
      setStage(nextStage);
    } else {
      setOnboardingComplete(true);
    }
  }, [stage]);

  if (!currentUser) {
    const {LoginForm} = Components;
    return (
      <LoginForm />
    );
  }

  return (
    <eaOnboardingContext.Provider value={{
      currentStage: stage,
      onboardingComplete,
      goToNextStage,
      currentUser,
      updateCurrentUser,
    }}>
      {children}
    </eaOnboardingContext.Provider>
  );
}

export const useEAOnboarding = () => useContext(eaOnboardingContext);
