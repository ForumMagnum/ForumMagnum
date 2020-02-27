import React from 'react'
import { registerComponent } from '../../lib/vulcan-lib';

const DefaultStyleFormGroup = ({children}: {
  children: any
}) => {
  return <React.Fragment>
    {children}
  </React.Fragment>
}
  
const DefaultStyleFormGroupComponent = registerComponent('DefaultStyleFormGroup', DefaultStyleFormGroup)

declare global {
  interface ComponentTypes {
    DefaultStyleFormGroup: typeof DefaultStyleFormGroupComponent
  }
}
