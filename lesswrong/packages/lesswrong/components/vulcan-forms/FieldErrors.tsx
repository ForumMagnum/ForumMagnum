import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import classNames from 'classnames';

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
        <Components.FormError error={error} errorContext="field" />
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
