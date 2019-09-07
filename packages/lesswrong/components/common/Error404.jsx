import { Components, registerComponent } from 'meteor/vulcan:lib';
import React from 'react';
import { useServerRequestStatus } from '../../lib/routeUtil'

const Error404 = () => {
  const { SingleColumnSection } = Components;
  const serverRequestStatus = useServerRequestStatus()
  if (serverRequestStatus) serverRequestStatus.status = 404
  
  return (
    <SingleColumnSection>
      <h2>404 Not Found</h2>
      <h3>Sorry, we couldn't find what you were looking for.</h3>
    </SingleColumnSection>
  );
};

Error404.displayName = 'Error404';

registerComponent('Error404', Error404);

export default Error404;
