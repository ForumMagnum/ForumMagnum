import React, { FC, ReactNode, createContext, useContext } from "react";
import { User, userSchema } from "../types/UserTypes";
import { useAuth } from "./useAuth";
import { useSingle } from "./useSingle";

type CurrentUser = {
  currentUser: User | null,
  launchAuthPrompt: () => void,
}

const currentUserContext = createContext<CurrentUser>({
  currentUser: null,
  launchAuthPrompt: () => {},
});

export const CurrentUserContextProvider: FC<{
  children: ReactNode,
}> = ({children}) => {
  const {launchAuthPrompt, user} = useAuth();

  const {result: currentUser} = useSingle({
    selector: {
      emails: user?.decoded?.name,
    },
    schema: userSchema,
    skip: !user,
  });
  console.log("current", currentUser, !user);

  return (
    <currentUserContext.Provider value={{
      currentUser: currentUser ?? null,
      launchAuthPrompt,
    }}>
      {children}
    </currentUserContext.Provider>
  );
}

export const useCurrentUser = (): User | null => {
  const {currentUser} = useContext(currentUserContext);
  return currentUser;
}

export const useLaunchAuthPrompt = (): () => void => {
  const {launchAuthPrompt} = useContext(currentUserContext);
  return launchAuthPrompt;
}
