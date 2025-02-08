import { diff } from '../vendor/node-htmldiff/htmldiff';
import { cheerioParse, tokenizeHtml } from '../utils/htmlUtil';
import { sanitize } from '../../lib/vulcan-lib/utils';
import { Globals } from '../vulcan-lib';

export const diffHtml = (before: string, after: string, trim: boolean): string => {
  // Normalize unicode and &entities; so that smart quotes changing form won't
  // produce spurious differences
  const normalizedBefore = normalizeHtmlForDiff(before);
  const normalizedAfter = normalizeHtmlForDiff(after);

  // Diff the revisions
  const diffHtmlUnsafe = diff(normalizedBefore, normalizedAfter);
  
  let trimmed = trim ? trimHtmlDiff(diffHtmlUnsafe) : diffHtmlUnsafe;
  
  // Sanitize (in case node-htmldiff has any parsing glitches that would
  // otherwise lead to XSS)
  return sanitize(trimmed);
}

// Given an HTML diff (with <ins> and <del> tags), remove sections that don't
// have changes to make an abridged view.
export const trimHtmlDiff = (html: string): string => {
  const $ = cheerioParse(html)
  
  // Does HTML contain a <body> tag? If so, look at children of the body tag.
  // Otherwise look at the root.
  const bodyTags = $('body');
  const hasBodyTag = bodyTags.length > 0;
  const rootElement = hasBodyTag ? bodyTags : $.root()
  
  rootElement.children().each(function(i, elem) {
    const e = $(elem)
    if (!e.find('ins').length && !e.find('del').length) {
      e.remove()
    }
  })
  
  return $.html();
}

/**
 * Several common characters (quotes, smart-quotes) can be represented as
 * either regular characters (maybe unicode), or as HTML entities. In some
 * historical imported wiki content they're represented as HTML entities, but
 * opening a wiki page in CkEditor and re-saving it converts them to their
 * regular-character form, creating spurious changes in the history page and
 * in chars-edited metrics.
 *
 * This function normalizes these differences away so that we can get a diff
 * that excludes these.
 *
 * Note that while this is used for change-metrics, it's not currently used
 * for attributing edits of particular chars to users, because the
 * normalization changes the string length and the attribution code is
 * sensitive to that.
 */
export function normalizeHtmlForDiff(html: string): string {
  const tokens = tokenizeHtml(html);
  function normalizeEntity(entityStr: string): string {
    switch (entityStr) {
      case "&quot;":
        return "\"";
      case "&#x201C;":
        return "“";
      case "&#x201D;":
        return "”";
      default:
        console.log(entityStr);
        return entityStr;
    }
  }
  return tokens.map(([tokenType, tokenString]) => {
    if (tokenType==="charRefNamed" || tokenType==="charRefHex") {
      return normalizeEntity(tokenString);
    } else {
      return tokenString;
    }
  }).join("");
}

Globals.normalizeHtmlForDiff = normalizeHtmlForDiff;
