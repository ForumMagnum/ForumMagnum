import React from 'react';
import { type RouteMetadata } from "@/components/ClientRouteMetadataContext";
import { RouteMetadataSetter } from '@/components/RouteMetadataContext';
import { StatusCodeSetter } from './StatusCodeSetter';
import { isProduction } from '@/lib/executionEnvironment';

let routeRootRenderCount = 0;

const PROCESS_TRACKER = Symbol('processTracker');

if (!(globalThis as AnyBecauseHard)[PROCESS_TRACKER] && isProduction) {
  (globalThis as AnyBecauseHard)[PROCESS_TRACKER] = true;
  // eslint-disable-next-line no-console
  console.log(`Process tracker initialized`, { pid: process.pid, routeRootRenderCount });
}

const RouteRoot = ({delayedStatusCode=false, metadata, children}: {
  delayedStatusCode?: boolean
  metadata?: RouteMetadata,
  children: React.ReactNode
}) => {
  if (routeRootRenderCount === 0 && isProduction) {
    const processTrackerSet = !!(globalThis as AnyBecauseHard)[PROCESS_TRACKER];
    // eslint-disable-next-line no-console
    console.log('First render of RouteRoot', { pid: process.pid, routeRootRenderCount, processTrackerSet });
  }

  return <>
    {!delayedStatusCode && <StatusCodeSetter status={200}/>}
    {metadata && <RouteMetadataSetter metadata={metadata}/>}
    {children}
    <div className="renderCount" style={{display: "none"}}>{++routeRootRenderCount}</div>
  </>
}


export default RouteRoot;
