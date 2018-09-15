import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components } from 'meteor/vulcan:core';
import MenuItem from '@material-ui/core/MenuItem';
import defineComponent from '../../lib/defineComponent';

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

export default defineComponent({
  name: "FormComponentSelect",
  component: FormComponentSelect
});
