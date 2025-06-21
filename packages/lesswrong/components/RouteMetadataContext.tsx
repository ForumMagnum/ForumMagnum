'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// TODO: see if we can successfully move all of the <head> metadata to NextJS-native functionality
// like metadata objects or generateMetadata functions.  Probably depends on whether we can use
// Apollo client from within generateMetadata.
interface RouteMetadata {
  title?: string;
  titleComponent?: React.FunctionComponent<{ siteName: string, isSubtitle: boolean }>;
  subtitle?: string;
  headerSubtitle?: string;
  subtitleLink?: string;
  subtitleComponent?: React.FunctionComponent<{ isSubtitle?: boolean }>;
  description?: string;
  noIndex?: boolean;
  background?: string;
  hasLeftNavigationColumn?: boolean;
  isAdmin?: boolean;
  noFooter?: boolean;
}

interface RouteMetadataContextType {
  metadata: RouteMetadata;
  setMetadata: (metadata: RouteMetadata) => void;
}

const RouteMetadataContext = createContext<RouteMetadataContextType>({
  metadata: {},
  setMetadata: () => {},
});

export const RouteMetadataProvider = ({ children }: { children: ReactNode }) => {
  const [metadata, setMetadata] = useState<RouteMetadata>({});
  
  return (
    <RouteMetadataContext.Provider value={{ metadata, setMetadata }}>
      {children}
    </RouteMetadataContext.Provider>
  );
};

/**
 * Do not use this component outside of a route-entrypoint server component!
 * This is purely to set route metadata for use by components like Header, HeadTags, etc.
 */
export const RouteMetadataSetter = ({ metadata }: { metadata: RouteMetadata }) => {
  const { setMetadata } = useRouteMetadata();
  setMetadata(metadata);
  return <></>;
};

export const useRouteMetadata = () => {
  const context = useContext(RouteMetadataContext);
  if (!context) {
    throw new Error('useRouteMetadata must be used within a RouteMetadataProvider');
  }
  return context;
}; 