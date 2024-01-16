import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useOnNavigate } from '../hooks/useOnNavigate';
import { useOnSearchHotkey } from './withGlobalKeydown';

interface ExpandAllContext {
  isAllExpanded: boolean
  expandAll: ()=>void
}

export const ExpandAllContext = createContext<ExpandAllContext|null>(null);

const ExpandOnSearchHotkeyPageWrapper = ({children, classes}: {
  children: React.ReactNode,
  classes: ClassesType,
}) => {
  const [hasExpandedAll, setHasExpandedAll] = useState(false);
  const expandAll = useCallback(() => setHasExpandedAll(true), []);
  
  useOnSearchHotkey(expandAll);
  useOnNavigate(() => setHasExpandedAll(false));
  
  const context = useMemo(() => ({
    isAllExpanded: hasExpandedAll,
    expandAll,
  }), [hasExpandedAll, expandAll]);
  
  return <ExpandAllContext.Provider value={context}>
    {children}
  </ExpandAllContext.Provider>
}

export const useExpandAllContext = () => {
  return useContext(ExpandAllContext);
}

const ExpandOnSearchHotkeyPageWrapperComponent = registerComponent('ExpandOnSearchHotkeyPageWrapper', ExpandOnSearchHotkeyPageWrapper);

declare global {
  interface ComponentTypes {
    ExpandOnSearchHotkeyPageWrapper: typeof ExpandOnSearchHotkeyPageWrapperComponent
  }
}

