import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
// eslint-disable-next-line no-restricted-imports
import MuiTypography from '@material-ui/core/Typography';

const Typography = ({children, ...props}: {
  children: React.ReactNode,
  variant: "body1"|"body2"|"title"|"subheading"|"display1"|"display2"|"display3"|"headline",
  component?: "div"|"span"|"label"|"aside",
  className?: string,
  onClick?: any,
}) => {
  return <MuiTypography {...props}>
    {children}
  </MuiTypography>
}

const TypographyComponent = registerComponent("Typography", Typography);

declare global {
  interface ComponentTypes {
    Typography: typeof TypographyComponent
  }
}

