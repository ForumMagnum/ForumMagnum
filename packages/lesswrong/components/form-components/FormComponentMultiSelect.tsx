import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import Select from '@material-ui/core/Select';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import MenuItem from '@material-ui/core/MenuItem';
import Checkbox from '@material-ui/core/Checkbox';
import ListItemText from '@material-ui/core/ListItemText';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    '& .MuiOutlinedInput-input': {
      whiteSpace: 'pre-wrap',
      lineHeight: '1.8rem',
      paddingRight: 30
    },
  },
  placeholder: {
    color: theme.palette.grey[600]
  }
})

const FormComponentMultiSelect = ({ value, classes, placeholder, separator, options, path, updateCurrentValues }) => {
  
  return <Select
    className={classes.root}
    value={value}
    input={<OutlinedInput labelWidth={0} />}
    onChange={e => {
      // MUI documentation says e.target.value is always an array: https://mui.com/components/selects/#multiple-select
      // @ts-ignore
      updateCurrentValues({
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
      return selected.map(s => options.find(option => option.value === s)?.label).join(separator || ', ')
    }}
    {...!options.length ? {disabled: true} : {}}>
      {options.map(option => {
        return <MenuItem key={option.value} value={option.value}>
          <Checkbox checked={value.some(v => v === option.value)} />
          <ListItemText primary={option.label} />
        </MenuItem>
      })}
  </Select>
}

const FormComponentMultiSelectComponent = registerComponent("FormComponentMultiSelect", FormComponentMultiSelect, {styles});

declare global {
  interface ComponentTypes {
    FormComponentMultiSelect: typeof FormComponentMultiSelectComponent
  }
}
