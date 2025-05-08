import React from 'react'
import { registerComponent } from '../../lib/vulcan-lib/components';
import { FormGroupLayoutProps } from './FormGroupLayout';

const FormGroupNoStylingInner = ({children}: FormGroupLayoutProps) => {
  return <React.Fragment>
    {children}
  </React.Fragment>
}
  
export const FormGroupNoStyling = registerComponent('FormGroupNoStyling', FormGroupNoStylingInner)

declare global {
  interface ComponentTypes {
    FormGroupNoStyling: typeof FormGroupNoStyling
  }
}
