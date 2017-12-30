import React, { Component } from 'react';
import { getSetting, Strings } from 'meteor/vulcan:lib';

const FormattedMessage = ({ id, values, defaultMessage }) => {
  const messages = Strings[getSetting('locale', 'en')] || {};
  let message = messages[id] || defaultMessage;
  // LESSWRONG - this didn't have a message, which broke the frontpage. unclear if we should fix
  if (values && message) {
    _.forEach(values, (value, key) => {
      message = message.replace(`{${key}}`, value);
    });
  }
  return <span className="i18n-message">{message}</span>
}

export default FormattedMessage;
