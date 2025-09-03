import React from 'react';
import { type RouteMetadata } from "@/components/ClientRouteMetadataContext";
import { RouteMetadataSetter } from '@/components/RouteMetadataContext';

let routeRootRenderCount = 0;

const RouteRoot = ({metadata, children}: {
  metadata?: RouteMetadata,
  children: React.ReactNode
}) => {
  return <>
    {metadata && <RouteMetadataSetter metadata={metadata}/>}
    {children}
    <div className="renderCount" style={{display: "none"}}>{++routeRootRenderCount}</div>
  </>
}


export default RouteRoot;
