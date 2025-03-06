import React from 'react';
import Form from 'react-bootstrap/Form';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import FormItem from "@/components/vulcan-ui-bootstrap/forms/FormItem";

const UrlComponent = ({ refFunction, inputProperties, itemProperties }: AnyBecauseTodo) => (
  <FormItem path={inputProperties.path} label={inputProperties.label} {...itemProperties}>
    <Form.Control ref={refFunction} {...inputProperties} {...itemProperties} type="url" />
  </FormItem>
);

const FormComponentUrlComponent = registerComponent('FormComponentUrl', UrlComponent);

declare global {
  interface ComponentTypes {
    FormComponentUrl: typeof FormComponentUrlComponent
  }
}

export default FormComponentUrlComponent;

