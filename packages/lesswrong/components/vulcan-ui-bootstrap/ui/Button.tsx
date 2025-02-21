import React from 'react';
import Button from 'react-bootstrap/Button';
import { registerComponent } from '../../../lib/vulcan-lib/components';

const BootstrapButton = ({ children, variant, size, className, ...rest }: {
  children: React.ReactNode
  variant?: any
  size?: any
  className?: string
  onClick: (ev: any) => void
  disabled?: boolean
  iconButton?: boolean
  tabIndex?: number
}) => {
  return <Button variant={variant} size={size} {...rest}>{children}</Button>;
}

const ButtonComponent = registerComponent('Button', BootstrapButton);

declare global {
  interface ComponentTypes {
    Button: typeof ButtonComponent
  }
}

