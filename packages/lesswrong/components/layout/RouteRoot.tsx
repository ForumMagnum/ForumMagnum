import React from 'react';
import { type RouteMetadata } from "@/components/layout/ClientRouteMetadataContext";
import { RouteMetadataSetter } from '@/components/layout/RouteMetadataContext';
import { StatusCodeSetter } from '@/components/next/StatusCodeSetter';
import Footer from '@/components/layout/Footer';
import { RouteRootClient } from './RouteRootClient';

const RouteRoot = ({delayedStatusCode=false, subtitle, noFooter, hasLeftNavigationColumn, fullscreen, children}: {
  delayedStatusCode?: boolean
  subtitle?: string | { title: string; link: string } | React.FunctionComponent<{}>;
  noFooter?: boolean;
  hasLeftNavigationColumn?: boolean;
  fullscreen?: boolean,
  children: React.ReactNode
}) => {
  const metadata: RouteMetadata = {
    subtitle,
    hasLeftNavigationColumn,
  };
  return <>
    {!delayedStatusCode && <StatusCodeSetter status={200}/>}
    {metadata && <RouteMetadataSetter metadata={metadata}/>}
    
    <RouteRootClient
      hasLeftNavigationColumn={!!metadata?.hasLeftNavigationColumn}
      fullscreen={!!fullscreen}
    >
      {children}
    </RouteRootClient>
    
    {!noFooter && <Footer/>}
  </>
}


export default RouteRoot;
