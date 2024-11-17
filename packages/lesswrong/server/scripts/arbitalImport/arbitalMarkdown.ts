/* eslint-disable no-useless-escape */
/* eslint-disable eqeqeq */

import { markdownToHtml } from '@/server/editor/conversionUtils';
import { WholeArbitalDatabase } from './arbitalSchema';

// TODO: replace the regex with the official URL object once lib.d.ts is updated to a version from after May 2016 (see: https://github.com/Microsoft/TypeScript/issues/2583)
export const anyUrlMatch = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/i;

//`

export const notEscaped = '(^|\\\\`|\\\\\\[|(?:[^A-Za-z0-9_`[\\\\]|\\\\\\\\))';
export const noParen = '(?=$|[^(])';
const nakedAliasMatch = '[\\-\\+]?[A-Za-z0-9_]+\\.?[A-Za-z0-9_]*';
export const aliasMatch = '(' + nakedAliasMatch + ')';

// [alias/url text]
export const forwardLinkRegexp = new RegExp(notEscaped +
        '\\[([^ \\]]+?) (?![^\\]]*?\\\\\\])([^\\]]+?)\\]' + noParen, 'g');
// [alias] and [alias ]
export const simpleLinkRegexp = new RegExp(notEscaped +
        '\\[' + aliasMatch + '( ?)\\]' + noParen, 'g');
// [text](alias)
export const complexLinkRegexp = new RegExp(notEscaped +
        '\\[([^\\]]+?)\\]' + // match [Text]
        '\\(' + aliasMatch + '\\)', 'g'); // match (Alias)
// [@alias]
export const atAliasRegexp = new RegExp(notEscaped +
        '\\[@' + aliasMatch + '\\]' + noParen, 'g');


export async function arbitalMarkdownToHtml({ database, markdown, slugsByPageId }: {
  database: WholeArbitalDatabase,
  markdown: string,
  slugsByPageId: Record<string,string>
}) {
  let result = markdown;
 
  // Trim + or - from beginning of the alias.
  const trimAlias = function(alias: string): string {
    var firstAliasChar = alias.substring(0, 1);
    if (firstAliasChar == '-' || firstAliasChar == '+') {
      return alias.substring(1);
    }
    return alias;
  };

  // If prefix is '-', lowercase the first letter of text. Otherwise capitalize it.
  const getCasedText = function(text: string, prefix: string) {
    if (prefix == '-') {
      return text.substring(0, 1).toLowerCase() + text.substring(1);
    }
    return text.substring(0, 1).toUpperCase() + text.substring(1);
  };


  function pageIdToLink(pageId: string): string|null {
    if (slugsByPageId[pageId])
      return `/tag/${slugsByPageId[pageId]}`;
    return null;
  }

  function getLinkNormalizedMarkdown(alias: string, text: string) {
    const link = pageIdToLink(alias);
    return `[${text}](${link ?? alias})`;
  }

  // Convert [alias/url text] syntax to links
  result = result.replace(forwardLinkRegexp, function(whole, prefix, alias, text) {
    var matches = alias.match(anyUrlMatch);
    if (matches) {
      // This is just a normal url.
      return `${prefix}[${text}](${matches[0]})`;
    }
    matches = alias.match(aliasMatch);
    if (!matches || matches[0] !== alias) {
      // No alias match
      return whole;
    }
    return prefix + getLinkNormalizedMarkdown(alias, text);
  });

  return await markdownToHtml(result);
}
