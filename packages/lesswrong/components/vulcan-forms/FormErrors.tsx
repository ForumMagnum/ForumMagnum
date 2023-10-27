import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.errorStyle
  }
})

// Validation errors are returned with a kind of "heading" error with id "app.validation_error". It
// can be used for a message like "Please fix the following errors:", but in practice, we don't want
// that, so we filter it out by default.
const FormErrors = ({ errors, classes, filteredErrors = ['app.validation_error'] }: {
  errors: any[]
  classes: ClassesType,
  filteredErrors?: string[]
}) => (
  <div className={classNames(classes.root, "form-errors")}>
    {!!errors.length && (
      <Components.Alert className="flash-message" variant="danger">
        <ul>
          {errors.map((error, index) => (
            !filteredErrors.includes(error.message) &&
              <li key={index}>
                <Components.FormError error={error} errorContext="form" />
              </li>
          ))}
        </ul>
      </Components.Alert>
    )}
  </div>
);
const FormErrorsComponent = registerComponent('FormErrors', FormErrors, {styles});

declare global {
  interface ComponentTypes {
    FormErrors: typeof FormErrorsComponent
  }
}
