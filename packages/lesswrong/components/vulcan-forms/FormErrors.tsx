import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.errorStyle
  }
})

const FormErrors = ({ errors, classes }: {
  errors: any[]
  classes: ClassesType<typeof styles>
}) => (
  <div className={classNames(classes.root, "form-errors")}>
    {!!errors.length && (
      <Components.Alert className="flash-message" variant="danger">
        <ul>
          {errors.map((error, index) => (
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
