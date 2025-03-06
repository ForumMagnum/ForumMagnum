import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';
import FormError from "@/components/vulcan-forms/FormError";

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.errorStyle
  }
})

const FieldErrors = ({ errors, classes }: {
  errors: any[]
  classes: ClassesType<typeof styles>
}) => (
  <ul className={classNames(classes.root, "form-input-errors")}>
    {errors.map((error, index) => (
      <li key={index}>
        <FormError error={error} errorContext="field" />
      </li>
    ))}
  </ul>
);

const FieldErrorsComponent = registerComponent('FieldErrors', FieldErrors, {styles});

declare global {
  interface ComponentTypes {
    FieldErrors: typeof FieldErrorsComponent
  }
}

export default FieldErrorsComponent;
