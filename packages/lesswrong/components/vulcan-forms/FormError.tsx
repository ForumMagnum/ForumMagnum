import React from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from '../../lib/vulcan-lib/components';
import FormattedMessage from '../../lib/vulcan-i18n/message';

const FormError = ({ error, errorContext="", getLabel }: {
  error: any,
  errorContext: any,
  getLabel: (fieldName: string, fieldLocale?: any) => string,
}) => {
  if (error.message) { // A normal string error
    return error.message;
  } else if (error.id) { // An internationalized error
    // in case this is a nested fields, only keep last segment of path
    const errorName = error.properties?.name && error.properties.name.split('.').slice(-1)[0];
    return (
      <FormattedMessage
        id={error.id}
        values={{
          errorContext,
          label: error.properties && getLabel(errorName, error.properties.locale),
          ...error.data, // backwards compatibility
          ...error.properties,
        }}
        defaultMessage={JSON.stringify(error)}
      />
    )
  } else if (error.operationName) {
    return `Error submitting form: ${error.operationName}`;
  } else {
    return 'Error submitting form';
  }
};


// TODO: pass getLabel as prop instead for consistency?
const FormErrorComponent = registerComponent('FormError', FormError);


declare global {
  interface ComponentTypes {
    FormError: typeof FormErrorComponent
  }
}
