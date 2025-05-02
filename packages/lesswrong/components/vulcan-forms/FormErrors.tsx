import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.errorStyle
  }
})

const FormErrors = ({ errors, getLabel, classes }: {
  errors: any[]
  getLabel: (fieldName: string, fieldLocale?: any) => string,
  classes: ClassesType<typeof styles>
}) => (
  <div className={classNames(classes.root, "form-errors")}>
    {!!errors.length && (
      <Components.Alert>
        <ul>
          {errors.map((error, index) => (
            <li key={index}>
              <Components.FormError error={error} errorContext="form" getLabel={getLabel} />
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
