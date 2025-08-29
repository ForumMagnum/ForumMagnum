import React from 'react';
import { type RouteMetadata } from "@/components/ClientRouteMetadataContext";
import { RouteMetadataSetter } from '@/components/RouteMetadataContext';

const RouteRoot = ({metadata, children}: {
  metadata?: RouteMetadata,
  children: React.ReactNode
}) => {
  return <>
    {metadata && <RouteMetadataSetter metadata={metadata}/>}
    {children}
  </>
}


export default RouteRoot;
