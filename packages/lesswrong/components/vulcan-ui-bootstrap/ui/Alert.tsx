import React from 'react';
import Alert from 'react-bootstrap/Alert';
import { registerComponent } from '../../../lib/vulcan-core';

const BootstrapAlert = ({ children, variant,  ...rest }) => 
  <Alert variant={variant} {...rest}>{children}</Alert>;

const AlertComponent = registerComponent('Alert', BootstrapAlert);

declare global {
  interface ComponentTypes {
    Alert: typeof AlertComponent
  }
}

