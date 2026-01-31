import React from 'react';
import { type RouteMetadata } from "@/components/layout/ClientRouteMetadataContext";
import { RouteMetadataSetter } from '@/components/layout/RouteMetadataContext';
import { StatusCodeSetter } from '@/components/next/StatusCodeSetter';
import Footer from '@/components/layout/Footer';
import { RouteRootClient } from './RouteRootClient';

const RouteRoot = ({delayedStatusCode=false, subtitle, noFooter, fullscreen, children}: {
  delayedStatusCode?: boolean
  subtitle?: string | { title: string; link: string } | React.FunctionComponent<{}>;
  noFooter?: boolean;
  fullscreen?: boolean,
  children: React.ReactNode
}) => {
  const metadata: RouteMetadata = {
    subtitle,
  };
  return <>
    {!delayedStatusCode && <StatusCodeSetter status={200}/>}
    {metadata && <RouteMetadataSetter metadata={metadata}/>}
    
    <RouteRootClient
      fullscreen={!!fullscreen}
    >
      {children}
    </RouteRootClient>
    
    {!noFooter && <Footer/>}
  </>
}


export default RouteRoot;
