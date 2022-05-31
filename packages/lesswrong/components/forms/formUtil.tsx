import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';

// API 1:
// State in a hook utility function. Form object passed to each component; component type enforces
// fieldName being valid/being a compatible type based on the corresponding form.
//   const form = useEditForm({
//     initialValue: someObject,
//     fragmentName: "SomeObjectFragment",
//   });
//
//   return (
//     <Form form={form}>
//       <FormCheckbox form={form} fieldName="booleanField"/>
//       <SubmitButton form={form}/>
//     </Form>
//   );
//
// API 2:
// State in a hook utility function. Form objects curried instead of passed. Component type
// enforces fieldName being valid/compatible based on the form object.
//   const form = useEditForm({
//     initialValue: someObject,
//     fragmentName: "SomeObjectFragment"
//   );
//   const { Form, FormCheckbox, SubmitButton } = form.Components;
//   return (
//     <Form>
//       <FormCheckbox fieldName="booleanField"/>
//       <SubmitButton form={form}/>
//     </Form>
//   );
//
// API 3:
// State in a wrapper component. Cannot enforce fieldName being valid/compatible.
//   return (
//     <Form initialValue={someObject} fragmentName="SomeObjectFragment">
//       <FormCheckbox fieldName="booleanField"/>
//       <SubmitButton/>
//     </Form>
//   );

class Form<T> {
}


export const useEditForm = <T extends any>({initialValue, fragmentName}: {
  initialValue: any,
  fragmentName: any
}): {
  form: any,
  // TODO
} => {
  // TODO
  return {
    form: null
  };
}

export const useFormComponent = <T extends any>(form, fieldName): {
  value: any,
  setValue: (newValue: any)=>void,
  disabled: boolean,
}=> {
  // TODO
  return {
    value: null,
    setValue: (newValue: any)=>{},
    disabled: false,
  };
}

export const FormContainer = <T extends any>({form}: {
  form: Form<T>,
}) => {
  // TODO
}

export const FormCheckbox = <T extends any>({form, fieldName, label}: {
  form: Form<T>
  fieldName: keyof T,
  label: React.ReactNode,
}) => {
  const {disabled, value, setValue} = useFormComponent<boolean>(form, fieldName);

  const checkbox = (<Checkbox
    checked={value}
    onChange={(event, checked?: any) => {
      setValue(checked ?? false);
    }}
    disabled={disabled}
    disableRipple
  />);
  return <FormControlLabel control={checkbox} label={label} />
}
const FormCheckboxComponent = registerComponent("FormCheckbox", FormCheckbox);

declare global {
  interface ComponentTypes {
    FormCheckbox: typeof FormCheckboxComponent
  }
}
