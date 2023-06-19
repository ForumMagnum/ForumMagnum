import React, { useCallback, useMemo, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import type { ToCData, ToCSection } from '../../server/tableOfContents';

// Context used to share a reference used to share the table of contents
// between the ToC itself, and the Header. The Header uses the ToC to change
// its icon (if a ToC is present) and to put the ToC inside NavigationMenu; it
// needs this Context because it doesn't have access to the post, which is on
// the wrong side of a whole lot of plumbing.
//
// The reference is to a function setToC, which puts the ToC in the state of
// Layout.
type ToCWithTitle = {title: string, sectionData: ToCData};
type SidebarsContextType = {
  toc: ToCWithTitle|null,
  setToC: (toc: ToCWithTitle|null)=>void,
  sideCommentsActive: boolean,
  setSideCommentsActive: (active: boolean)=>void,
}
export const SidebarsContext = React.createContext<SidebarsContextType|null>(null);

const SidebarsWrapper = ({children}: {
  children: React.ReactNode
}) => {
  const [toc,setToCState] = useState<ToCWithTitle|null>(null);
  const [sideCommentsActive,setSideCommentsActive] = useState(false);
  
  const setToC = useCallback((toc: ToCWithTitle|null) => {
    setToCState(toc);
  }, []);
  
  const sidebarsContext = useMemo((): SidebarsContextType => ({
    toc, setToC,
    sideCommentsActive,
    setSideCommentsActive,
  }), [toc, setToC, sideCommentsActive, setSideCommentsActive]);

  return <SidebarsContext.Provider value={sidebarsContext}>
    {children}
  </SidebarsContext.Provider>
}

const SidebarsWrapperComponent = registerComponent("SidebarsWrapper", SidebarsWrapper);

declare global {
  interface ComponentTypes {
    SidebarsWrapper: typeof SidebarsWrapperComponent
  }
}
