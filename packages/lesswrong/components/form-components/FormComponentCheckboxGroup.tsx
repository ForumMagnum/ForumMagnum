import React from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import Checkbox from '@material-ui/core/Checkbox';
import without from 'lodash/without';

const styles = defineStyles("FormComponentCheckboxGroup", (theme: ThemeType) => ({
  checkbox: {
    padding: 4
  },
}))

const FormComponentCheckboxGroup = ({ value, updateCurrentValues, path, label, options }: FormComponentProps<string[]> & {
  options: Array<{value: string, label: string}>
}) => {
  const classes = useStyles(styles);
  
  return <div>
    <div>{label}</div>

    {options.map(option => <div key={option.value}>
      <Checkbox
        className={classes.checkbox}
        checked={value.includes(option.value)}
        onChange={(ev, checked) => {
          const newValue = checked
            ? [...value, option.value]
            : without(value, option.value)
          void updateCurrentValues({
            [path]: newValue
          });
        }}
      />
      <span>{option.label}</span>
    </div>)}
  </div>
}

const FormComponentCheckboxGroupComponent = registerComponent('FormComponentCheckboxGroup', FormComponentCheckboxGroup);

declare global {
  interface ComponentTypes {
    FormComponentCheckboxGroup: typeof FormComponentCheckboxGroupComponent
  }
}

