import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import FormLabel from '@material-ui/core/FormLabel';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import Checkbox from '@material-ui/core/Checkbox';
import ListItemText from '@material-ui/core/ListItemText';

const styles = (theme: ThemeType): JssStyles => ({
  label: {
    fontSize: 10,
    marginBottom: 8
  },
  select: {
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

type MultiselectOption = {
  value: string,
  label: string
}

/**
 * MultiSelect: A pick-multiple checkbox list. This is split from FormComponentMultiSelect
 * so that it can be used outside of vulcan-forms.
 */
const MultiSelect = ({ value, setValue, label, placeholder, separator, options, classes }: {
  value: string[],
  setValue: (newValue: any)=>void,
  
  label?: string,
  placeholder?: string,
  separator?: string,
  options: Array<MultiselectOption>,
  classes: ClassesType
}) => {
  const { MenuItem } = Components;
  
  return <FormControl className={classes.root}>
    {label && <FormLabel className={classes.label}>{label}</FormLabel>}
    <Select
      className={classes.select}
      value={value}
      input={<OutlinedInput labelWidth={0} />}
      onChange={e => {
        // MUI documentation says e.target.value is always an array: https://mui.com/components/selects/#multiple-select
        // @ts-ignore
        setValue(e.target.value)
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
  </FormControl>
}


/**
 * FormComponentMultiSelect: Wrapper around MultiSelect for use with
 * vulcan-forms.
 */
const FormComponentMultiSelect = ({ value, label, placeholder, separator, options, path, updateCurrentValues }: FormComponentProps<string[]> & {
  separator?: string,
  options: Array<MultiselectOption>,
  classes: ClassesType
}) => {
  return <Components.MultiSelect
    label={label}
    placeholder={placeholder}
    separator={separator}
    options={options}

    value={value}
    setValue={(value) => {
      void updateCurrentValues({
        [path]: value
      });
    }}
  />
}

const MultiSelectComponent = registerComponent("MultiSelect", MultiSelect, {styles});
const FormComponentMultiSelectComponent = registerComponent("FormComponentMultiSelect", FormComponentMultiSelect);

declare global {
  interface ComponentTypes {
    MultiSelect: typeof MultiSelectComponent
    FormComponentMultiSelect: typeof FormComponentMultiSelectComponent
  }
}
