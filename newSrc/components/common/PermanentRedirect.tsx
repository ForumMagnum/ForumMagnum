import { registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { useServerRequestStatus } from '../../lib/routeUtil'
import { Redirect } from '../../lib/reactRouterWrapper';

const PermanentRedirect = ({url, status}: {
  url: string,
  status?: number
}) => {
  if (!url) throw Error("Permanent Redirect requires a URL")
  const serverRequestStatus = useServerRequestStatus()
  if (serverRequestStatus) {
    serverRequestStatus.status = status || 301
    serverRequestStatus.redirectUrl = url
  } 
  return (
    <Redirect to={url} />
  );
};

const PermanentRedirectComponent = registerComponent('PermanentRedirect', PermanentRedirect);

declare global {
  interface ComponentTypes {
    PermanentRedirect: typeof PermanentRedirectComponent
  }
}
