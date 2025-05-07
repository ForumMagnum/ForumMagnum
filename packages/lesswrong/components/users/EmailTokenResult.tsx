import React from 'react';
import { Components } from '../../lib/vulcan-lib/components';

export const EmailTokenResult = ({message}: {
  message: string,
}) => {
  return <Components.Typography variant="body2">{message}</Components.Typography>
}
