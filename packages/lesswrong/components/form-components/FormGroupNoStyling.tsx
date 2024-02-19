import React, { ReactNode } from 'react'
import { registerComponent } from '../../lib/vulcan-lib';

const FormGroupNoStyling = ({children}: {
  children: ReactNode
}) => {
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
