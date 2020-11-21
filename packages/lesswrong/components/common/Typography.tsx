import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
// eslint-disable-next-line no-restricted-imports
import MuiTypography from '@material-ui/core/Typography';

const Typography = ({children, variant, component, className, id, color, align, onClick}: {
  children: React.ReactNode,
  variant: "body1"|"body2"|"title"|"subheading"|"display1"|"display2"|"display3"|"headline",
  component?: any,
  className?: string,
  id?: string,
  color?: any,
  align?: "inherit"|"left"|"right"|"center"|"justify",
  onClick?: any,
}) => {
  return <MuiTypography variant={variant} component={component} className={className} id={id} color={color} align={align} onClick={onClick}>
    {children}
  </MuiTypography>
}

const TypographyComponent = registerComponent("Typography", Typography);

declare global {
  interface ComponentTypes {
    Typography: typeof TypographyComponent
  }
}

