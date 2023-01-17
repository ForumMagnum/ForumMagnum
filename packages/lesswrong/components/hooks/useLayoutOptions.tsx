import React, { useEffect, useState } from "react";

export type LayoutOptions = {
  standaloneNavigation: boolean,
  renderSunshineSidebar: boolean,
  shouldUseGridLayout: boolean,
  unspacedGridLayout: boolean,
}
type LayoutOptionsState = {
  defaultLayoutOptions: LayoutOptions, // The default layout options determined in Layout.tsx mainly from the route + current user
  setDefaultLayoutOptions: (newOptions: LayoutOptions) => void, // A function that sets the layout options that are currently being overridden (by child components)
  overrideLayoutOptions: Partial<LayoutOptions>, // The layout options that are currently being overridden (by child components)
  setOverrideLayoutOptions: (newOptions: Partial<LayoutOptions>) => void, // A function that sets the layout options that are currently being overridden (by child components)
}

// Changing the layout options after the page has loaded results in an unecessary re-render,
// so start with the most common layout options (for the posts page)
const typicalLayoutOptions: LayoutOptions = {
  standaloneNavigation: false,
  renderSunshineSidebar: false,
  shouldUseGridLayout: false,
  unspacedGridLayout: false,
}

export const LayoutOptionsContext = React.createContext<LayoutOptionsState|null>(null);

// TODO type
export const useLayoutOptions = (startingOptions?: LayoutOptions): [Partial<LayoutOptions>, (newOptions: Partial<LayoutOptions>) => void] => {
  const layoutOptionsState = React.useContext(LayoutOptionsContext);
  if (!layoutOptionsState) throw "useLayoutOptions() used without the context available";
  
  useEffect(() => {
    // if the component using this hook is unmounted, clear all overriden options
    return () => layoutOptionsState.setOverrideLayoutOptions({})
  }, [])
  
  return [layoutOptionsState.overrideLayoutOptions, layoutOptionsState.setOverrideLayoutOptions]
}

export const LayoutOptionsContextProvider = ({children}: {
  children: React.ReactNode,
}) => {
  const [defaultLayoutOptions, setDefaultLayoutOptions] = useState<LayoutOptions>(typicalLayoutOptions)
  const [overrideLayoutOptions, setOverrideLayoutOptions] = useState<Partial<LayoutOptions>>({})

  const layoutOptionsState: LayoutOptionsState = {
    defaultLayoutOptions,
    setDefaultLayoutOptions,
    overrideLayoutOptions,
    setOverrideLayoutOptions: (v) => {
      console.log("Setting layout options", v)
      setOverrideLayoutOptions(v)
    },
  }

  return <LayoutOptionsContext.Provider value={layoutOptionsState}>
      {children}
  </LayoutOptionsContext.Provider>
}