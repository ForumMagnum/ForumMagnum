import cheerio, { load, type Element } from 'cheerio';
import HtmlLexer from 'html-lexer';


/**
 * Parse an HTML fragment with cheerio. Server-side only. Provides some cheerio
 * config options, and works around a Typescript annotation problem (which
 * should go away when we version-upgrade Cheerio at some point). This drops any
 * doctype and <html>, <head> and <body> tags, including their attributes; use
 * cheerioParseDocument for HTML that a browser will parse as a whole document.
 */
export function cheerioParse(html: string|null) {
  //@ts-ignore (cheerio type annotations sadly don't quite match the actual imported library)
  return cheerio.load(html ?? "", null, false);
}

/**
 * Parse HTML that a browser will parse as a whole document, such as an iframe's
 * srcdoc. Serializing the result preserves the DOM that the browser would build
 * from the original, which means a fragment gains <html>, <head> and <body> tags.
 */
export function cheerioParseDocument(html: string) {
  return load(html);
}

/**
 * Tokenize HTML. Wraps around the html-lexer library to give it a conventional
 * API taking a string, rather than an awkward streaming thing.
 */
export function tokenizeHtml(html: string): [string,string][] {
  const result: [string,string][] = [];
  const lexer = new HtmlLexer({
    write: (token: [string,string]) => result.push(token),
    end: () => null
  })
  lexer.write(html);
  return result;
}

/**
 * Parse an HTML string with cheerio, and annotate nodes with offsets
 * into the original HTML string.
 *
 * Works by preprocessing the tree with a lexer to insert empty tags
 that look like:
 *   <span class="__offset_marker" offset="123"></span>
 * then finding those spans, transferring their offsets onto text and tag
 * nodes (as a monkeypatched field), then deleting them.
 */
export function cheerioParseAndMarkOffsets(html: string) {
  const tokens = tokenizeHtml(html);
  let preprocessedHtmlSb: string[] = [];
  let offset = 0;
  let isInTag = false;
  
  for (let [tokenType,tokenStr] of tokens) {
    switch(tokenType) {
      case 'startTagStart':
      case 'endTagStart':
        if (offset > 0) {
          preprocessedHtmlSb.push(`<span class="__offset_marker" offset="${offset}"></span>`);
        }
        isInTag = true;
        break;
      case 'tagEnd':
      case 'tagEndAutoclose':
        isInTag = false;
        break;
      case 'space':
        if (isInTag) break;
        // FALLTHROUGH
      case 'data':
        if (tokenStr.length > 0) {
          preprocessedHtmlSb.push(`<span class="__offset_marker" offset="${offset}"></span>`);
        }
        break;
      default:
        break;
    }
    
    preprocessedHtmlSb.push(tokenStr);
    offset += tokenStr.length;
  }
  
  const preprocessedHtml = preprocessedHtmlSb.join('');
  const parsed = cheerioParse(preprocessedHtml);
  let offsetMarkers = parsed('.__offset_marker');
  for (let i=0; i<offsetMarkers.length; i++) {
    let offsetMarker = offsetMarkers[i];
    let offset = parseInt((offsetMarker as Element).attribs.offset);
    if (offsetMarker.next) {
      (offsetMarker.next as any).offset = offset;
    }
  }
  offsetMarkers.remove();
  
  return parsed;
}

export function htmlContainsFootnotes(html: string) {
  // Post HTML contains footnotes if it contains an element with the class
  // "footnote-reference". Before spending CPU to parse HTML, check whether that
  // string is present at all as a faster check
  if (!html.includes("footnote-reference")) {
    return false;
  }
  const $ = cheerioParse(html);
  const footnotes = $(".footnote-reference");
  return footnotes.length > 0;
}
