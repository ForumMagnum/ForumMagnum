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
import { Posts } from '../../lib/collections/posts';
import { getConfirmedCoauthorIds } from '../../lib/collections/posts/helpers';

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

export function mjPagePromise(html: string, beforeSerializationCallback: (dom: any, css: string)=>any): Promise<string> {
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

  const users = await Users.find({ _id: { $in: userIds } }, { projection: { _id: 1, displayName: 1 } }).fetch();

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
