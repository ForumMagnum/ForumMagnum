import React from 'react';
import FormattedMessage from '../../lib/vulcan-i18n/message';

export const FormError = ({ error, errorContext="" }: {
  error: any,
  errorContext: any,
}) => {
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
