import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import FormLabel from '@/lib/vendor/@material-ui/core/src/FormLabel';
import FormControl from '@/lib/vendor/@material-ui/core/src/FormControl';
import FormControlLabel from '@/lib/vendor/@material-ui/core/src/FormControlLabel';
import RadioGroup from '@/lib/vendor/@material-ui/core/src/RadioGroup';
import Radio from '@/lib/vendor/@material-ui/core/src/Radio';
import { UpdateCurrentValues } from '../vulcan-forms/propTypes';

const styles = (theme: ThemeType) => ({
  radio: {
    paddingLeft: 12,
    paddingTop: 8,
    paddingBottom: 0
  }
})

const FormComponentRadioGroupInner = ({ path, value, options, name, label, updateCurrentValues, classes }: {
  path: string,
  value: string,
  options: Array<{ value: string, label: string }>,
  name: string,
  label: string,
  updateCurrentValues: UpdateCurrentValues,
  classes: ClassesType<typeof styles>,
}) => {
  return <FormControl>
    <FormLabel>{label}</FormLabel>
    <RadioGroup aria-label={name} name={name} value={value}
      onChange={(event) => {
        void updateCurrentValues({
          [path]: (event?.target as any)?.value
        })
    }}>
      {options.map(option => {
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

export const FormComponentRadioGroup = registerComponent("FormComponentRadioGroup", FormComponentRadioGroupInner, {styles});



