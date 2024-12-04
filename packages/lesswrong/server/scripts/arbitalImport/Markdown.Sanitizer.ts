/* eslint-disable no-useless-escape */
/* eslint-disable eqeqeq */
// jscs:disable

import {Converter} from './Markdown.Converter';

export function getSanitizingConverter() {
  var converter = new (Converter as any)();
  // JB: Don't do this HTML-sanitization in the context of Arbital import into
  // LessWrong, because (a) we're already doing our own sanitization, and (b) this
  // is filtering out some things that we want to keep, partially breaking
  // mathjax.
  // converter.hooks.chain('postConversion', sanitizeHtml);
  converter.hooks.chain('postConversion', balanceTags);
  return converter;
};

function sanitizeHtml(html: string) {
  return html.replace(/<[^>]*>?/gi, sanitizeTag);
}

// (tags that can be opened/closed) | (tags that stand alone)
var basic_tag_whitelist = /^(<\/?((?:arb-multiple-choice|arb-checkbox)(?: page-id='[^']+')?(?: object-alias='[^']+')?(?: default='[^']+')?|arb-table-of-contents(?: page-id='[^']+')?|a href="[^"]+" class="[^"]+"( page-id="[^"]*")?( user-id="[^"]*")?|b|blockquote|code|div(?: layout='[^']+')?(?: layout-align='[^']+')?(?: style='[^']+')?(?: class='[^']+')?(?: arb-math-compiler="[^"]+")?(?: arb-hidden-text button-text='[^']*')?(?: data-demo-name="[^"]+")?(?: ng-show='[^']+')?|del|dd|dl|dt|em|h1|h2|h3|i|kbd|li|md-button(?: href='[^']+')?(?: class='[^']+')?|md-icon|ol(?: start="\d+")?|p(?: ng-show='[^']+')?|pre|s|span(?: style='[^']+')?(?: class='[^']+')?(?: arb-vote-summary page-id="[^"]+")?(?: arb-text-popover-anchor)?(?: arb-math-compiler="[^"]+")?(?: ng-show='[^']+')?|sup|sub|strong|strike|ul)>|<(br|hr)\s?\/?>)$/i;
// <a href="url..." optional title>|</a>
var a_white = /^(<a\shref="((https?|ftp):\/\/|\/)[-A-Za-z0-9+&@#\/%?=~_|!:,.;\(\)*[\]$]+"(\stitle="[^"<>]+")?\s?>|<\/a>)$/i;

// <img src="url..." optional width  optional height  optional alt  optional title
var img_white = /^(<img\ssrc="(https?:\/\/|\/)[-A-Za-z0-9+&@#\/%?=~_|!:,.;\(\)*[\]$]+"(\swidth="\d{1,3}")?(\sheight="\d{1,3}")?(\salt="[^"<>]*")?(\stitle="[^"<>]*")?\s?\/?>)$/i;

// SVG tag with its allowed attributes
var svg_white = /^(<svg(?:\s+(?:xmlns="[^"]+"|viewBox="[^"]+"|fill="[^"]+"|aria-hidden="[^"]+"|class="[^"]+"|[\w-]+="[^"]*"))*\s*>|<\/svg>)$/i;

// Path tag with any attributes
var path_white = /^(<path(?:\s+[\w-]+="[^"]*")*\s*\/?>|<\/path>)$/i;

function sanitizeTag(tag: string) {
  if (tag.match(basic_tag_whitelist) || 
      tag.match(a_white) || 
      tag.match(img_white) ||
      tag.match(svg_white) ||
      tag.match(path_white))
    return tag;
  else
    return '';
}

/// <summary>
/// attempt to balance HTML tags in the html string
/// by removing any unmatched opening or closing tags
/// IMPORTANT: we *assume* HTML has *already* been
/// sanitized and is safe/sane before balancing!
///
/// adapted from CODESNIPPET: A8591DBA-D1D3-11DE-947C-BA5556D89593
/// </summary>
function balanceTags(html: string) {

  if (html == '')
  return '';

  var re = /<\/?\w+[^>]*(\s|$|>)/g;
  // convert everything to lower case; this makes
  // our case insensitive comparisons easier
  var tags = html.toLowerCase().match(re)!;

  // no HTML tags present? nothing to do; exit now
  var tagcount = (tags || []).length;
  if (tagcount == 0)
  return html;

  var tagname, tag;
  var ignoredtags = '<arb-checkbox><arb-hidden-text><arb-multiple-choice><arb-table-of-contents><p><img><br><li><hr><div>';
  var match;
  var tagpaired: boolean[] = [];
  var tagremove: boolean[] = [];
  var needsRemoval = false;

  // loop through matched tags in forward order
  for (var ctag = 0; ctag < tagcount; ctag++) {
    tagname = tags[ctag].replace(/<\/?([A-Za-z0-9-]+).*/, '$1');
    // skip any already paired tags
    // and skip tags in our ignore list; assume they're self-closed
    if (tagpaired[ctag] || ignoredtags.search('<' + tagname + '>') > -1)
    continue;

    tag = tags[ctag];
    match = -1;

    if (!/^<\//.test(tag)) {
      // this is an opening tag
      // search forwards (next tags), look for closing tags
      for (var ntag = ctag + 1; ntag < tagcount; ntag++) {
        if (!tagpaired[ntag] && tags[ntag] == '</' + tagname + '>') {
          match = ntag;
          break;
        }
      }
    }

    if (match == -1)
    needsRemoval = tagremove[ctag] = true; // mark for removal
    else
    tagpaired[match] = true; // mark paired
  }

  // console.log('before needsRemoval', { needsRemoval, html });

  if (!needsRemoval)
  return html;

  // delete all orphaned tags from the string

  var ctag = 0;
  html = html.replace(re, function(match) {
    var res = tagremove[ctag] ? '' : match;
    ctag++;
    return res;
  });

  // console.log('after needsRemoval', { html });

  return html;
}
