import React from 'react'
import { registerComponent, Components } from 'meteor/vulcan:core';

const DefaultStyleFormGroup = (props) => {
    return <React.Fragment>
      {props.children}
    </React.Fragment>
  }
  
const DefaultStyleFormGroupComponent = registerComponent('DefaultStyleFormGroup', DefaultStyleFormGroup)

declare global {
  interface ComponentTypes {
    DefaultStyleFormGroup: typeof DefaultStyleFormGroupComponent
  }
}
