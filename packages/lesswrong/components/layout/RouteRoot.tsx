import React from 'react';
import { StatusCodeSetter } from '@/components/next/StatusCodeSetter';
import Footer from '@/components/layout/Footer';
import { RouteRootClient } from './RouteRootClient';
import { RouteSubtitlePortal } from './RouteSubtitlePortal';

const RouteRoot = ({delayedStatusCode=false, subtitle, noFooter, fullscreen, preserveStateWhileUnmounted=false, children}: {
  delayedStatusCode?: boolean
  subtitle?: string | { title: string; link: string } | React.FunctionComponent<{}>;
  noFooter?: boolean;
  fullscreen?: boolean,
  preserveStateWhileUnmounted?: boolean,
  children: React.ReactNode
}) => {
  return <>
    {!delayedStatusCode && <StatusCodeSetter status={200}/>}
    <RouteSubtitlePortal subtitle={subtitle} />
    
    <RouteRootClient
      fullscreen={!!fullscreen}
      preserveStateWhileUnmounted={preserveStateWhileUnmounted}
    >
      {children}
    </RouteRootClient>
    
    {!noFooter && <Footer/>}
  </>
}


export default RouteRoot;
