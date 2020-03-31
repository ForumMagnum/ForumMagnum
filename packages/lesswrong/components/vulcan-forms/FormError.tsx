import React from 'react';
import PropTypes from 'prop-types';
import getContext from 'recompose/getContext';
import { registerComponent } from '../../lib/vulcan-lib';
import { FormattedMessage } from '../../lib/vulcan-i18n';

const FormError = ({ error, errorContext, getLabel }: {
  error: any,
  errorContext: any,
  getLabel?: any,
}) => {
  if (error.message) {
    return error.message;
  }
  // in case this is a nested fields, only keep last segment of path
  const errorName = error.properties.name.split('.').slice(-1)[0];
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
;};

(FormError as any).defaultProps = {
  errorContext: '', // default context so format message does not complain
  getLabel: name => name,
};

// TODO: pass getLabel as prop instead for consistency?
const FormErrorComponent = registerComponent('FormError', FormError, {
  hocs: [
    getContext({
      getLabel: PropTypes.func,
    })
  ]
});


declare global {
  interface ComponentTypes {
    FormError: typeof FormErrorComponent
  }
}
