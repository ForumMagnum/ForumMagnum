import React from 'react'
import { registerComponent } from '../../lib/vulcan-lib';
import { FormGroupLayoutProps } from './FormGroupLayout';

const FormGroupNoStyling = ({children}: FormGroupLayoutProps) => {
  return <React.Fragment>
    {children}
  </React.Fragment>
}
  
const FormGroupNoStylingComponent = registerComponent('FormGroupNoStyling', FormGroupNoStyling)

declare global {
  interface ComponentTypes {
    FormGroupNoStyling: typeof FormGroupNoStylingComponent
  }
}
