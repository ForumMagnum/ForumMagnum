import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { Typography } from "@/components/common/Typography";

const EmailTokenResult = ({message}: {
  message: string,
}) => {
  return <Typography variant="body2">{message}</Typography>
}

const EmailTokenResultComponent = registerComponent("EmailTokenResult", EmailTokenResult);

declare global {
  interface ComponentTypes {
    EmailTokenResult: typeof EmailTokenResultComponent
  }
}

export default EmailTokenResultComponent;
