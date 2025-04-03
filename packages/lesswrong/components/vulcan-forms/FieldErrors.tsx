import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.errorStyle
  }
})

const FieldErrors = ({ errors, getLabel, classes }: {
  errors: any[]
  getLabel: (fieldName: string, fieldLocale?: any) => string,
  classes: ClassesType<typeof styles>
}) => (
  <ul className={classNames(classes.root, "form-input-errors")}>
    {errors.map((error, index) => (
      <li key={index}>
        <Components.FormError error={error} errorContext="field" getLabel={getLabel} />
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
