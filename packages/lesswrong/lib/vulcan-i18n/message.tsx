import React from 'react';
import { formatMessage } from './provider';

const FormattedMessage = ({ id, values, defaultMessage = '', html = false, className = '' }: {
  id: string,
  values?: any,
  defaultMessage?: string,
  html?: boolean,
  className?: string
}) => {
  const message = formatMessage({ id, defaultMessage }, values);
  const cssClass = `i18n-message ${className}`;

  return html ? 
    <span className={cssClass} dangerouslySetInnerHTML={{__html: message}}/> :
    <span className={cssClass}>{message}</span>;
};

export default FormattedMessage;
