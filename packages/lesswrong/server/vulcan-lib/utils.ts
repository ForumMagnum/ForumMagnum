import sanitizeHtml from 'sanitize-html';
import { Utils } from '../../lib/vulcan-lib/utils';
import { throwError } from './errors';

export const sanitizeAllowedTags = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul',
  'ol', 'nl', 'li', 'b', 'i', 'u', 'strong', 'em', 'strike',
  'code', 'hr', 'br', 'div', 'table', 'thead', 'caption',
  'tbody', 'tr', 'th', 'td', 'pre', 'img', 'figure', 'figcaption'
]

export const sanitize = function(s) {
  return sanitizeHtml(s, {
    allowedTags: sanitizeAllowedTags,
    allowedAttributes:  {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: [ 'src' , 'srcset'],
      figure: ['style']
    },
    allowedStyles: {
      ...sanitizeHtml.defaults.allowedStyles,
      'figure': {
        'width': [/^(?:\d|\.)+(?:px|em|%)$/]
      }
    }
  });
};

Utils.performCheck = (operation, user, checkedObject, context, documentId, operationName, collectionName) => {

  if (!checkedObject) {
    throwError({ id: 'app.document_not_found', data: { documentId, operationName } });
  }

  if (!operation(user, checkedObject, context)) {
    throwError({ id: 'app.operation_not_allowed', data: { documentId, operationName } });
  }

};

export { Utils };
