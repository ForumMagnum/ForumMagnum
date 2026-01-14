import React from 'react';
import { type RouteMetadata } from "@/components/layout/ClientRouteMetadataContext";
import { RouteMetadataSetter } from '@/components/layout/RouteMetadataContext';
import { StatusCodeSetter } from '@/components/next/StatusCodeSetter';
import Footer from '@/components/layout/Footer';
import { RouteRootClient } from './RouteRootClient';

const RouteRoot = ({delayedStatusCode=false, metadata, fullscreen, children}: {
  delayedStatusCode?: boolean
  metadata?: RouteMetadata,
  fullscreen?: boolean,
  children: React.ReactNode
}) => {
  return <>
    {!delayedStatusCode && <StatusCodeSetter status={200}/>}
    {metadata && <RouteMetadataSetter metadata={metadata}/>}
    
    <RouteRootClient
      hasLeftNavigationColumn={!!metadata?.hasLeftNavigationColumn}
      fullscreen={!!fullscreen}
    >
      {children}
    </RouteRootClient>
    
    {!metadata?.noFooter && <Footer/>}
  </>
}


export default RouteRoot;
