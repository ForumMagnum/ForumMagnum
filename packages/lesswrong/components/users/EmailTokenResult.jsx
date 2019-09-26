import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';

const EmailTokenResult = ({message}) => {
  return <div>{message}</div>
}

registerComponent("EmailTokenResult", EmailTokenResult);
