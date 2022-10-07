import sanitizeHtml from 'sanitize-html';
import { Utils } from '../../lib/vulcan-lib/utils';
import { throwError } from './errors';

export const sanitizeAllowedTags = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul',
  'ol', 'nl', 'li', 'b', 'i', 'u', 'strong', 'em', 'strike', 's',
  'code', 'hr', 'br', 'div', 'table', 'thead', 'caption',
  'tbody', 'tr', 'th', 'td', 'pre', 'img', 'figure', 'figcaption',
  'section', 'span', 'sub', 'sup', 'ins', 'del', 'iframe'
]

const allowedTableStyles = {
  'background-color': [/^.*$/],
  'border-bottom': [/^.*$/],
  'border-left': [/^.*$/],
  'border-right': [/^.*$/],
  'border-top': [/^.*$/],
  'border': [/^.*$/],
  'border-color': [/^.*$/],
  'border-style': [/^.*$/],
  'width': [/^(?:\d|\.)+(?:px|em|%)$/],
  'height': [/^(?:\d|\.)+(?:px|em|%)$/],
  'text-align': [/^.*$/],
  'vertical-align': [/^.*$/],
  'padding': [/^.*$/],
};

export const sanitize = function(s: string): string {
  return sanitizeHtml(s, {
    allowedTags: sanitizeAllowedTags,
    allowedAttributes:  {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: [ 'src' , 'srcset'],
      figure: ['style', 'class'],
      table: ['style'],
      tbody: ['style'],
      tr: ['style'],
      td: ['rowspan', 'colspan', 'style'],
      th: ['rowspan', 'colspan', 'style'],
      ol: ['start', 'reversed', 'type', 'role'],
      span: ['style', 'id', 'role'],
      div: ['class', 'data-oembed-url', 'data-elicit-id', 'data-metaculus-id', 'data-manifold-slug', 'data-owid-slug'],
      a: ['href', 'name', 'target', 'rel'],
      iframe: ['src', 'allowfullscreen', 'allow'],
      li: ['id', 'role'],
    },
    allowedIframeHostnames: [
      'www.youtube.com', 'youtube.com', 
      'd3s0w6fek99l5b.cloudfront.net', // Metaculus CDN that provides the iframes
      'metaculus.com',
      'manifold.markets',
      'app.thoughtsaver.com',
      'ourworldindata.org',
    ],
    allowedClasses: {
      span: [ 'footnote-reference', 'footnote-label', 'footnote-back-link' ],
      div: [ 'spoilers', 'footnote-content', 'footnote-item', 'footnote-label', 'footnote-reference', 'metaculus-preview', 'manifold-preview', 'owid-preview', 'elicit-binary-prediction', 'thoughtSaverFrameWrapper' ],
      iframe: [ 'thoughtSaverFrame' ],
      ol: [ 'footnotes' ],
      li: [ 'footnote-item' ],
    },
    allowedStyles: {
      figure: {
        'width': [/^(?:\d|\.)+(?:px|em|%)$/],
        'height': [/^(?:\d|\.)+(?:px|em|%)$/],
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

Utils.performCheck = async <T extends DbObject>(
  operation: (user: DbUser|null, obj: T, context: any) => Promise<boolean>,
  user: DbUser|null,
  checkedObject: T,
  
  context: ResolverContext,
  documentId: string,
  operationName: string,
  collectionName: CollectionNameString
): Promise<void> => {
  if (!checkedObject) {
    throwError({ id: 'app.document_not_found', data: { documentId, operationName } });
  }

  if (!(await operation(user, checkedObject, context))) {
    throwError({ id: 'app.operation_not_allowed', data: { documentId, operationName } });
  }
};

export { Utils };
