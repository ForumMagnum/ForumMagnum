'use client';

import isEqual from 'lodash/isEqual';
import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';

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
  setMetadata: (metadata: RouteMetadata) => void;
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

/**
 * Do not use this component outside of a route-entrypoint server component!
 * This is purely to set route metadata for use by components like Header, HeadTags, etc.
 */
export const ClientRouteMetadataSetter = ({ metadata }: { metadata: RouteMetadata }) => {
  const { metadata: currentMetadata, setMetadata } = useRouteMetadata();

  useEffect(() => {
    if (!isEqual(currentMetadata, metadata)) {
      setMetadata(metadata);
    }

    return () => {
      setMetadata({});
    }
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
