import { registerComponent } from 'meteor/vulcan:lib';
import React from 'react';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import { useServerRequestStatus } from '../../lib/routeUtil'

const Error404 = () => {
  const serverRequestStatus = useServerRequestStatus()
  if (serverRequestStatus) serverRequestStatus.status = 404
  return (
    <div className="error404">
      <h3><FormattedMessage id="app.404"/></h3>
    </div>
  );
};

Error404.displayName = 'Error404';

registerComponent('Error404', Error404);

export default Error404;