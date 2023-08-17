import { diff } from '../vendor/node-htmldiff/htmldiff';
import { cheerioParse } from '../utils/htmlUtil';
import { sanitize } from '../../lib/vulcan-lib/utils';

export const diffHtml = (before: string, after: string, trim: boolean): string => {
  // Diff the revisions
  const diffHtmlUnsafe = diff(before, after);
  
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
