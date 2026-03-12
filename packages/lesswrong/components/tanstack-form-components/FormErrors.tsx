import React, { useEffect, useRef } from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';
import withErrorBoundary from '../common/withErrorBoundary';
import { registerComponent } from '@/lib/vulcan-lib/components';
import FormattedMessage from '../../lib/vulcan-i18n/message';
import { CombinedGraphQLErrors } from '@apollo/client';

const styles = defineStyles('FormErrors', (theme: ThemeType) => ({
  root: {
    ...theme.typography.errorStyle
  },
  alert: {
    color: theme.palette.error.main,
  },
}));

export const FormErrorsInner = ({ errors }: {
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
        <div className={classes.alert}>
          <ul>
            {errors.map((error, index) => 
              <FormError key={index} error={error} errorContext="form" />
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

const FormError = ({ error, errorContext="" }: {
  error: any,
  errorContext: any,
}) => {
  if (error instanceof CombinedGraphQLErrors) {
    return <>{error.errors.map((err,i) => <FormError
      key={i}
      error={err}
      errorContext={errorContext}
    />)}</>
  }

  if (isJsonString(error.message)) {
    const parsed = JSON.parse(error.message);
    if (Array.isArray(parsed)) {
      return <>{parsed.map((err, i) => <FormError
        key={i}
        error={err}
        errorContext={errorContext}
      />)}</>;
    } else {
      return <FormError
        error={parsed}
        errorContext={errorContext}
      />
    }
  } else if (error.message) { // A normal string error
    return <li>{error.message}</li>
  } else if (error.id) { // An internationalized error
    return <li>
      <FormattedMessage
        id={error.id}
        values={{
          errorContext,
          label: error.properties?.name,
          ...error.data, // backwards compatibility
          ...error.properties,
        }}
        defaultMessage={JSON.stringify(error)}
      />
    </li>
  } else if (error.operationName) {
    return <li>{`Error submitting form: ${error.operationName}`}</li>
  } else {
    return <li>Error submitting form</li>
  }
};

function isJsonString(s: string) {
  try {
    JSON.parse(s);
    return true;
  } catch {
    return false;
  }
}

export const FormErrors = registerComponent("FormErrors", FormErrorsInner, {
  hocs: [withErrorBoundary],
});
