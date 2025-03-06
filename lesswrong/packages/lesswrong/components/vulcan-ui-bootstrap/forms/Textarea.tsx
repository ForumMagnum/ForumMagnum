import React from 'react';
import Form from 'react-bootstrap/Form';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import FormItem from "@/components/vulcan-ui-bootstrap/forms/FormItem";

const TextareaComponent = ({ refFunction, inputProperties, itemProperties }: AnyBecauseTodo) => (
  <FormItem path={inputProperties.path} label={inputProperties.label} {...itemProperties}>
    <Form.Control as="textarea" ref={refFunction} {...inputProperties} />
  </FormItem>
);

const FormComponentTextareaComponent = registerComponent('FormComponentTextarea', TextareaComponent);

declare global {
  interface ComponentTypes {
    FormComponentTextarea: typeof FormComponentTextareaComponent
  }
}

export default FormComponentTextareaComponent;

