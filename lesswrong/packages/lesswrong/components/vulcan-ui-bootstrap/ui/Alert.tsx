import React from 'react';
import Alert from 'react-bootstrap/Alert';
import { registerComponent } from '../../../lib/vulcan-lib/components';

const BootstrapAlert = ({ children, variant,  ...rest }: AnyBecauseTodo) => 
  <Alert variant={variant} {...rest}>{children}</Alert>;

const AlertComponent = registerComponent('Alert', BootstrapAlert);

declare global {
  interface ComponentTypes {
    Alert: typeof AlertComponent
  }
}

export default AlertComponent;

