import React, { useEffect, useRef } from 'react';
import classNames from 'classnames';
import { Alert } from './Alert';
import { FormError } from './FormError';
import { defineStyles, useStyles } from '../hooks/useStyles';
import withErrorBoundary from '../common/withErrorBoundary';
import { registerComponent } from '@/lib/vulcan-lib/components';

const styles = defineStyles('FormErrors', (theme: ThemeType) => ({
  root: {
    ...theme.typography.errorStyle
  }
}));

const FormErrorsInner = ({ errors }: {
  errors: any[]
}) => {
  const classes = useStyles(styles);
  const rootRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (errors.length > 0) {
      rootRef.current?.scrollIntoView();
    }
  }, [errors.length]);
  
  return (
    <div className={classNames(classes.root, "form-errors")} ref={rootRef}>
      {!!errors.length && (
        <Alert>
          <ul>
            {errors.map((error, index) => 
              <FormError key={index} error={error} errorContext="form" />
            )}
          </ul>
        </Alert>
      )}
    </div>
  );
};

export const FormErrors = registerComponent("FormErrors", FormErrorsInner, {
  hocs: [withErrorBoundary],
});
