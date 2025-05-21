import React, { createContext, useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

export type CkEditorPortalContextType = {
  createPortal: (location: HTMLElement, content: React.ReactNode) => void,
}

export const CkEditorPortalContext = createContext<CkEditorPortalContextType|null>(null);

export const CKEditorPortalProvider = ({children}: {
  children: React.ReactNode
}) => {
  const [portals, setPortals] = useState<Array<{
    location: HTMLElement
    content: React.ReactNode
  }>>([]);

  const addPortal = useCallback(
    (location: HTMLElement, content: React.ReactNode) => {
      setPortals(portals => [...portals, {location, content}])
    }, []
  );
  const portalContext = useMemo(() => ({ createPortal: addPortal }), [addPortal]);

  return <CkEditorPortalContext.Provider value={portalContext}>
    {children}
    
    {portals.map(portal => createPortal(portal.content, portal.location))}
  </CkEditorPortalContext.Provider>
}
