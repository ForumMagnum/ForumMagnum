const disallowedProtocols = [
  'javascript:',
  'data:',
  'file:',
  'vbscript:',
  'blob:',
];

/**
 * Validates the given URL and returns a (possibly fixed) version. In strict mode
 * it will throw an error if it isn't possible to fix the url, otherwise it will
 * return the original
 *
 * @returns {string} The original or fixed URL if validation succeeds, or throws an error.
 */
export function validateUrl(url: string, strict=false) {
  try {
    const parsedUrl = new URL(url);

    if (strict && disallowedProtocols.includes(parsedUrl.protocol.toLowerCase())) {
      throw new Error('Disallowed protocol');
    }
  } catch (e) {
    if (url.search(/[^@]+@[^.]+\.[^\n\r\f]+$/) === 0) {
      // Add mailto: to email addresses
      return tryToFixUrl(url, `mailto:${url}`, strict);
    } else if (url.search(/\/.*/) === 0) {
      // This is probably _meant_ to be relative. We could prepend the
      // siteUrl from instanceSettings, but this seems unnecessarily
      // risky - let's just do nothing.
    } else if (url.search(/(https?:)?\/\//) !== 0) {
      // Add https:// to anything else
      return tryToFixUrl(url, `https://${url}`, strict);
    } else if (strict) {
      throw e;
    }
  }

  return url;
}

function tryToFixUrl(oldUrl: string, newUrl: string, strict=false) {
  try {
    // Only return the edited version if this actually fixed the problem
    const parsedUrl = new URL(newUrl);

    if (strict && disallowedProtocols.includes(parsedUrl.protocol.toLowerCase())) {
      throw new Error('Disallowed protocol');
    }
    return newUrl;
  } catch (e) {
    if (strict) {
      throw e;
    }
    return oldUrl;
  }
}
