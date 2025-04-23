import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import { siteUrlSetting } from '../instanceSettings';
import { DatabasePublicSetting } from '../publicSettings';
import sanitizeHtml from 'sanitize-html';
import { getUrlClass } from '@/server/utils/getUrlClass';

export const logoUrlSetting = new DatabasePublicSetting<string | null>('logoUrl', null)

// @summary Convert a camelCase string to a space-separated capitalized string
// See http://stackoverflow.com/questions/4149276/javascript-camelcase-to-regular-form
export const camelToSpaces = function (str: string): string {
  return str.replace(/([A-Z])/g, ' $1').replace(/^./, function(str){ return str.toUpperCase(); });
};

// Convert a dash separated string to camelCase.
export const dashToCamel = function (str: string): string {
  return str.replace(/(-[a-z])/g, function($1){return $1.toUpperCase().replace('-','');});
};

// Convert a string to camelCase and remove spaces.
export const camelCaseify = function<T extends string>(str: T): CamelCaseify<T> {
  const camelCaseStr = dashToCamel(str.replace(' ', '-'));
  const lowerCamelCaseStr = camelCaseStr.slice(0,1).toLowerCase() + camelCaseStr.slice(1);
  return lowerCamelCaseStr as CamelCaseify<T>;
};

export type CamelCaseify<T extends string> = T extends `${infer Prefix}-${infer Rest}`
  ? `${Uncapitalize<Prefix>}${Capitalize<CamelCaseify<Rest>>}`
  : Uncapitalize<T>;

// Capitalize a string.
export const capitalize = function(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

//////////////////////////
// URL Helper Functions //
//////////////////////////

/**
 * @summary Returns the user defined site URL or Meteor.absoluteUrl. Add trailing '/' if missing
 */
export const getSiteUrl = function (): string {
  let url = siteUrlSetting.get();
  if (url.slice(-1) !== '/') {
    url += '/';
  }
  return url;
};

export const makeAbsolute = function (url: string): string {
  const baseUrl = getSiteUrl();
  if (url.startsWith("/"))
    return baseUrl+url.substr(1);
  else
    return baseUrl+url;
}

const tryToFixUrl = (oldUrl: string, newUrl: string) => {
  try {
    // Only return the edited version if this actually fixed the problem
    new URL(newUrl);
    return newUrl;
  } catch (e) {
    return oldUrl;
  }
}

// NOTE: validateUrl and tryToFixUrl are duplicates of the code in ckEditor/src/url-validator-plugin.js,
// which can't be imported directly because it is part of the editor bundle
export const validateUrl = (url: string) => {
  try {
    // This will validate the URL - importantly, it will fail if the
    // protocol is missing
    new URL(url);
  } catch (e) {
    if (url.search(/[^@]+@[^.]+\.[^\n\r\f]+$/) === 0) {
      // Add mailto: to email addresses
      return tryToFixUrl(url, `mailto:${url}`);
    } else if (url.search(/\/.*/) === 0) {
      // This is probably _meant_ to be relative. We could prepend the
      // siteUrl from instanceSettings, but this seems unnecessarily
      // risky - let's just do nothing.
    } else if (url.search(/(https?:)?\/\//) !== 0) {
      // Add https:// to anything else
      return tryToFixUrl(url, `https://${url}`);
    }
  }

  return url;
}

/**
 * @summary The global namespace for Vulcan utils.
 * @param {String} url - the URL to redirect
 */
export const getOutgoingUrl = function (url: string): string {
  // If no protocol is specified, guess that it is https://
  const cleanedUrl = validateUrl(url);

  return getSiteUrl() + 'out?url=' + encodeURIComponent(cleanedUrl);
};

export const getDomain = function(url: string | null): string|null {
  if (!url) return null;
  try {
    const URLClass = getUrlClass()
    const hostname = new URLClass(url).hostname
    return hostname!.replace('www.', '');
  } catch (error) {
    return null;
  }
};

// add http: if missing
export const addHttp = function (url: string): string|null {
  try {
    if (url.substring(0, 5) !== 'http:' && url.substring(0, 6) !== 'https:') {
      url = 'http:'+url;
    }
    return url;
  } catch (error) {
    return null;
  }
};

// https://stackoverflow.com/questions/16301503/can-i-use-requirepath-join-to-safely-concatenate-urls
// for searching: url-join
/** Combine urls without extra /s at the join */
export const combineUrls = (baseUrl: string, path: string) => {
  return path
    ? baseUrl.replace(/\/+$/, '') + '/' + path.replace(/^\/+/, '')
    : baseUrl;
}

// Remove query and anchor tags from path
export const getBasePath = (path: string) => {
  return path.split(/[?#]/)[0]
}

/////////////////////////////
// String Helper Functions //
/////////////////////////////

// http://stackoverflow.com/questions/2631001/javascript-test-for-existence-of-nested-object-key
export const checkNested: any = function(obj: AnyBecauseTodo /*, level1, level2, ... levelN*/) {
  var args = Array.prototype.slice.call(arguments);
  obj = args.shift();

  for (var i = 0; i < args.length; i++) {
    if (!obj.hasOwnProperty(args[i])) {
      return false;
    }
    obj = obj[args[i]];
  }
  return true;
};

// see http://stackoverflow.com/questions/8051975/access-object-child-properties-using-a-dot-notation-string
export const getNestedProperty = function (obj: any, desc: string) {
  var arr = desc.split('.');
  while(arr.length && (obj = obj[arr.shift()!]));
  return obj;
};

export const getLogoUrl = (): string|undefined => {
  const logoUrl = logoUrlSetting.get()
  if (logoUrl) {
    const prefix = getSiteUrl().slice(0,-1);
    // the logo may be hosted on another website
    return logoUrl.indexOf('://') > -1 ? logoUrl : prefix + logoUrl;
  }
};

export const encodeIntlError = (error: AnyBecauseTodo) => typeof error !== 'object' ? error : JSON.stringify(error);

export const decodeIntlError = (error: AnyBecauseTodo, options = {stripped: false}) => {
  try {
    // do we get the error as a string or as an error object?
    let strippedError = typeof error === 'string' ? error : error.message;

    // if the error hasn't been cleaned before (ex: it's not an error from a form)
    if (!options.stripped) {
      // strip the "GraphQL Error: message [error_code]" given by Apollo if present
      const graphqlPrefixIsPresent = strippedError.match(/GraphQL error: (.*)/);
      if (graphqlPrefixIsPresent) {
        strippedError = graphqlPrefixIsPresent[1];
      }

      // strip the error code if present
      const errorCodeIsPresent = strippedError.match(/(.*)\[(.*)\]/);
      if (errorCodeIsPresent) {
        strippedError = errorCodeIsPresent[1];
      }
    }

    // the error is an object internationalizable
    const parsedError = JSON.parse(strippedError);

    // check if the error has at least an 'id' expected by react-intl
    if (!parsedError.id) {
      console.error('[Undecodable error]', error); // eslint-disable-line
      return {id: 'app.something_bad_happened', value: '[undecodable error]'};
    }

    // return the parsed error
    return parsedError;
  } catch(__) {
    // the error is not internationalizable
    return error;
  }
};

export const isPromise = (value: any): value is Promise<any> => isFunction(get(value, 'then'));

export const removeProperty = (obj: any, propertyName: string): void => {
  for(const prop in obj) {
    if (prop === propertyName){
      delete obj[prop];
    } else if (typeof obj[prop] === 'object') {
      removeProperty(obj[prop], propertyName);
    }
  }
};

export type UpdateSelector = {
  _id: string;
  documentId: null;
} | {
  _id: null;
  documentId: string;
};

function isDocumentIdSelector(selector: UpdateSelector): selector is { _id: null; documentId: string } {
  return !selector._id;
}

/**
 * Given a mongodb-style selector, if it contains `documentId`, replace that
 * with `_id`. This is a silly thing to do and a terrible hack; it's
 * particularly terrible since `documentId` is an actual field name on some
 * collections, corresponding to a foreign-key relation, eg on Votes it's the
 * voted-on object. The reason this is here is because Vulcan did it (in
 * `Connectors`, under the function name `convertUniqueSelector`), in a place
 * where it leaks into the external API, where it might be used by GreaterWrong
 * and other API users. So in order to remove this feature safely we need to
 * remove it in two steps, first logging if any selectors are actually
 * converted this way.
 *
 * If the change that got rid of `Connectors` has been deployed for awhile,
 * and the console-log warning from this function isn't appearing in logs, then
 * this function is a no-op and is safe to remove.
 */
export const convertDocumentIdToIdInSelector = (selector: UpdateSelector): { _id: string } => {
  if (isDocumentIdSelector(selector)) {
    //eslint-disable-next-line no-console
    console.log("Warning: Performed documentId-to-_id replacement");
    const { documentId, ...rest } = selector;
    const result = { ...rest, _id: documentId };
    return result;
  }
  return selector;
};

/**
 * Sanitizing html
 */
export const sanitizeAllowedTags = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul',
  'ol', 'nl', 'li', 'b', 'i', 'u', 'strong', 'em', 'strike', 's',
  'code', 'hr', 'br', 'div', 'table', 'thead', 'caption',
  'tbody', 'tr', 'th', 'td', 'pre', 'img', 'figure', 'figcaption',
  'section', 'span', 'sub', 'sup', 'ins', 'del', 'iframe', 'audio',
  'details', 'summary',
  
  //MathML elements (https://developer.mozilla.org/en-US/docs/Web/MathML/Element)
  "math", "mi", "mn", "mo", "ms", "mspace", "mtext", "merror",
  "mfrac", "mpadded", "mphantom", "mroot", "mrow", "msqrt", "mstyle",
  "mmultiscripts", "mover", "mprescripts", "msub", "msubsup", "msup", "munder",
  "munderover", "mtable", "mtd", "mtr",
]

const cssSizeRegex = /^(?:\d|\.)+(?:px|em|%)$/;

const allowedTableStyles = {
  'background-color': [/^.*$/],
  'border-bottom': [/^.*$/],
  'border-left': [/^.*$/],
  'border-right': [/^.*$/],
  'border-top': [/^.*$/],
  'border': [/^.*$/],
  'border-color': [/^.*$/],
  'border-style': [/^.*$/],
  'width': [cssSizeRegex],
  'height': [cssSizeRegex],
  'text-align': [/^.*$/],
  'vertical-align': [/^.*$/],
  'padding': [/^.*$/],
};

const allowedMathMLGlobalAttributes = ['mathvariant', 'dir', 'displaystyle', 'scriptlevel'];
const footnoteAttributes = [
  'data-footnote-content',
  'data-footnote-id',
  'data-footnote-index',
  'data-footnote-item',
  'data-footnote-reference',
  'data-footnote-section',
  'data-footnote-back-link',
  'data-footnote-back-link-href',
]

export const sanitize = function(s: string): string {
  return sanitizeHtml(s, {
    allowedTags: sanitizeAllowedTags,
    allowedAttributes:  {
      ...sanitizeHtml.defaults.allowedAttributes,
      '*': [...footnoteAttributes, 'data-internal-id', 'data-visibility'],
      audio: [ 'controls', 'src', 'style' ],
      img: [ 'src' , 'srcset', 'alt', 'style'],
      figure: ['style', 'class'],
      table: ['style'],
      tbody: ['style'],
      tr: ['style'],
      td: ['rowspan', 'colspan', 'style'],
      th: ['rowspan', 'colspan', 'style'],
      ol: ['start', 'reversed', 'type', 'role'],
      span: ['style', 'id', 'role'],
      div: ['class', 'data-oembed-url', 'data-elicit-id', 'data-metaculus-id', 'data-manifold-slug', 'data-metaforecast-slug', 'data-owid-slug', 'data-viewpoints-slug'],
      a: ['class', 'href', 'name', 'target', 'rel', 'data-href'],
      iframe: ['src', 'allowfullscreen', 'allow'],
      li: ['id', 'role'],

      // Attributes for dialogues
      section: ['class', 'message-id', 'user-id', 'user-order', 'submitted-date', 'display-name'],
      
      // Attributes for collapsible sections
      details: ['class'],
      summary: ['class'],
      
      // Attributes for MathML elements
      math: [...allowedMathMLGlobalAttributes, 'display'],
      mi: allowedMathMLGlobalAttributes,
      mn: allowedMathMLGlobalAttributes,
      mtext: allowedMathMLGlobalAttributes,
      merror: allowedMathMLGlobalAttributes,
      mfrac: [...allowedMathMLGlobalAttributes, 'linethickness'],
      mmultiscripts: allowedMathMLGlobalAttributes,
      mo: [...allowedMathMLGlobalAttributes, 'fence', 'largeop', 'lspace', 'maxsize', 'minsize', 'movablelimits', 'rspace', 'separator', 'stretchy', 'symmetric'],
      mover: [...allowedMathMLGlobalAttributes, 'accent'],
      mpadded: [...allowedMathMLGlobalAttributes, 'depth','height','lspace','voffset','width'],
      mphantom: allowedMathMLGlobalAttributes,
      mprescripts: allowedMathMLGlobalAttributes,
      mroot: allowedMathMLGlobalAttributes,
      mrow: allowedMathMLGlobalAttributes,
      ms: [...allowedMathMLGlobalAttributes, 'lquote','rquote'],
      mspace: [...allowedMathMLGlobalAttributes, 'depth','height','width'],
      msqrt: allowedMathMLGlobalAttributes,
      mstyle: allowedMathMLGlobalAttributes,
      msub: allowedMathMLGlobalAttributes,
      msubsup: allowedMathMLGlobalAttributes,
      msup: allowedMathMLGlobalAttributes,
      mtable: allowedMathMLGlobalAttributes,
      mtd: [...allowedMathMLGlobalAttributes, 'columnspan','rowspan'],
      mtr: allowedMathMLGlobalAttributes,
      munder: [...allowedMathMLGlobalAttributes, 'accentunder'],
      munderover: [...allowedMathMLGlobalAttributes, 'accent','accentunder'],
    },
    allowedIframeHostnames: [
      'www.youtube.com', 'youtube.com',
      'd3s0w6fek99l5b.cloudfront.net', // Metaculus CDN that provides the iframes
      'metaculus.com',
      'manifold.markets',
      'metaforecast.org',
      'app.thoughtsaver.com',
      'ourworldindata.org',
      'strawpoll.com',
      'estimaker.app',
      'viewpoints.xyz',
      'calendly.com',
      'neuronpedia.org',
      'lwartifacts.vercel.app'
    ],
    allowedClasses: {
      span: [ 'footnote-reference', 'footnote-label', 'footnote-back-link', "math-tex" ],
      div: [
        'spoilers',
        'footnote-content',
        'footnote-item',
        'footnote-label',
        'footnote-reference',
        'metaculus-preview',
        'manifold-preview',
        'neuronpedia-preview',
        'metaforecast-preview',
        'owid-preview',
        'elicit-binary-prediction',
        'thoughtSaverFrameWrapper',
        'strawpoll-embed',
        'estimaker-preview',
        'viewpoints-preview',
        'ck-cta-button',
        'ck-cta-button-centered',
        'ck-poll',
        'detailsBlockContent',
        'calendly-preview',
        'conditionallyVisibleBlock',
        'defaultVisible',
        'defaultHidden',
        /arb-custom-script-[a-zA-Z0-9]*/,
      ],
      iframe: [ 'thoughtSaverFrame' ],
      ol: [ 'footnotes', 'footnote-section' ],
      li: [ 'footnote-item' ],
      details: ['detailsBlock'],
      summary: ['detailsBlockTitle'],
    },
    allowedStyles: {
      figure: {
        'width': [cssSizeRegex],
        'height': [cssSizeRegex],
        'padding': [/^.*$/],
      },
      img: {
        'width': [cssSizeRegex],
        'height': [cssSizeRegex],
        'max-width': [cssSizeRegex],
        'max-height': [cssSizeRegex],
        'padding': [/^.*$/],
      },
      table: {
        ...allowedTableStyles,
      },
      td: {
        ...allowedTableStyles,
      },
      th: {
        ...allowedTableStyles,
      },
      span: {
        // From: https://gist.github.com/olmokramer/82ccce673f86db7cda5e#gistcomment-3119899
        color: [/([a-z]+|#([\da-f]{3}){1,2}|(rgb|hsl)a\((\d{1,3}%?,\s?){3}(1|0?\.\d+)\)|(rgb|hsl)\(\d{1,3}%?(,\s?\d{1,3}%?){2}\))/]
      },
    }
  });
};
