import React, { CSSProperties, useEffect, useMemo, useState } from "react";

export type LayoutOptions = {
  standaloneNavigation: boolean,
  renderSunshineSidebar: boolean,
  renderLanguageModelChatLauncher: boolean,
  shouldUseGridLayout: boolean,
  unspacedGridLayout: boolean,
  style?: CSSProperties
}
type LayoutOptionsState = {
  overridenLayoutOptions: Partial<LayoutOptions>,
  setOverridenLayoutOptions: React.Dispatch<React.SetStateAction<Partial<LayoutOptions>>>,
}

export const LayoutOptionsContext = React.createContext<LayoutOptionsState|null>(null);

/**
 * Hook for overriding fields that are used in Layout.tsx to set the overall structure of the page (e.g. standaloneNavigation). To be used
 * if these settings can't be determined from the route and current user alone (which is roughly all that Layout.tsx has access to)
 */
export const useOverrideLayoutOptions = (): [Partial<LayoutOptions>, React.Dispatch<React.SetStateAction<Partial<LayoutOptions>>>] => {
  const layoutOptionsState = React.useContext(LayoutOptionsContext);
  if (!layoutOptionsState) throw "useLayoutOptions() used without the context available";
  
  useEffect(() => {
    // if the component using this hook is unmounted, clear all overriden options
    return () => {
      if (Object.keys(layoutOptionsState.overridenLayoutOptions).length !== 0) return
      layoutOptionsState.setOverridenLayoutOptions({})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  return [layoutOptionsState.overridenLayoutOptions, layoutOptionsState.setOverridenLayoutOptions]
}

export const LayoutOptionsContextProvider = ({children}: {
  children: React.ReactNode,
}) => {
  const [overridenLayoutOptions, setOverridenLayoutOptions] = useState<Partial<LayoutOptions>>({})

  const layoutOptionsState: LayoutOptionsState = useMemo(
    () => ({ overridenLayoutOptions, setOverridenLayoutOptions }),
    [overridenLayoutOptions, setOverridenLayoutOptions]
  );

  return <LayoutOptionsContext.Provider value={layoutOptionsState}>
      {children}
  </LayoutOptionsContext.Provider>
}
