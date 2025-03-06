import React from 'react';
import Form from 'react-bootstrap/Form';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import FormItem from "@/components/vulcan-ui-bootstrap/forms/FormItem";

const EmailComponent = ({ refFunction, inputProperties, itemProperties }: AnyBecauseTodo) => (
  <FormItem path={inputProperties.path} label={inputProperties.label} {...itemProperties}>
    <Form.Control {...inputProperties} ref={refFunction} type="email" />
  </FormItem>
);

const FormComponentEmailComponent = registerComponent('FormComponentEmail', EmailComponent);

declare global {
  interface ComponentTypes {
    FormComponentEmail: typeof FormComponentEmailComponent
  }
}

export default FormComponentEmailComponent;

