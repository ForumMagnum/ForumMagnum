import { loggerConstructor } from '../utils/logging';
import { i18nStrings } from '../vulcan-i18n-en-us';

const logger = loggerConstructor('intl')

function replaceAll(target: AnyBecauseTodo, search: AnyBecauseTodo, replacement: AnyBecauseTodo) {
  return target.replace(new RegExp(search, 'g'), replacement);
}

export const getString = ({id, values, defaultMessage, locale}: AnyBecauseTodo) => {
  const messages = i18nStrings || {};
  let message = messages[id];

  // use default locale
  if(!message) {
    logger(`\x1b[32m>> INTL: No string found for id "${id}" in locale "${locale}".\x1b[0m`);
  }

  if (message && values) {
    Object.keys(values).forEach(key => {
      message = replaceAll(message, `{${key}}`, values[key]);
    });
  }
  return message || defaultMessage;
};
