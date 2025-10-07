import React from 'react';
import { type RouteMetadata } from "@/components/ClientRouteMetadataContext";
import { RouteMetadataSetter } from '@/components/RouteMetadataContext';
import { StatusCodeSetter } from './StatusCodeSetter';
import { isProduction } from '@/lib/executionEnvironment';

const RouteRoot = ({delayedStatusCode=false, metadata, children}: {
  delayedStatusCode?: boolean
  metadata?: RouteMetadata,
  children: React.ReactNode
}) => {

  return <>
    {!delayedStatusCode && <StatusCodeSetter status={200}/>}
    {metadata && <RouteMetadataSetter metadata={metadata}/>}
    {children}
  </>
}


export default RouteRoot;
