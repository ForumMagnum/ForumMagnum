// see https://github.com/apollographql/graphql-tools/blob/master/docs/source/schema-directives.md#marking-strings-for-internationalization

import { localeSetting } from '../../lib/publicSettings';
import { loggerConstructor } from '../../lib/utils/logging';

const logger = loggerConstructor('intl')

/*

Take a header object, and figure out the locale

Also accepts userLocale to indicate the current user's preferred locale

*/
export const getHeaderLocale = (headers: Record<string,string>, userLocale: string|null) => {
  let cookieLocale, acceptedLocale, locale, localeMethod;

  // get locale from cookies
  if (headers['cookie']) {
    const cookies: any = {};
    headers['cookie'].split('; ').forEach((c: string) => {
      const cookieArray = c.split('=');
      cookies[cookieArray[0]] = cookieArray[1];
    });
    cookieLocale = cookies.locale;
  }

  // get locale from accepted-language header
  if (headers['accept-language']) {
    const acceptedLanguages = headers['accept-language'].split(',').map((l: string) => l.split(';')[0]);
    acceptedLocale = acceptedLanguages[0]; // for now only use the highest-priority accepted language
  }

  if (headers.locale) {
    locale = headers.locale;
    localeMethod = 'header';
  } else if (cookieLocale) {
    locale = cookieLocale;
    localeMethod = 'cookie';
  } else if (userLocale) {
    locale = userLocale;
    localeMethod = 'user';
  } else if (acceptedLocale) {
    locale = acceptedLocale;
    localeMethod = 'browser';
  } else {
    locale = localeSetting.get();
    localeMethod = 'setting';
  }

  logger(`// locale: ${locale} (via ${localeMethod})`);

  return locale;
};
