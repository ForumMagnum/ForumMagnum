import React, { Component } from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import MenuItem from '@material-ui/core/MenuItem';

class FormComponentSelect extends Component {
  render() {
    const { form, options } = this.props

    const selectOptions = options || (form && form.options)

    return <Components.MuiTextField select {...this.props}>
      {selectOptions.map(option => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Components.MuiTextField>
  }
}

registerComponent("FormComponentSelect", FormComponentSelect);
