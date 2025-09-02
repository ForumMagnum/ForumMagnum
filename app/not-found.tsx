import Error404 from '@/components/common/Error404';
import RouteRoot from '@/components/next/RouteRoot';
import React from 'react';

export const dynamic = 'force-dynamic';

export default function NotFound() {
  /*return <RouteRoot>
    <Error404 />
  </RouteRoot>*/
  return <div>Not Found</div>
}
