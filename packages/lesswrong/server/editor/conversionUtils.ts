import { trimLatexAndAddCSS, preProcessLatex } from './utils';
import { randomId } from '../../lib/random';
import { convertFromRaw } from 'draft-js';
import { draftToHTML } from '../draftConvert';
import { captureException } from '@sentry/core';
import TurndownService from 'turndown';
import {gfm} from 'turndown-plugin-gfm';
import markdownIt from 'markdown-it'
import markdownItMathjax from './markdown-mathjax'
import markdownItContainer from 'markdown-it-container'
import markdownItFootnote from 'markdown-it-footnote'
import markdownItSub from 'markdown-it-sub'
import markdownItSup from 'markdown-it-sup'
import { mjpage }  from 'mathjax-node-page'
import { isAnyTest } from '../../lib/executionEnvironment';
import { cheerioParse } from '../utils/htmlUtil';
import cheerio from 'cheerio';
import { sanitize } from '../../lib/vulcan-lib/utils';
import Users from '../../lib/vulcan-users';
import { filterWhereFieldsNotNull } from '../../lib/utils/typeGuardUtils';
import { Posts } from '../../lib/collections/posts';
import { getConfirmedCoauthorIds } from '../../lib/collections/posts/helpers';
import { convertImagesInHTML } from '../scripts/convertImagesToCloudinary';
import { extractTableOfContents } from '../tableOfContents';

const turndownService = new TurndownService()
turndownService.use(gfm); // Add support for strikethrough and tables
turndownService.remove('style') // Make sure we don't add the content of style tags to the markdown
turndownService.addRule('subscript', {
  filter: ['sub'],
  replacement: (content) => `~${content}~`
})
turndownService.addRule('supscript', {
  filter: ['sup'],
  replacement: (content) => `^${content}^`
})
turndownService.addRule('italic', {
  filter: ['i'],
  replacement: (content) => `*${content}*`
})

const mdi = markdownIt({linkify: true})
mdi.use(markdownItMathjax())
mdi.use(markdownItContainer, 'spoiler')
mdi.use(markdownItFootnote)
mdi.use(markdownItSub)
mdi.use(markdownItSup)

export function mjPagePromise(html: string, beforeSerializationCallback: (dom: any, css: string) => any): Promise<string> {
  // Takes in HTML and replaces LaTeX with CommonHTML snippets
  // https://github.com/pkra/mathjax-node-page
  return new Promise((resolve, reject) => {
    let finished = false;

    if (!isAnyTest) {
      setTimeout(() => {
        if (!finished) {
          const errorMessage = `Timed out in mjpage when processing html: ${html}`;
          captureException(new Error(errorMessage));
          // eslint-disable-next-line no-console
          console.error(errorMessage);
          finished = true;
          resolve(html);
        }
      }, 10000);
    }

    const errorHandler = (id: AnyBecauseTodo, wrapperNode: AnyBecauseTodo, sourceFormula: AnyBecauseTodo, sourceFormat: AnyBecauseTodo, errors: AnyBecauseTodo) => {
      // eslint-disable-next-line no-console
      console.log("Error in Mathjax handling: ", id, wrapperNode, sourceFormula, sourceFormat, errors)
      reject(`Error in $${sourceFormula}$: ${errors}`)
    }

    const callbackAndMarkFinished = (dom: any, css: string) => {
      finished = true;
      return beforeSerializationCallback(dom, css);
    };

    mjpage(html, { fragment: true, errorHandler, format: ["MathML", "TeX"] } , {html: true, css: true}, resolve)
      .on('beforeSerialization', callbackAndMarkFinished);
  })
}

// Adapted from: https://github.com/cheeriojs/cheerio/issues/748
export const cheerioWrapAll = (toWrap: cheerio.Cheerio, wrapper: string, $: cheerio.Root) => {
  if (toWrap.length < 1) {
    return toWrap;
  }

  if (toWrap.length < 2 && ($ as any).wrap) { // wrap not defined in npm version,
    return ($ as any).wrap(wrapper);      // and git version fails testing.
  }

  const section = $(wrapper);
  let  marker = $('<div>');
  marker = marker.insertBefore(toWrap.first()); // in jQuery marker would remain current
  toWrap.each(function(k, v) {                  // in Cheerio, we update with the output.
    $(v).remove();
    section.append($(v));
  });
  section.insertBefore(marker);
  marker.remove();
  return section;                 // This is what jQuery would return, IIRC.
}

const spoilerClass = 'spoiler-v2' // this is the second iteration of a spoiler-tag that we've implemented. Changing the name for backwards-and-forwards compatibility

/// Given HTML which possibly contains elements tagged with with a spoiler class
/// (ie, hidden until mouseover), parse the HTML, and wrap consecutive elements
/// that all have a spoiler tag in a shared spoiler element (so that the
/// mouse-hover will reveal all of them together).
function wrapSpoilerTags(html: string): string {
  const $ = cheerioParse(html)

  // Iterate through spoiler elements, collecting them into groups. We do this
  // the hard way, because cheerio's sibling-selectors don't seem to work right.
  let spoilerBlockGroups: Array<cheerio.Element[]> = [];
  let currentBlockGroup: cheerio.Element[] = [];
  $(`.${spoilerClass}`).each(function(this: any) {
    const element = this;
    if (!(element?.previousSibling && $(element.previousSibling).hasClass(spoilerClass))) {
      if (currentBlockGroup.length > 0) {
        spoilerBlockGroups.push(currentBlockGroup);
        currentBlockGroup = [];
      }
    }
    currentBlockGroup.push(element);
  });
  if (currentBlockGroup.length > 0) {
    spoilerBlockGroups.push(currentBlockGroup);
  }

  // Having collected the elements into groups, wrap each group.
  for (let spoilerBlockGroup of spoilerBlockGroups) {
    cheerioWrapAll($(spoilerBlockGroup), '<div class="spoilers" />', $);
  }

  // Serialize back to HTML.
  return $.html()
}

export const handleDialogueHtml = async (html: string): Promise<string> => {
  const $ = cheerioParse(html);

  $('.dialogue-message-input-wrapper').remove();
  $('.dialogue-message-input').remove();

  const userIds: string[] = [];
  $('.dialogue-message').each((idx, element) => {
    const userId = $(element).attr('user-id');
    if (userId) userIds.push(userId);
  });

  const rawUsers = await Users.find({ _id: { $in: userIds } }, { projection: { _id: 1, displayName: 1 } }).fetch();

  if (rawUsers.some((user) => !user.displayName)) throw new Error('Some users in dialogue have no display name'); //should never happen, better than filtering out users with no display name
  const users = filterWhereFieldsNotNull(rawUsers, "displayName"); //shouldn't get to this point if missing displayname, but need to make types happy

  const userDisplayNamesById = Object.fromEntries(users.map((user) => [user._id, user.displayName]));

  $('.dialogue-message').each((idx, element) => {
    const userId = $(element).attr('user-id');
    if (userId && userDisplayNamesById[userId]) {
      $(element)
        .prepend(`<section class="dialogue-message-header CommentUserName-author UsersNameDisplay-noColor"><b></b></section>`)
        .find('.dialogue-message-header b')
        .text(userDisplayNamesById[userId])
    }
  });

  return $.html();
};

interface UserIdAndDisplayName {
  userId: string;
  displayName: string;
}

export const backfillDialogueMessageInputAttributes = async (html: string, postId: string) => {
  const post = await Posts.findOne(postId);
  if (!post) throw new Error(`Can't find post with id ${postId}!`);
  
  const dialogueParticipantIds = [post.userId, ...getConfirmedCoauthorIds(post)];
  const usersWithDisplayNames = await Users.find({ _id: { $in: dialogueParticipantIds } }, undefined, { _id: 1, displayName: 1 }).fetch();
  const displayNamesById = Object.fromEntries(usersWithDisplayNames.map(user => [user._id, user.displayName] as const));

  const $ = cheerioParse(html);

  if ($('.dialogue-message-input-wrapper').length > 0) {
    return $.html();
  }

  const userIdsWithOrders: [number, UserIdAndDisplayName][] = dialogueParticipantIds.map(
    (participantId, idx) => ([idx + 1, { userId: participantId, displayName: displayNamesById[participantId] ?? '[Missing displayName]' }])
  );

  userIdsWithOrders.sort(([orderA], [orderB]) => orderA - orderB);
  const userIdsByOrder = Object.fromEntries(userIdsWithOrders);

  const messageInputElements = $('.dialogue-message-input').toArray();

  for (const [idx, element] of Object.entries(messageInputElements)) {
    const userId = $(element).attr('user-id');
    const userOrder = $(element).attr('user-order');

    if (userId) {
      // eslint-disable-next-line no-console
      console.log(`Element ${element} already has userId ${userId}`);
      continue;
    }

    const idxDerivedOrder = (Number.parseInt(idx) + 1).toString();
    const finalUserOrder = userOrder ?? idxDerivedOrder;
    const { userId: userIdByOrder, displayName } = userIdsByOrder[finalUserOrder];

    $(element).attr('user-id', userIdByOrder);
    $(element).attr('user-order', finalUserOrder);
    $(element).attr('display-name', displayName);
  }

  cheerioWrapAll($('.dialogue-message-input'), '<div class="dialogue-message-input-wrapper" />', $);

  return $.html();
}

const trimLeadingAndTrailingWhiteSpace = (html: string): string => {
  const $ = cheerioParse(`<div id="root">${html}</div>`)
  const topLevelElements = $('#root').children().get()
  // Iterate once forward until we find non-empty paragraph to trim leading empty paragraphs
  removeLeadingEmptyParagraphsAndBreaks(topLevelElements, $)
  // Then iterate backwards to trim trailing empty paragraphs
  removeLeadingEmptyParagraphsAndBreaks(topLevelElements.reverse(), $)
  return $("#root").html() || ""
}

const removeLeadingEmptyParagraphsAndBreaks = (elements: cheerio.Element[], $: cheerio.Root) => {
   for (const elem of elements) {
    if (isEmptyParagraphOrBreak(elem)) {
      $(elem).remove()
    } else {
      break
    }
  }
}

const isEmptyParagraphOrBreak = (elem: cheerio.Element) => {
  if (elem.type === 'tag' && elem.name === "p") {
    if (elem.children?.length === 0) return true
    if (elem.children?.length === 1 && elem.children[0]?.type === "text" && elem.children[0]?.data?.trim() === "") return true
    return false
  }
  if (elem.type === 'tag' && elem.name === "br") return true
  return false
}

export async function draftJSToHtmlWithLatex(draftJS: AnyBecauseTodo) {
  const draftJSWithLatex = await preProcessLatex(draftJS)
  const html = draftToHTML(convertFromRaw(draftJSWithLatex))
  const trimmedHtml = trimLeadingAndTrailingWhiteSpace(html)
  return wrapSpoilerTags(trimmedHtml)
}

export function htmlToMarkdown(html: string): string {
  return turndownService.turndown(html)
}

export function ckEditorMarkupToMarkdown(markup: string): string {
  // Sanitized CKEditor markup is just html
  return turndownService.turndown(sanitize(markup))
}

export function markdownToHtmlNoLaTeX(markdown: string): string {
  const id = randomId()
  const renderedMarkdown = mdi.render(markdown, {docId: id})
  return trimLeadingAndTrailingWhiteSpace(renderedMarkdown)
}

export async function markdownToHtml(markdown: string): Promise<string> {
  const html = markdownToHtmlNoLaTeX(markdown)
  return await mjPagePromise(html, trimLatexAndAddCSS)
}

export async function ckEditorMarkupToHtml(markup: string): Promise<string> {
  // Sanitized CKEditor markup is just html
  const html = sanitize(markup)
  const trimmedHtml = trimLeadingAndTrailingWhiteSpace(html)
  const hydratedHtml = await handleDialogueHtml(trimmedHtml)
  // Render any LaTeX tags we might have in the HTML
  return await mjPagePromise(hydratedHtml, trimLatexAndAddCSS)
}

export async function dataToHTML(data: AnyBecauseTodo, type: string, sanitizeData = false) {
  switch (type) {
    case "html":
      return await mjPagePromise(sanitizeData ? sanitize(data) : data, trimLatexAndAddCSS)
    case "ckEditorMarkup":
      return await ckEditorMarkupToHtml(data)
    case "draftJS":
      return await draftJSToHtmlWithLatex(data)
    case "markdown":
      return await markdownToHtml(data)
    default: throw new Error(`Unrecognized format: ${type}`);
  }
}

export function dataToMarkdown(data: AnyBecauseTodo, type: string) {
  if (!data) return ""
  switch (type) {
    case "markdown": {
      return data
    }
    case "html": {
      return htmlToMarkdown(data)
    }
    case "ckEditorMarkup": {
      return ckEditorMarkupToMarkdown(data)
    }
    case "draftJS": {
      try {
        const contentState = convertFromRaw(data);
        const html = draftToHTML(contentState)
        return htmlToMarkdown(html)
      } catch(e) {
        // eslint-disable-next-line no-console
        console.error(e)
      }
      return ""
    }
    default: throw new Error(`Unrecognized format: ${type}`);
  }
}

export async function dataToCkEditor(data: AnyBecauseTodo, type: string) {
  switch (type) {
    case "html":
      return sanitize(data);
    case "ckEditorMarkup":
      return data;
    case "draftJS":
      return await draftJSToHtmlWithLatex(data);
    case "markdown":
      return await markdownToHtml(data)
    default: throw new Error(`Unrecognized format: ${type}`);
  }
}

/**
 * When we calculate the word count we want to ignore footnotes. There's two syntaxes
 * for footnotes in markdown:
 *
 * ```
 * 1.  ^**[^](#fnreflexzxp4wr9h)**^
 *
 *     The contents of my footnote
 * ```
 *
 * and
 *
 * ```
 * [^1]: The contents of my footnote.
 * ```
 *
 * In both cases, the footnote must start at character 0 on the line. The strategy here
 * is just to find the first place where this occurs and then to ignore to the end of
 * the document.
 *
 * We adopt a similar strategy for ignoring appendices. We find the first header tag that
 * contains the word 'appendix' (case-insensitive), and ignore to the end of the document.
 *
 * This function runs when content is saved, not when it's loaded, so it's not too
 * performance sensitive. On the flip side, updates to this function won't affect
 * existing content (without a migration) until the content is edited and resaved.
 *
 * This involves converting from whatever format the content is in to markdown to do
 * the footnote removal, then to HTML to do the appendix removal, then back to markdown
 * to count the words. Any of these steps can potentially fail (throw an exception).
 * In particular, if the post contains LaTeX which contains syntax errors, that can
 * cause a failure; and there is (currently, 2023-08-21) at least one escaping bug which
 * can cause format conversions to _introduce_ LaTeX syntax errors for later conversion
 * steps to run into. Our strategy for this is to keep a running best estimate, to be
 * returned if any step fails.
 */
export async function dataToWordCount(data: AnyBecauseTodo, type: string) {
  let bestWordCount = 0;

  try {
    // Convert to markdown and count words by splitting spaces
    const markdown = dataToMarkdown(data, type) ?? "";
    bestWordCount = markdown.trim().split(/[\s]+/g).length;
    
    // Try to remove footnotes and update the count accordingly
    const withoutFootnotes = markdown
      .split(/^1\. {2}\^\*\*\[\^\]\(#(.|\n)*/m)[0]
      .split(/^\[\^1\]:.*/m)[0];
    
    // Sanity check: if removing footnotes lowered the word count by over 60%, we might
    // have removed too much.
    const wordCountWithoutFootnotes = withoutFootnotes.trim().split(/[\s]+/g).length;
    if (wordCountWithoutFootnotes < bestWordCount*.4) {
      return bestWordCount;
    }
    bestWordCount = wordCountWithoutFootnotes;

    // Convert to HTML and try removing appendixes
    const htmlWithoutFootnotes = await dataToHTML(withoutFootnotes, "markdown") ?? "";
    const htmlWithoutFootnotesAndAppendices = htmlWithoutFootnotes
      .split(/<h[1-6]>.*(appendix).*<\/h[1-6]>/i)[0];
    const markdownWithoutFootnotesAndAppendices = dataToMarkdown(htmlWithoutFootnotesAndAppendices, "html");
    bestWordCount = markdownWithoutFootnotesAndAppendices.trim().split(/[\s]+/g).length;
  } catch(err) {
    // eslint-disable-next-line no-console
    console.error("Error in dataToWordCount", err)
  }

  return bestWordCount
}

/**
 * Convert the footnotes we get in google doc html to a format ckeditor can understand. This is mirroring the logic
 * in the footnotes plugin (see e.g. public/lesswrong-editor/src/ckeditor5-footnote/src/footnoteEditing/googleDocsFootnotesNormalizer.js)
 */
function googleDocConvertFootnotes(html: string): string {
  const $ = cheerio.load(html);

  const footnotePattern = /^ftnt(\d+)$/; // The actual footnotes at the bottom of the doc
  const referencePattern = /^ftnt_ref(\d+)$/; // The links to the footnotes in the main text

  const footnotes: Record<string, { item: cheerio.Cheerio; anchor: cheerio.Cheerio, id: string }> = {};
  $('a[id]').each((_, element) => {
    if (!('attribs' in element)) return

    const match = element.attribs.id.match(footnotePattern);
    if (match) {
      const index = match[1];
      // Find the closest parent div of the footnote anchor
      const footnoteDiv = $(element).closest('div');
      footnotes[index] = {
        item: footnoteDiv,
        anchor: $(element),
        id: Math.random().toString(36).slice(2),
      };
    }
  });

  if (Object.keys(footnotes).length === 0) {
    return $.html();
  }

  const references: Record<string, { item: cheerio.Cheerio; id: string }> = {};
  $('a[id]').each((_, element) => {
    if (!('attribs' in element)) return

    const match = element.attribs.id.match(referencePattern);
    if (match) {
      const index = match[1];
      if (footnotes.hasOwnProperty(index)) {
        references[index] = {
          item: $(element),
          id: footnotes[index].id,
        };
      }
    }
  });

  // Normalize the references by adding attributes and replacing the original <sup> tag
  Object.entries(references).forEach(([index, { item, id }]) => {
    item.attr('data-footnote-reference', '');
    item.attr('data-footnote-index', index);
    item.attr('data-footnote-id', id);
    item.attr('role', 'doc-noteref');
    item.parents('sup').replaceWith(item); // Replace the original <sup> tag with `item`
    item.wrap(`<span class="footnote-reference" id="fnref${id}"></span>`);
    item.text(`[${index}]`);
  });

  // Create the footnotes section
  $('body').append('<ol class="footnote-section footnotes" data-footnote-section="" role="doc-endnotes"></ol>');

  // Normalize the footnotes and put them in the newly created section
  Object.entries(footnotes).forEach(([index, { item, anchor, id }]) => {
    // Remove e.g. "[1]&nbsp;" from the footnote
    const anchorHtml = anchor.html();
    if (anchorHtml && anchorHtml.startsWith('&nbsp;')) {
      anchor.html(anchorHtml.replace(/^&nbsp;/, ''));
    } else {
      anchor.remove();
    }

    const footnoteContent = item.clone().addClass('footnote-content');

    // Replace bullets in footnotes with regular <p> elements and move them up a level
    const listParent = footnoteContent.find('li').parent('ul, ol');
    listParent.children('li').each((_, liElement) => {
      const liContent = $(liElement).html();
      $(`<p>${liContent}</p>`).insertBefore(listParent);
    });
    listParent.remove();

    const newFootnoteBackLink = $('<span class="footnote-back-link" data-footnote-back-link="" data-footnote-id="' + id + '"><sup><strong><a href="#fnref' + id + '">^</a></strong></sup></span>');

    const newFootnoteContent = $('<div class="footnote-content" data-footnote-content="" data-footnote-id="' + id + '" data-footnote-index="' + index + '"></div>');
    newFootnoteContent.append(footnoteContent.contents());

    const newFootnoteItem = $('<li class="footnote-item" data-footnote-item="" data-footnote-id="' + id + '" data-footnote-index="' + index + '" role="doc-endnote" id="fn' + id + '"></li>');
    newFootnoteItem.append(newFootnoteBackLink);
    newFootnoteItem.append(newFootnoteContent);

    $('.footnote-section').append(newFootnoteItem);
    item.remove()
  });

  // The changes so far leave over a stub like so:
  // <hr />
  //   <div>
  //     <p></p>
  //   </div>
  //   ...
  // <ol class=\"footnotes\" role=\"doc-endnotes\">
  //
  // Remove everything from the <hr /> to the footnotes section
  const footnotesSection = $('.footnote-section');
  const hrBeforeFootnotes = footnotesSection.prevAll('hr').last();
  hrBeforeFootnotes.remove();

  return $.html();
}

/**
 * Remote the google redirect from links that come from google docs
 *
 * https://www.google.com/url?q=https://en.wikipedia.org/wiki/Main_Page becomes https://en.wikipedia.org/wiki/Main_Page
 */
function googleDocRemoveRedirects(html: string): string {
  const $ = cheerio.load(html);

  // Regex match examples:
  // https://www.google.com/url?q=https://en.wikipedia.org/wiki/Main_Page&sa=D&source=editors&ust=1667922372715536&usg=AOvVaw2NyT5CZhfsrRY_zzMs2UUJ
  //                              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ <- first match group matches this, stopping at the first &
  // https://www.google.com/url?q=https://en.wikipedia.org/wiki/Main_Page
  //                              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ <- if there are no more params (no &), match up to the end of the string
  const hrefPattern = /^https:\/\/www\.google\.com\/url\?q=(\S+?)(&|$)/;

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (!href) return

    const match = hrefPattern.exec(href);
    if (match && match[1]) {
      $(element).attr('href', decodeURIComponent(match[1]));
    }
  });

  return $.html();
}

/**
 * Converts Google Docs formatting to ckeditor formatting. Currently handles:
 * - Italics
 * - Bold
 */
function googleDocFormatting(html: string): string {
  const $ = cheerio.load(html);

  $('span').each((_, element) => {
    const span = $(element);
    const fontStyle = span.css('font-style');
    const fontWeight = span.css('font-weight');

    if (fontStyle === 'italic' && fontWeight === '700') {
      span.wrap('<i><strong></strong></i>');
    } else if (fontStyle === 'italic') {
      span.wrap('<i></i>');
    } else if (fontWeight === '700') {
      span.wrap('<strong></strong>');
    }
  });

  return $.html();
}

/**
 * Removes comments from the raw html exported from Google Docs.
 */
function googleDocStripComments(html: string): string {
  const $ = cheerio.load(html);

  // Remove any <sup> tags that contain a child with a #cmnt id
  $('sup').each((_, element) => {
    const sup = $(element);
    if (sup.find('a[id^="cmnt_ref"]').length > 0) {
      sup.remove();
    }
  });

  // Remove the whole box at the bottom containing the comments
  $('div').each((_, element) => {
    const div = $(element);
    if (div.find('a[id^="cmnt"]').length > 0) {
      div.remove();
    }
  });

  return $.html();
}

/**
 * Converts internal links in Google Docs HTML to a format with `data-internal-id` attributes on block level elements.
 * This is used to maintain internal document links when importing into ckeditor, which doesn't use `id` attributes
 * on elements for internal linking.
 */
async function googleDocInternalLinks(html: string): Promise<string> {
  const $ = cheerio.load(html);

  // Define block level elements that are considered as blocks in ckeditor
  const blockLevelElements = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ol', 'ul', 'li', 'blockquote', 'pre', 'hr', 'table'];

  // Map id to data-internal-id
  $('[id]').each((_, element) => {
    // Remove the id attribute and store its value
    const idValue = $(element).attr('id');
    $(element).removeAttr('id');

    // Find the nearest parent that is a block level element
    const blockParent = $(element).closest(blockLevelElements.join(','));

    if (blockParent.length && idValue) {
      blockParent.attr('data-internal-id', idValue)
    }
  });

  const tocHtml = (await extractTableOfContents($.html()))?.html;
  if (tocHtml) {
    const idMap: Record<string, string> = {};
    const $toc = cheerio.load(tocHtml);
    $toc('[id][data-internal-id]').each((_, element) => {
      const readableId = $toc(element).attr('id');
      const internalId = $toc(element).attr('data-internal-id');
      if (readableId && internalId) {
        idMap[internalId] = readableId;
      }
    });

    // Update all hrefs to point to the readable ids
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (href && href.startsWith('#')) {
        const internalId = href.slice(1);
        if (idMap[internalId]) {
          $(element).attr('href', `#${idMap[internalId]}`);
        }
      }
    });

    // Update the data-internal-ids to be equal to the readable id, this
    // means that even if they change the heading the links will still work
    $('[data-internal-id]').each((_, element) => {
      const internalId = $(element).attr('data-internal-id');
      if (internalId && idMap[internalId]) {
        $(element).attr('data-internal-id', idMap[internalId]);
      }
    });
  }

  return $.html();
}

/**
 * Handle footnotes and internal links. These are bundled together because they must
 * be done in the right order
 */
function googleDocConvertLinks(html: string) {
  const withNormalizedFootnotes = googleDocConvertFootnotes(html);
  const withInternalLinks = googleDocInternalLinks(withNormalizedFootnotes);
  return withInternalLinks
}

/**
 * In google docs nested bullets are handled through styling (each indentation level is actually
 * a separate list, with a margin-left creating the effect of nesting). In ckeditor, nested bullets are
 * actually <ul>s nested within each other. Convert this styling based nesting to genuine nesting
 */
function googleDocConvertNestedBullets(html: string): string {
  const $ = cheerio.load(html);

  // Each nesting level has a class like lst-kix_gwukp0509sil-0, or lst-kix_gwukp0509sil-1
  // The id in the middle indicates the overall nested list that this level belongs to, and the number at the end
  // indicates the level of indentation
  const listGroups: Record<string, {element: cheerio.Cheerio, index: number}[]> = {};
  $('ul[class*="lst-"], ol[class*="lst-"]').each((_, element) => {
    const classNames = $(element).attr('class')?.split(/\s+/);
    const listClass = classNames?.find(name => name.startsWith('lst-'));
    if (!listClass) return;

    const match = listClass.match(/lst-([a-z_0-9]+)-(\d+)/);
    if (!match) return;

    const [ , id, index] = match;
    if (!listGroups[id]) {
      listGroups[id] = [];
    }
    listGroups[id].push({ element: $(element), index: parseInt(index) });
  });

  // Adjust the indices to account for contraints in ckeditor, and convert to genuine nesting
  for (const group of Object.values(listGroups)) {
    // In ckeditor, lists aren't allowed to start indented
    group[0].index = 0;

    // Indices can only increase by 1 from element to element
    for (let i = 1; i < group.length; i++) {
      if (group[i].index > group[i-1].index + 1) {
        group[i].index = group[i-1].index + 1;
      }
    }

    // Convert to genuine nesting
    group.forEach((item, i, arr) => {
      if (i > 0) {
        const prevItem = arr[i - 1];
        if (item.index === prevItem.index + 1) {
          prevItem.element.children('li:last-child').append(item.element);
        } else if (item.index <= prevItem.index) {
          // Find the ancestor list that matches the current index
          let ancestor = prevItem.element;
          for (let j = 0; j < prevItem.index - item.index; j++) {
            ancestor = ancestor.parent().closest('ul, ol');
          }
          ancestor.after(item.element);
        }
      }
    });
  };

  return $.html();
}

/**
 * To fix double spacing, remove all empty <p> tags that are immediate children of <body> from the HTML
 */
function removeEmptyBodyParagraphs(html: string): string {
  const $ = cheerio.load(html);

  $('body > p').each((_, element) => {
    const p = $(element);
    if (p.text().trim() === '') {
      p.remove();
    }
  });

  return $.html();
}

/**
 * We need to convert a few things in the raw html exported from google to make it work with ckeditor, this is
 * largely mirroring conversions we do on paste in the ckeditor code:
 * - Convert footnotes to our format
 * - Remove google redirects from all urls
 * - Reupload images to cloudinary (we actually don't do this on paste, but it's easier to do so here and prevents images breaking due to rate limits)
 */
export async function convertImportedGoogleDoc({
  html,
  postId,
}: {
  html: string;
  postId: string;
}) {
  const converters: (((html: string) => Promise<string>) | ((html: string) => string))[] = [
    async (html: string) => {
      const { html: rehostedHtml } = await convertImagesInHTML(html, postId, (url) =>
        url.includes("googleusercontent")
      );
      return rehostedHtml;
    },
    googleDocStripComments,
    googleDocFormatting,
    googleDocConvertLinks,
    googleDocRemoveRedirects,
    removeEmptyBodyParagraphs,
    googleDocConvertNestedBullets,
    async (html: string) => await dataToCkEditor(html, "html"),
  ];

  let result: string = html;
  // Apply each converter in sequence
  for (const converter of converters) {
    result = await converter(result);
  }

  return result;
}
