import React from 'react';
import { type RouteMetadata } from "@/components/ClientRouteMetadataContext";
import { RouteMetadataSetter } from '@/components/RouteMetadataContext';
import { setRequestStatus } from './RequestStatus';

const RouteRoot = ({metadata, children}: {
  metadata?: RouteMetadata,
  children: React.ReactNode
}) => {
  setRequestStatus(200);

  return <>
    {metadata && <RouteMetadataSetter metadata={metadata}/>}
    {children}
  </>
}


export default RouteRoot;
