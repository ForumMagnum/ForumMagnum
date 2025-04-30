import React from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import Checkbox from '@/lib/vendor/@material-ui/core/src/Checkbox';
import without from 'lodash/without';
import type { TypedFieldApi } from '../tanstack-form-components/BaseAppForm';

const styles = defineStyles("FormComponentCheckboxGroup", (theme: ThemeType) => ({
  checkbox: {
    padding: 4
  },
}))

export const FormComponentCheckboxGroup = ({ field, label, options }: {
  field: TypedFieldApi<string[]>
  label: string
  options: Array<{value: string, label: string}>
}) => {
  const classes = useStyles(styles);

  const value = field.state.value;
  
  return <div>
    <div>{label}</div>

    {options.map(option => <div key={option.value}>
      <Checkbox
        className={classes.checkbox}
        checked={value.includes(option.value)}
        onChange={(ev, checked) => {
          const newValue = checked
            ? [...value, option.value]
            : without(value, option.value);

          field.handleChange(newValue);
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

