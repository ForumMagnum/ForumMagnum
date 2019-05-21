import React from 'react'
import { registerComponent, Components } from 'meteor/vulcan:core';

const DefaultStyleFormGroup = (props) => {
    return <React.Fragment>
      {props.children}
    </React.Fragment>
  }
  
  registerComponent('DefaultStyleFormGroup', DefaultStyleFormGroup)