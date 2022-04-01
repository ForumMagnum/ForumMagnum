import React from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from '../../lib/vulcan-lib';
import Select from '@material-ui/core/Select';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import MenuItem from '@material-ui/core/MenuItem';
import Checkbox from '@material-ui/core/Checkbox';
import ListItemText from '@material-ui/core/ListItemText';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    '& .MuiOutlinedInput-input': {
      paddingRight: 30
    },
  }
})

const FormComponentMultiSelect = ({ value, classes, placeholder, options, path }, context) => {
  
  return <Select
    className={classes.root}
    value={value}
    input={<OutlinedInput labelWidth={0} />}
    onChange={e => {
      // MUI documentation says e.target.value is always an array: https://mui.com/components/selects/#multiple-select
      // @ts-ignore
      context.updateCurrentValues({
        [path]: e.target.value
      })
    }}
    multiple
    displayEmpty
    renderValue={(selected: Array<string>) => {
      if (selected.length === 0) {
        return <em className={classes.placeholder}>{placeholder}</em>
      }
      // if any options are selected, display them separated by commas
      return selected.map(s => options.find(option => option.value === s)?.label).join(', ')
    }}>
      {options.map(option => {
        return <MenuItem key={option.value} value={option.value}>
          <Checkbox checked={value.some(v => v === option.value)} />
          <ListItemText primary={option.label} />
        </MenuItem>
      })}
  </Select>
}

(FormComponentMultiSelect as any).contextTypes = {
  updateCurrentValues: PropTypes.func,
};

const FormComponentMultiSelectComponent = registerComponent("FormComponentMultiSelect", FormComponentMultiSelect, {styles});

declare global {
  interface ComponentTypes {
    FormComponentMultiSelect: typeof FormComponentMultiSelectComponent
  }
}
