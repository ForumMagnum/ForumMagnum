import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.errorStyle
  }
})

const FormErrors = ({ errors, classes }: {
  errors: any[]
  classes: ClassesType
}) => (
  <div className={classNames(classes.root, "form-errors")}>
    {!!errors.length && (
      <Components.Alert className="flash-message" variant="danger">
        <ul>
          {errors.map((error, index) => (
            error.message !== 'app.validation_error' &&
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
