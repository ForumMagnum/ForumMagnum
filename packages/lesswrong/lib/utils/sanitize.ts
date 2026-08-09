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

function isLocalNetworkIpv4(hostname: string): boolean {
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) {
    return false;
  }

  const octets = hostname.split('.').map(Number);
  const first = octets[0] ?? -1;
  const second = octets[1] ?? -1;
  if (octets.some((octet) => octet > 255)) {
    return false;
  }

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    first >= 224
  );
}

function mappedIpv4FromIpv6(hostname: string): string | null {
  const match = hostname.match(/^::(?:ffff:)?([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (!match) {
    return null;
  }

  const high = Number.parseInt(match[1], 16);
  const low = Number.parseInt(match[2], 16);
  return [
    high >> 8,
    high & 0xff,
    low >> 8,
    low & 0xff,
  ].join('.');
}

function isLocalNetworkIpv6(hostname: string): boolean {
  const unbracketedHostname = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  const mappedIpv4 = mappedIpv4FromIpv6(unbracketedHostname);
  if (mappedIpv4) {
    return isLocalNetworkIpv4(mappedIpv4);
  }

  const firstGroup = Number.parseInt(unbracketedHostname.split(':')[0], 16);
  return (
    unbracketedHostname === '::' ||
    unbracketedHostname === '::1' ||
    (firstGroup >= 0xfc00 && firstGroup <= 0xfdff) ||
    (firstGroup >= 0xfe80 && firstGroup <= 0xfebf)
  );
}

export function isLocalNetworkUrl(urlString: string): boolean {
  let url: URL;
  try {
    url = new URL(urlString, 'https://example.com');
  } catch {
    return false;
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  return (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.home.arpa') ||
    isLocalNetworkIpv4(hostname) ||
    isLocalNetworkIpv6(hostname)
  );
}

function srcsetHasLocalNetworkUrl(srcset: string): boolean {
  return srcset.split(',').some((candidate) => {
    const [url] = candidate.trim().split(/\s+/);
    return url ? isLocalNetworkUrl(url) : false;
  });
}

function sanitizeImageTag(tagName: string, attribs: Record<string, string>) {
  const hasLocalNetworkSource =
    (attribs.src !== undefined && isLocalNetworkUrl(attribs.src)) ||
    (attribs.srcset !== undefined && srcsetHasLocalNetworkUrl(attribs.srcset));

  return {
    tagName,
    attribs: hasLocalNetworkSource ? {} : attribs,
  };
}

function sanitizeIframeTag(tagName: string, attribs: Record<string, string>) {
  const srcdoc = attribs.srcdoc;
  if (srcdoc !== undefined) {
    if (attribs['data-lexical-iframe-widget'] !== 'true') {
      return {
        tagName: 'div',
        attribs: {},
        text: '',
      };
    }

    const sanitizedAttribs: Record<string, string> = {
      srcdoc,
      sandbox: 'allow-scripts',
      'data-lexical-iframe-widget': 'true',
    };
    if (attribs.title) {
      sanitizedAttribs.title = attribs.title;
    }
    return {
      tagName,
      attribs: sanitizedAttribs,
    };
  }

  return {
    tagName,
    attribs,
  };
}

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
      span: ['style', 'id', 'role', 'class', 'data-mention-kind', 'data-mention-id', 'data-mention-title'],
      pre: ['class', 'data-language', 'data-highlight-language', 'data-theme', 'data-gutter', 'spellcheck', 'style'],
      code: ['class', 'data-language', 'data-highlight-language', 'data-theme', 'data-gutter', 'spellcheck'],
      div: ['class', 'data-oembed-url', 'data-elicit-id', 'data-metaculus-id', 'data-manifold-slug', 'data-metaforecast-slug', 'data-owid-slug', 'data-viewpoints-slug', 'data-props', 'data-review-results', 'data-model-name'],
      a: ['class', 'href', 'name', 'target', 'rel', 'data-href'],
      iframe: ['src', 'allowfullscreen', 'allow', 'srcdoc', 'sandbox', 'title', 'data-lexical-iframe-widget'],
      li: ['id', 'role', 'value'],

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
    transformTags: {
      iframe: sanitizeIframeTag,
      img: sanitizeImageTag,
    },
    // Tag transformers may strip unsafe source values to empty attrs, and we want those empty wrappers removed.
    exclusiveFilter: (element) => {
      if (element.tag === 'img') {
        const attribs = element.attribs ?? {};
        return attribs.src === undefined && attribs.srcset === undefined;
      }
      if (element.tag !== 'iframe') {
        return false;
      }

      const attribs = element.attribs ?? {};
      const hasSrcdoc = attribs.srcdoc !== undefined;
      if (hasSrcdoc) {
        // srcdoc iframes are only allowed for lexical widgets.
        return attribs['data-lexical-iframe-widget'] !== 'true';
      }

      return attribs.src === undefined;
    },
    allowedClasses: {
      span: [
        'footnote-reference',
        'footnote-label',
        'footnote-back-link',
        'math-tex',
        'research-mention',
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
        'youtube-preview',
        'review-results-table',
        'conditionallyVisibleBlock',
        'defaultVisible',
        'defaultHidden',
        'table-scrollable-wrapper',
        'table-scroll-right',
        'table-scroll-left',
        'table-scroll-middle',
        'table-cell-action-button-container',
        'table-cell-resizer',
        'llm-content-block',
        'llm-content-block-content',
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
      pre: {
        '--gutter-chars': [/^\d+$/],
      },
      span: {
        // From: https://gist.github.com/olmokramer/82ccce673f86db7cda5e#gistcomment-3119899
        color: [/([a-z]+|#([\da-f]{3}){1,2}|(rgb|hsl)a\((\d{1,3}%?,\s?){3}(1|0?\.\d+)\)|(rgb|hsl)\(\d{1,3}%?(,\s?\d{1,3}%?){2}\))/]
      },
    }
  });
};

// Allowlist sanitizer for moderator-authored "rejection reason" strings on
// Posts and Comments. These fields are rendered raw on /moderation, but go
// through this sanitizer at write time so a compromised mod account cannot
// produce stored XSS. The allowlist covers basic rich-text formatting that
// historical CKEditor and current Lexical output produce; in particular
// Lexical emits <em>/<u>/<s> for italic/underline/strikethrough and adds
// `target` to outbound links.
export const sanitizeRejectionReason = function(s: string): string {
  return sanitizeHtml(s, {
    allowedTags: [
      'a', 'b', 'blockquote', 'br', 'em', 'i', 'li', 'ol', 'p', 's', 'span', 'strong', 'u', 'ul',
    ],
    allowedAttributes: {
      a: ['href', 'rel', 'target'],
      li: ['data-list-item-id', 'value'],
      p: ['style'],
      span: ['style'],
      strong: ['style'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesAppliedToAttributes: ['href'],
    allowProtocolRelative: false,
    allowedStyles: {
      p: {
        'white-space': [/^(pre-wrap|pre|normal|nowrap)$/],
        'text-align': [/^(start|end|left|right|center|justify)$/],
      },
      span: {
        'white-space': [/^(pre-wrap|pre|normal|nowrap)$/],
        'text-align': [/^(start|end|left|right|center|justify)$/],
      },
      strong: {
        'white-space': [/^(pre-wrap|pre|normal|nowrap)$/],
        'text-align': [/^(start|end|left|right|center|justify)$/],
      },
    },
  });
};

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
