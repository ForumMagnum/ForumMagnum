import React from 'react'
import { registerComponent } from '../../lib/vulcan-lib/components';
import { FormGroupLayoutProps } from './FormGroupLayout';

const FormGroupNoStyling = ({children}: FormGroupLayoutProps) => {
  return <React.Fragment>
    {children}
  </React.Fragment>
}
  
export default registerComponent('FormGroupNoStyling', FormGroupNoStyling);


