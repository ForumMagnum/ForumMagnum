import React from 'react';
import { type RouteMetadata } from "@/components/ClientRouteMetadataContext";
import { RouteMetadataSetter } from '@/components/RouteMetadataContext';
import { StatusCodeSetter } from './StatusCodeSetter';

let routeRootRenderCount = 0;

const RouteRoot = ({delayedStatusCode=false, metadata, children}: {
  delayedStatusCode?: boolean
  metadata?: RouteMetadata,
  children: React.ReactNode
}) => {
  return <>
    {!delayedStatusCode && <StatusCodeSetter status={200}/>}
    {metadata && <RouteMetadataSetter metadata={metadata}/>}
    {children}
    <div className="renderCount" style={{display: "none"}}>{++routeRootRenderCount}</div>
  </>
}


export default RouteRoot;
