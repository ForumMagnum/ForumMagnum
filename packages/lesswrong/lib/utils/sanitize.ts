import sanitizeHtml from 'sanitize-html';

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
      span: ['style', 'id', 'role', 'class'],
      pre: ['class', 'data-language', 'data-highlight-language', 'data-theme', 'data-gutter', 'spellcheck'],
      code: ['class', 'data-language', 'data-highlight-language', 'data-theme', 'data-gutter', 'spellcheck'],
      div: ['class', 'data-oembed-url', 'data-elicit-id', 'data-metaculus-id', 'data-manifold-slug', 'data-metaforecast-slug', 'data-owid-slug', 'data-viewpoints-slug', 'data-props'],
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
      'www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com', 'youtube-nocookie.com',
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
      span: [
        'footnote-reference',
        'footnote-label',
        'footnote-back-link',
        'math-tex',
        'code-token-comment',
        'code-token-deleted',
        'code-token-inserted',
        'code-token-unchanged',
        'code-token-punctuation',
        'code-token-property',
        'code-token-selector',
        'code-token-operator',
        'code-token-attr',
        'code-token-variable',
        'code-token-function',
      ],
      pre: ['code-block'],
      code: ['code-block'],
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
        'lwartifacts-preview',
        'conditionallyVisibleBlock',
        'defaultVisible',
        'defaultHidden',
        'table-scrollable-wrapper',
        'table-scroll-right',
        'table-scroll-left',
        'table-scroll-middle',
        'table-cell-action-button-container',
        'table-cell-resizer',
        /arb-custom-script-[a-zA-Z0-9]*/,
      ],
      table: [
        'editor-table',
        'table-selected',
        'table-selection',
        'table-row-striping',
        'table-frozen-column',
        'table-frozen-row',
        'table-alignment-center',
        'table-alignment-right',
      ],
      tr: ['table-row-striping'],
      td: ['table-cell', 'table-cell-selected'],
      th: ['table-cell', 'table-cell-header', 'table-cell-selected'],
      button: ['table-add-columns', 'table-add-rows', 'table-cell-action-button'],
      iframe: [ 'thoughtSaverFrame' ],
      ol: [ 'footnotes', 'footnote-section' ],
      li: [ 'footnote-item', 'nested-list-item' ],
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
