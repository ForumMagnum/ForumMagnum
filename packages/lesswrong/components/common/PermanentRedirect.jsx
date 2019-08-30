import { registerComponent } from 'meteor/vulcan:lib';
import React from 'react';
import { useServerRequestStatus } from '../../lib/routeUtil'
import { Redirect } from 'react-router'

const PermanentRedirect = ({url, status}) => {
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

registerComponent('PermanentRedirect', PermanentRedirect);