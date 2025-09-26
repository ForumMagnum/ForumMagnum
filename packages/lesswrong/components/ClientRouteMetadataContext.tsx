'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useRef } from 'react';

// TODO: see if we can successfully move all of the <head> metadata to NextJS-native functionality
// like metadata objects or generateMetadata functions.  Probably depends on whether we can use
// Apollo client from within generateMetadata.
export interface RouteMetadata {
  title?: string;
  titleComponent?: React.FunctionComponent<{ siteName: string, isSubtitle: boolean }>;
  subtitle?: string;
  subtitleLink?: string;
  subtitleComponent?: React.FunctionComponent<{ isSubtitle?: boolean }>;
  background?: string;
  hasLeftNavigationColumn?: boolean;
  isAdmin?: boolean;
  noFooter?: boolean;
}

interface RouteMetadataContextType {
  metadata: RouteMetadata;
  setMetadata: React.Dispatch<React.SetStateAction<RouteMetadata>>;
}

const RouteMetadataContext = createContext<RouteMetadataContextType | null>(null);

export const ClientRouteMetadataProvider = ({ initialMetadata, children }: { initialMetadata: RouteMetadata, children: ReactNode }) => {
  const [metadata, setMetadata] = useState<RouteMetadata>(initialMetadata);

  const value = useMemo(() => ({ metadata, setMetadata }), [metadata, setMetadata]);
  
  return (
    <RouteMetadataContext.Provider value={value}>
      {children}
    </RouteMetadataContext.Provider>
  );
};

const defaultMetadata: RouteMetadata = {
  subtitle: 'Petrov Day',
  subtitleLink: '/petrov/ceremony'
};

/**
 * Do not use this component outside of a route-entrypoint server component!
 * This is purely to set route metadata for use by components like Header, HeadTags, etc.
 */
export const ClientRouteMetadataSetter = ({ metadata }: { metadata: RouteMetadata }) => {
  const { setMetadata } = useRouteMetadata();

  useEffect(() => {
    setMetadata((prev) => ({ ...defaultMetadata, ...metadata }));

    return () => {
      setMetadata(defaultMetadata);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <></>;
};

export const useRouteMetadata = () => {
  const context = useContext(RouteMetadataContext);
  if (!context) {
    throw new Error('useRouteMetadata must be used within a RouteMetadataProvider');
  }
  return context;
}; 
