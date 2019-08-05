import React from 'react';
import { registerComponent } from 'vulcan:core';

const EmailTokenResult = ({message}) => {
  return <div>{message}</div>
}

registerComponent("EmailTokenResult", EmailTokenResult);