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

/**
 * Inline SVG support. This exists for diagrams made with Excalidraw (see
 * @/lib/lexical/excalidrawDiagrams), so it covers the parts of SVG that
 * Excalidraw's SVG export uses, and little else. In particular, there's no
 * <style>, <script>, <foreignObject> or animation elements, no event handler
 * attributes, and no references (href or url(...)) to anything other than
 * elements within the same SVG, except for links and embedded raster images.
 *
 * Note that the HTML parser lowercases tag and attribute names, so these are
 * lowercased here (eg "clippath" rather than "clipPath"). Browsers' HTML
 * parsers restore the correct casing for SVG elements and attributes.
 */
const svgTags = [
  'svg', 'g', 'defs', 'symbol', 'use', 'path', 'rect', 'text', 'image', 'mask', 'clippath',
];

const svgPresentationAttributes = [
  'fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width', 'stroke-opacity',
  'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'stroke-dashoffset',
  'stroke-miterlimit', 'opacity', 'transform', 'mask', 'clip-path',
];

const svgSizeAttributes = ['x', 'y', 'width', 'height'];

const svgAllowedAttributes: Record<string, string[]> = {
  svg: ['version', 'xmlns', 'viewbox', 'width', 'height', ...svgPresentationAttributes],
  g: svgPresentationAttributes,
  defs: [],
  symbol: ['id', 'viewbox'],
  use: ['href', ...svgSizeAttributes, 'opacity', 'transform'],
  path: ['d', ...svgPresentationAttributes],
  rect: [...svgSizeAttributes, 'rx', 'ry', ...svgPresentationAttributes],
  text: [
    ...svgSizeAttributes, 'font-family', 'font-size', 'font-weight', 'font-style',
    'text-anchor', 'direction', 'dominant-baseline', 'style', ...svgPresentationAttributes,
  ],
  image: ['href', ...svgSizeAttributes, 'preserveaspectratio', 'opacity', 'transform'],
  mask: ['id', 'maskunits', ...svgSizeAttributes, 'fill'],
  clippath: ['id', 'clippathunits'],
};

// The only url(...) values allowed are references to elements by ID, eg a
// mask="url(#mask-123)"
const svgLocalUrlReferenceRegex = /^url\(#[\w.-]+\)$/;
const svgLocalHrefRegex = /^#[\w.-]+$/;
const svgImageHrefRegex = /^data:image\/(?:png|jpeg|gif|webp|avif);base64,[A-Za-z0-9+/=\s]+$/;

function sanitizeSvgTag(tagName: string, attribs: Record<string, string>) {
  const sanitizedAttribs: Record<string, string> = {};
  for (const [name, value] of Object.entries(attribs)) {
    // Presentation attributes are parsed as CSS, where backslash escapes could
    // be used to disguise a url(...), so we don't allow them at all.
    if (value.includes('\\')) {
      continue;
    }
    if (value.toLowerCase().includes('url(') && !svgLocalUrlReferenceRegex.test(value)) {
      continue;
    }
    if (name === 'href') {
      const hrefRegex = tagName === 'image' ? svgImageHrefRegex : svgLocalHrefRegex;
      if (!hrefRegex.test(value)) {
        continue;
      }
    }
    sanitizedAttribs[name] = value;
  }
  return {
    tagName,
    attribs: sanitizedAttribs,
  };
}

const svgTransformTags = Object.fromEntries(
  svgTags.map((tag) => [tag, sanitizeSvgTag])
);

/**
 * MathJax CommonHTML output, as produced by renderMathInHtml (in
 * @/server/editor/conversionUtils), which passes its output through this
 * sanitizer. Equations are made of custom elements styled by MathJax's
 * stylesheet, plus the inline styles and attributes allowed here. The
 * attributes are the ones MathJax's stylesheet selects on.
 */
const mathJaxTags = [
  'mjx-container', 'mjx-math', 'mjx-c', 'mjx-utext', 'mjx-texatom', 'mjx-mi', 'mjx-mo',
  'mjx-mn', 'mjx-ms', 'mjx-mtext', 'mjx-mspace', 'mjx-mpadded', 'mjx-mphantom', 'mjx-mfrac',
  'mjx-frac', 'mjx-num', 'mjx-den', 'mjx-dbox', 'mjx-dtable', 'mjx-dstrut', 'mjx-nstrut',
  'mjx-line', 'mjx-msqrt', 'mjx-mroot', 'mjx-sqrt', 'mjx-surd', 'mjx-root', 'mjx-box',
  'mjx-mstyle', 'mjx-merror', 'mjx-maction', 'mjx-menclose', 'mjx-mfenced', 'mjx-msub',
  'mjx-msup', 'mjx-msubsup', 'mjx-munder', 'mjx-mover', 'mjx-munderover', 'mjx-under',
  'mjx-over', 'mjx-base', 'mjx-script', 'mjx-mmultiscripts', 'mjx-prescripts', 'mjx-scripts',
  'mjx-mprescripts', 'mjx-none', 'mjx-mtable', 'mjx-table', 'mjx-itable', 'mjx-mtr',
  'mjx-mlabeledtr', 'mjx-mtd', 'mjx-labels', 'mjx-tstrut', 'mjx-mrow', 'mjx-inferredmrow',
  'mjx-mglyph', 'mjx-maligngroup', 'mjx-malignmark', 'mjx-mathchoice', 'mjx-semantics',
  'mjx-annotation', 'mjx-annotation-xml', 'mjx-xml', 'mjx-xml-block', 'mjx-text',
  'mjx-unknown', 'mjx-stretchy-h', 'mjx-stretchy-v', 'mjx-beg', 'mjx-ext', 'mjx-end',
  'mjx-mid', 'mjx-mark', 'mjx-cell', 'mjx-row', 'mjx-block', 'mjx-spacer', 'mjx-aline',
  'mjx-arrow', 'mjx-cbox', 'mjx-rbox', 'mjx-hstrike', 'mjx-vstrike', 'mjx-ustrike',
  'mjx-dstrike', 'mjx-lbhead', 'mjx-lthead', 'mjx-rbhead', 'mjx-rthead', 'mjx-baseline',
  'mjx-ex-box', 'mjx-left-box', 'mjx-right-box', 'dbox',
];

const mathJaxAttributes = [
  'class', 'style', 'id', 'aria-label', 'role', 'title', 'jax', 'display', 'width',
  'justify', 'side', 'size', 'space', 'rspace', 'limits', 'variant', 'align', 'rowalign',
  'script-align', 'type', 'delims', 'atop', 'bevelled', 'extra', 'double',
];

const mathJaxClasses = ['mjx-*', 'MJX-*', 'TEX-*', 'MathJax'];

// Equation labels (\label, linked to by \eqref) have ids like "mjx-eqn:1"
const mathJaxIdRegex = /^mjx-[-\w.:]+$/;

function sanitizeMathJaxTag(tagName: string, attribs: Record<string, string>) {
  if (attribs.id === undefined || mathJaxIdRegex.test(attribs.id)) {
    return { tagName, attribs };
  }
  const { id: _id, ...attribsWithoutId } = attribs;
  return { tagName, attribs: attribsWithoutId };
}

const cssNumber = String.raw`-?(?:\d+(?:\.\d*)?|\.\d+)`;
const cssLength = String.raw`(?:${cssNumber}(?:em|ex|px|pt|rem|%)?|auto)`;
const cssLengthListRegex = new RegExp(String.raw`^${cssLength}(?:\s+${cssLength})*$`);
const cssColor = String.raw`(?:[a-zA-Z]+|#[\da-fA-F]{3,8}|(?:rgb|hsl)a?\([\d\s.,%]+\))`;
const cssColorRegex = new RegExp(`^${cssColor}$`);
const cssBorderRegex = new RegExp(String.raw`^(?:${cssLength}|${cssColor})(?:\s+(?:${cssLength}|${cssColor}))*$`);

const mathJaxLengthStyleProperties = [
  'width', 'height', 'min-width', 'max-width', 'top', 'bottom', 'left', 'right',
  'margin', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right',
  'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
  'vertical-align', 'font-size', 'border-width',
];

const mathJaxStyles: Record<string, RegExp[]> = {
  ...Object.fromEntries(mathJaxLengthStyleProperties.map((property) => [property, [cssLengthListRegex]])),
  'color': [cssColorRegex],
  'background-color': [cssColorRegex],
  'border': [cssBorderRegex],
  'border-top': [cssBorderRegex],
  'border-bottom': [cssBorderRegex],
  'border-left': [cssBorderRegex],
  'border-right': [cssBorderRegex],
  'position': [/^relative$/],
  'display': [/^(?:block|inline|inline-block|inline-table|table|table-cell|table-row|none)$/],
  'float': [/^(?:left|right|none)$/],
  'text-align': [/^(?:left|right|center|justify)$/],
  'font-family': [/^[-\w\s,'"]+$/],
  'transform': [/^(?:(?:rotate|translate|translateX|translateY|scale|scaleX|scaleY)\([-\w\s.,%]*\)\s*)+$/],
  'clip-path': [new RegExp(String.raw`^inset\(\s*${cssLength}(?:\s+${cssLength})*\s*\)$`)],
};

const mathJaxAllowedAttributes = Object.fromEntries(mathJaxTags.map((tag) => [tag, mathJaxAttributes]));
const mathJaxAllowedClasses = Object.fromEntries(mathJaxTags.map((tag) => [tag, mathJaxClasses]));
const mathJaxAllowedStyles = Object.fromEntries(mathJaxTags.map((tag) => [tag, mathJaxStyles]));
const mathJaxTransformTags = Object.fromEntries(mathJaxTags.map((tag) => [tag, sanitizeMathJaxTag]));

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
    allowedTags: [...sanitizeAllowedTags, ...svgTags, ...mathJaxTags],
    allowedAttributes:  {
      ...sanitizeHtml.defaults.allowedAttributes,
      ...svgAllowedAttributes,
      ...mathJaxAllowedAttributes,
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
      a: ['class', 'href', 'name', 'target', 'rel', 'title', 'data-href'],
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
    allowedSchemesByTag: {
      // Embedded raster images in SVGs; see sanitizeSvgTag
      image: ['data'],
    },
    transformTags: {
      iframe: sanitizeIframeTag,
      ...svgTransformTags,
      ...mathJaxTransformTags,
    },
    // `transformTags.iframe` may strip invalid iframe src values to empty attrs, and we want those empty wrappers removed.
    exclusiveFilter: (frame) => {
      if (frame.tag !== 'iframe') {
        return false;
      }

      const attribs = frame.attribs ?? {};
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
      ...mathJaxAllowedClasses,
    },
    allowedStyles: {
      // sanitize-html doesn't filter the style attribute at all on tags that
      // have no entry here, so this makes those tags get no styles instead.
      '*': {},
      ...mathJaxAllowedStyles,
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
      tbody: {
        ...allowedTableStyles,
      },
      tr: {
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
      text: {
        'white-space': [/^pre$/],
      },
      span: {
        // From: https://gist.github.com/olmokramer/82ccce673f86db7cda5e#gistcomment-3119899
        color: [/([a-z]+|#([\da-f]{3}){1,2}|(rgb|hsl)a\((\d{1,3}%?,\s?){3}(1|0?\.\d+)\)|(rgb|hsl)\(\d{1,3}%?(,\s?\d{1,3}%?){2}\))/],
        // Lexical exports every text node as a span with white-space: pre-wrap,
        // which is what makes typed double spaces visible in the editor.
        // Keep it so published HTML renders the same whitespace.
        'white-space': [/^pre-wrap$/],
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
