import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';

const EmailTokenResult = ({message}: {
  message: string,
}) => {
  return <Components.Typography variant="body2">{message}</Components.Typography>
}

const EmailTokenResultComponent = registerComponent("EmailTokenResult", EmailTokenResult);

declare global {
  interface ComponentTypes {
    EmailTokenResult: typeof EmailTokenResultComponent
  }
}
