import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import FormLabel from '@/lib/vendor/@material-ui/core/src/FormLabel';
import FormControl from '@/lib/vendor/@material-ui/core/src/FormControl';
import FormControlLabel from '@/lib/vendor/@material-ui/core/src/FormControlLabel';
import RadioGroup from '@/lib/vendor/@material-ui/core/src/RadioGroup';
import Radio from '@/lib/vendor/@material-ui/core/src/Radio';
import PropTypes from 'prop-types';

const styles = (theme: ThemeType) => ({
  radio: {
    paddingLeft: 12,
    paddingTop: 8,
    paddingBottom: 0
  }
})

const FormComponentRadioGroup = ({ path, value, form, options, name, label, updateCurrentValues, classes }: FormComponentProps<string> & {
  form: any;
  options: any[];
  classes: ClassesType<typeof styles>;
}) => {
  const selectOptions = options || (form && form.options)
  return <FormControl>
    <FormLabel>{label}</FormLabel>
    <RadioGroup aria-label={name} name={name} value={value}
      onChange={(event) => {
        void updateCurrentValues({
          [path]: (event?.target as any)?.value
        })
    }}>
      {selectOptions.map(option => {
        return (
          <FormControlLabel 
            key={`${name}-${option.value}`} 
            label={option.label}
            control={<Radio className={classes.radio} value={option.value} />
          }/>
        )
      })}
    </RadioGroup>
  </FormControl>
}

const FormComponentRadioGroupComponent = registerComponent("FormComponentRadioGroup", FormComponentRadioGroup, {styles});

declare global {
  interface ComponentTypes {
    FormComponentRadioGroup: typeof FormComponentRadioGroupComponent
  }
}

