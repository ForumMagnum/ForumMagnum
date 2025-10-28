import React from 'react';
import { type RouteMetadata } from "@/components/layout/ClientRouteMetadataContext";
import { RouteMetadataSetter } from '@/components/layout/RouteMetadataContext';
import { StatusCodeSetter } from '@/components/next/StatusCodeSetter';
import Footer from '@/components/layout/Footer';

const RouteRoot = ({delayedStatusCode=false, metadata, children}: {
  delayedStatusCode?: boolean
  metadata?: RouteMetadata,
  children: React.ReactNode
}) => {
  return <>
    {!delayedStatusCode && <StatusCodeSetter status={200}/>}
    {metadata && <RouteMetadataSetter metadata={metadata}/>}
    {children}
    {!metadata?.noFooter && <Footer/>}
  </>
}


export default RouteRoot;
