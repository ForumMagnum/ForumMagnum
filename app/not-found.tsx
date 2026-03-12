import Error404 from '@/components/common/Error404';
import RouteRoot from '@/components/layout/RouteRoot';
import React from 'react';

export default function NotFound() {
  return <RouteRoot delayedStatusCode>
    <Error404 />
  </RouteRoot>
}
