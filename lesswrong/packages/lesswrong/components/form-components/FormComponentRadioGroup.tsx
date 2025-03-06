import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import PropTypes from 'prop-types';
import { FormLabel, FormControl, FormControlLabel, RadioGroup, Radio } from "@/components/mui-replacement";

const styles = (theme: ThemeType) => ({
  radio: {
    paddingLeft: 12,
    paddingTop: 8,
    paddingBottom: 0
  }
})

const FormComponentRadioGroup = ({ path, value, form, options, name, label, classes }: FormComponentProps<string> & {
  form: any;
  options: any[];
  classes: ClassesType<typeof styles>;
}, context: FormComponentContext<string>) => {
  const selectOptions = options || (form && form.options)
  return <FormControl>
    <FormLabel>{label}</FormLabel>
    <RadioGroup aria-label={name} name={name} value={value}
      onChange={(event) => {
        void context.updateCurrentValues({
          [path]: (event?.target as any)?.value
        })
    }}>
      {selectOptions.map(option => {
        return (
          <FormControlLabel 
            key={`${name}-${option.value}`} 
            value={option.value} 
            label={option.label}
            control={<Radio className={classes.radio} />
            }/>
        )
      })}
    </RadioGroup>
  </FormControl>
}

(FormComponentRadioGroup as any).contextTypes = {
  updateCurrentValues: PropTypes.func,
};

const FormComponentRadioGroupComponent = registerComponent("FormComponentRadioGroup", FormComponentRadioGroup, {styles});

declare global {
  interface ComponentTypes {
    FormComponentRadioGroup: typeof FormComponentRadioGroupComponent
  }
}

export default FormComponentRadioGroupComponent;

