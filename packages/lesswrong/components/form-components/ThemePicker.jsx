import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import { customThemes } from '../../themes/customThemes.js';
import PropTypes from 'prop-types';

const ThemePicker = ({label, value, path}, {updateCurrentValues}) => {
  return <div>
    {label}{" "}
    <Select
      value={value||"default"}
      onChange={
        (event) => updateCurrentValues({
          [path]: event.target.value
        })
      }
    >
      {Object.keys(customThemes).map(themeName =>
        <MenuItem value={themeName} key={themeName}>
          {customThemes[themeName].label}
        </MenuItem>
      )}
    </Select>
  </div>;
};
ThemePicker.contextTypes = {
  updateCurrentValues: PropTypes.func,
}

registerComponent("ThemePicker", ThemePicker);
