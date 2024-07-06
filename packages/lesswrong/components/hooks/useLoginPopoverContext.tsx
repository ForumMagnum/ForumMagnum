import React, { FC, ReactNode, createContext, useCallback, useContext, useState } from "react";

export type LoginAction = "login" | "signup" | "changeLogin" | "confirmLoginChange";

type LoginPopoverContext = {
  loginAction: LoginAction | null,
  setLoginAction: (action: LoginAction | null) => void,
  onLogin: () => void,
  onSignup: () => void,
  onChangeLogin: () => void,
}

const loginPopoverContext = createContext<LoginPopoverContext | null>(null);

export const LoginPopoverContextProvider: FC<{
  children?: ReactNode,
}> = ({children}) => {
  const [loginAction, setLoginAction] = useState<LoginAction | null>(null);
  const onLogin = useCallback(() => setLoginAction("login"), []);
  const onSignup = useCallback(() => setLoginAction("signup"), []);
  const onChangeLogin = useCallback(() => setLoginAction("changeLogin"), []);

  return (
    <loginPopoverContext.Provider value={{
      loginAction,
      setLoginAction,
      onLogin,
      onSignup,
      onChangeLogin
    }}>
      {children}
    </loginPopoverContext.Provider>
  );
}

export const useLoginPopoverContext = () => {
  const value = useContext(loginPopoverContext);
  if (!value) {
    throw new Error("No login popover context provider");
  }
  return value;
}
