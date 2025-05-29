import React from 'react';
import classNames from 'classnames';
import { Alert } from './Alert';
import { FormError } from './FormError';
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles('FormErrors', (theme: ThemeType) => ({
  root: {
    ...theme.typography.errorStyle
  }
}));

export const FormErrors = ({ errors, getLabel }: {
  errors: any[]
  getLabel: (fieldName: string, fieldLocale?: any) => string,
}) => {
  const classes = useStyles(styles);
  return (
    <div className={classNames(classes.root, "form-errors")}>
      {!!errors.length && (
        <Alert>
          <ul>
            {errors.map((error, index) => (
              <li key={index}>
                <FormError error={error} errorContext="form" getLabel={getLabel} />
              </li>
            ))}
          </ul>
        </Alert>
      )}
    </div>
  );
};

