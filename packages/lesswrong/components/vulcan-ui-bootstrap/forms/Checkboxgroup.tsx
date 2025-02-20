import React from 'react';
import Form from 'react-bootstrap/Form';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import without from 'lodash/without';
import uniq from 'lodash/uniq';
import intersection from 'lodash/intersection';
import * as _ from 'underscore';

// note: treat checkbox group the same as a nested component, using `path`
const CheckboxGroupComponent = ({ refFunction, label, path, value, formType, updateCurrentValues, inputProperties, itemProperties }: AnyBecauseTodo) => {

  const { options } = inputProperties;

  // get rid of duplicate values or any values that are not included in the options provided
  value = uniq(intersection(value, options.map((o: AnyBecauseTodo) => o.value)));

  // if this is a "new document" form check options' "checked" property to populate value
  if (formType === 'new' && value.length === 0) {
    const checkedValues = _.where(options, { checked: true }).map((option: any) => option.value);
    if (checkedValues.length) {
      value = checkedValues;
    }
  }
  
  return (
    <Components.FormItem path={inputProperties.path} label={inputProperties.label} {...itemProperties}>
      <div>
        {options.map((option: AnyBecauseTodo, i: number) => (
          <Form.Check
            {...inputProperties}
            layout="elementOnly"
            key={i}
            label={option.label}
            value={value.includes(option.value)}
            checked={!!value.includes(option.value)}
            id={`${path}.${i}`}
            path={`${path}.${i}`}
            ref={refFunction}
            onChange={(event: AnyBecauseTodo) => {
              const isChecked = event.target.checked;
              const newValue = isChecked ? [...value, option.value] : without(value, option.value);
              updateCurrentValues({ [path]: newValue });
            }}
          />
        ))}
      </div>
    </Components.FormItem>
  );
};

const FormComponentCheckboxGroupComponent = registerComponent('FormComponentCheckboxGroup', CheckboxGroupComponent);

declare global {
  interface ComponentTypes {
    FormComponentCheckboxGroup: typeof FormComponentCheckboxGroupComponent
  }
}

