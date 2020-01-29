import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';

const EmailTokenResult = ({message}) => {
  return <div>{message}</div>
}

const EmailTokenResultComponent = registerComponent("EmailTokenResult", EmailTokenResult);

declare global {
  interface ComponentTypes {
    EmailTokenResult: typeof EmailTokenResultComponent
  }
}
