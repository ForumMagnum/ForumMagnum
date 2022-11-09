import { trimLatexAndAddCSS, preProcessLatex } from './utils';
import { getCollectionHooks } from '../mutationCallbacks';
import { sanitize } from '../vulcan-lib/utils';
import { randomId } from '../../lib/random';
import { convertFromRaw } from 'draft-js';
import { draftToHTML } from '../draftConvert';
import { Revisions, ChangeMetrics } from '../../lib/collections/revisions/collection'
import { extractVersionsFromSemver } from '../../lib/editor/utils'
import { ensureIndex } from '../../lib/collectionUtils'
import { htmlToPingbacks } from '../pingbacks';
import { captureException } from '@sentry/core';
import { diff } from '../vendor/node-htmldiff/htmldiff';
import { editableCollections, editableCollectionsFields, editableCollectionsFieldOptions, sealEditableFields, MakeEditableOptions } from '../../lib/editor/make_editable';
import { getCollection } from '../../lib/vulcan-lib/getCollection';
import { CallbackHook } from '../../lib/vulcan-lib/callbacks';
import { createMutator } from '../vulcan-lib/mutators';
import TurndownService from 'turndown';
import {gfm} from 'turndown-plugin-gfm';
import * as _ from 'underscore';
import markdownIt from 'markdown-it'
import markdownItMathjax from './markdown-mathjax'
import cheerio from 'cheerio';
import markdownItContainer from 'markdown-it-container'
import markdownItFootnote from 'markdown-it-footnote'
import markdownItSub from 'markdown-it-sub'
import markdownItSup from 'markdown-it-sup'

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

import { mjpage }  from 'mathjax-node-page'
import { onStartup, isAnyTest } from '../../lib/executionEnvironment';

// TODO: Now that the make_editable callbacks use createMutator to create
// revisions, we can now add these to the regular ${collection}.create.after
// callbacks
interface AfterCreateRevisionCallbackContext {
  revisionID: string
}
export const afterCreateRevisionCallback = new CallbackHook<[AfterCreateRevisionCallbackContext]>("revisions.afterRevisionCreated");

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

    const errorHandler = (id, wrapperNode, sourceFormula, sourceFormat, errors) => {
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
const cheerioWrapAll = (toWrap: cheerio.Cheerio, wrapper: string, $: cheerio.Root) => {
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
  //@ts-ignore
  const $ = cheerio.load(html, null, false)

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

const trimLeadingAndTrailingWhiteSpace = (html: string): string => {
  //@ts-ignore
  const $ = cheerio.load(`<div id="root">${html}</div>`, null, false)
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


export async function draftJSToHtmlWithLatex(draftJS) {
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
  // Render any LaTeX tags we might have in the HTML
  return await mjPagePromise(trimmedHtml, trimLatexAndAddCSS)
}

export async function dataToHTML(data, type, sanitizeData = false) {
  switch (type) {
    case "html":
      return sanitizeData ? sanitize(data) : await mjPagePromise(data, trimLatexAndAddCSS)
    case "ckEditorMarkup":
      return await ckEditorMarkupToHtml(data)
    case "draftJS":
      return await draftJSToHtmlWithLatex(data)
    case "markdown":
      return await markdownToHtml(data)
    default: throw new Error(`Unrecognized format: ${type}`);
  }
}

export function dataToMarkdown(data, type) {
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

export async function dataToCkEditor(data, type) {
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
 * 1.  ^**[^](#fnreflexzxp4wr9h)**^
 *
 *     The contents of my footnote
 *
 * and
 *
 * [^1]: The contents of my footnote.
 *
 * In both cases, the footnote must start at character 0 on the line. The strategy here
 * is just to find the first place where this occurs and then to ignore to the end of
 * the document.
 */
export async function dataToWordCount(data, type) {
  try {
    const markdown = dataToMarkdown(data, type) ?? "";
    const withoutFootnotes = markdown
      .split(/^1\. {2}\^\*\*\[\^\]\(#(.|\n)*/m)[0]
      .split(/^\[\^1\]:.*/m)[0];
    const words = withoutFootnotes.match(/[^\s]+/g) ?? [];
    return words.length;
  } catch(err) {
    // eslint-disable-next-line no-console
    console.error("Error in dataToWordCount", data, type, err)
    return 0
  }
}

function getInitialVersion(document: DbPost|DbObject) {
  if ((document as DbPost).draft) {
    return '0.1.0'
  } else {
    return '1.0.0'
  }
}

export async function getLatestRev(documentId: string, fieldName: string): Promise<DbRevision|null> {
  return await Revisions.findOne({documentId: documentId, fieldName}, {sort: {editedAt: -1}})
}

/// Given a revision, return the last revision of the same document/field prior
/// to it (null if the revision is the first).
export async function getPrecedingRev(rev: DbRevision): Promise<DbRevision|null> {
  return await Revisions.findOne(
    {documentId: rev.documentId, fieldName: rev.fieldName, editedAt: {$lt: rev.editedAt}},
    {sort: {editedAt: -1}}
  );
}

export async function getNextVersion(documentId: string, updateType = 'minor', fieldName: string, isDraft: boolean) {
  const lastRevision = await getLatestRev(documentId, fieldName);
  const { major, minor, patch } = extractVersionsFromSemver(lastRevision?.version || "1.0.0")
  switch (updateType) {
    case "patch":
      return `${major}.${minor}.${patch + 1}`
    case "minor":
      return `${major}.${minor + 1}.0`
    case "major":
      return `${major+1}.0.0`
    case "initial":
      return isDraft ? '0.1.0' : '1.0.0'
    default:
      throw new Error("Invalid updateType, must be one of 'patch', 'minor' or 'major'")
  }
}

function versionIsDraft(semver: string, collectionName: CollectionNameString) {
  if (collectionName === "Tags")
    return false;
  const { major, minor, patch } = extractVersionsFromSemver(semver)
  return major===0;
}

ensureIndex(Revisions, {documentId: 1, version: 1, fieldName: 1, editedAt: 1})

export async function buildRevision({ originalContents, currentUser, dataWithDiscardedSuggestions }:{
  originalContents: DbRevision["originalContents"],
  currentUser: DbUser,
  dataWithDiscardedSuggestions?: string
}) {
  const { data, type } = originalContents;
  const readerVisibleData = dataWithDiscardedSuggestions ?? data
  const html = await dataToHTML(readerVisibleData, type, !currentUser.isAdmin)
  const wordCount = await dataToWordCount(readerVisibleData, type)

  return {
    html, wordCount, originalContents,
    editedAt: new Date(),
    userId: currentUser._id,
  };
}

// Given a revised document, check whether fieldName (a content-editor field) is
// different from the previous revision (or there is no previous revision).
export const revisionIsChange = async (doc, fieldName: string): Promise<boolean> => {
  const id = doc._id;
  const previousVersion = await getLatestRev(id, fieldName);

  if (!previousVersion)
    return true;

  if (!_.isEqual(doc[fieldName].originalContents, previousVersion.originalContents)) {
    return true;
  }

  if (doc[fieldName].commitMessage && doc[fieldName].commitMessage.length>0) {
    return true;
  }

  return false;
}

function addEditableCallbacks<T extends DbObject>({collection, options = {}}: {
  collection: CollectionBase<T>,
  options: MakeEditableOptions
}) {
  const {
    fieldName = "contents",
    pingbacks = false,
  } = options

  const collectionName = collection.collectionName;

  getCollectionHooks(collectionName).createBefore.add(
    async function editorSerializationBeforeCreate (doc, { currentUser })
  {
    if (doc[fieldName]?.originalContents) {
      if (!currentUser) { throw Error("Can't create document without current user") }
      const { data, type } = doc[fieldName].originalContents
      const commitMessage = doc[fieldName].commitMessage;
      const html = await dataToHTML(data, type, !currentUser.isAdmin)
      const wordCount = await dataToWordCount(data, type)
      const version = getInitialVersion(doc)
      const userId = currentUser._id
      const editedAt = new Date()
      const changeMetrics = htmlToChangeMetrics("", html);
      const newRevision: Omit<DbRevision, "documentId" | "schemaVersion" | "_id" | "voteCount" | "baseScore" | "extendedScore" | "score" | "inactive" | "autosaveTimeoutStart"> = {
        ...(await buildRevision({
          originalContents: doc[fieldName].originalContents,
          currentUser,
        })),
        fieldName,
        collectionName,
        version,
        draft: versionIsDraft(version, collectionName),
        updateType: 'initial',
        commitMessage,
        changeMetrics,
        createdAt: editedAt,
      };
      const firstRevision = await createMutator({
        collection: Revisions,
        document: newRevision,
        validate: false
      });

      return {
        ...doc,
        [fieldName]: {
          ...doc[fieldName],
          html, version, userId, editedAt, wordCount,
          updateType: 'initial'
        },
        [`${fieldName}_latest`]: firstRevision.data._id,
        ...(pingbacks ? {
          pingbacks: await htmlToPingbacks(html, null),
        } : null),
      }
    }
    return doc
  });

  getCollectionHooks(collectionName).updateBefore.add(
    async function editorSerializationEdit (docData, { oldDocument: document, newDocument, currentUser })
  {
    if (docData[fieldName]?.originalContents) {
      if (!currentUser) { throw Error("Can't create document without current user") }

      const { data, type } = docData[fieldName].originalContents
      const commitMessage = docData[fieldName].commitMessage;
      const dataWithDiscardedSuggestions = docData[fieldName].dataWithDiscardedSuggestions
      delete docData[fieldName].dataWithDiscardedSuggestions

      const readerVisibleData = dataWithDiscardedSuggestions ?? data
      const html = await dataToHTML(readerVisibleData, type, !currentUser.isAdmin)
      const wordCount = await dataToWordCount(readerVisibleData, type)
      const defaultUpdateType = docData[fieldName].updateType || (!document[fieldName] && 'initial') || 'minor'
      const isBeingUndrafted = (document as DbPost).draft && !(newDocument as DbPost).draft
      // When a document is undrafted for the first time, we ensure that this constitutes a major update
      const { major } = extractVersionsFromSemver((document[fieldName] && document[fieldName].version) ? document[fieldName].version : undefined)
      const updateType = (isBeingUndrafted && (major < 1)) ? 'major' : defaultUpdateType
      const version = await getNextVersion(document._id, updateType, fieldName, (newDocument as DbPost).draft)
      const userId = currentUser._id
      const editedAt = new Date()

      let newRevisionId;
      if (await revisionIsChange(newDocument, fieldName)) {
        const previousRev = await getLatestRev(newDocument._id, fieldName);
        const changeMetrics = htmlToChangeMetrics(previousRev?.html || "", html);

        const newRevision: Omit<DbRevision, '_id' | 'schemaVersion' | "voteCount" | "baseScore" | "extendedScore"| "score" | "inactive" | "autosaveTimeoutStart"> = {
          documentId: document._id,
          ...await buildRevision({
            originalContents: newDocument[fieldName].originalContents,
            dataWithDiscardedSuggestions,
            currentUser,
          }),
          fieldName,
          collectionName,
          version,
          draft: versionIsDraft(version, collectionName),
          updateType,
          commitMessage,
          changeMetrics,
          createdAt: editedAt,
        }
        const newRevisionDoc = await createMutator({
          collection: Revisions,
          document: newRevision,
          validate: false
        });
        newRevisionId = newRevisionDoc.data._id;
      } else {
        newRevisionId = (await getLatestRev(newDocument._id, fieldName))!._id;
      }

      if (newRevisionId) {
        await afterCreateRevisionCallback.runCallbacksAsync([{ revisionID: newRevisionId }]);
      }

      return {
        ...docData,
        [fieldName]: {
          ...docData[fieldName],
          html, version, userId, editedAt, wordCount
        },
        [`${fieldName}_latest`]: newRevisionId,
        ...(pingbacks ? {
          pingbacks: await htmlToPingbacks(html, [{
              collectionName: collection.collectionName,
              documentId: document._id,
            }]
          ),
        } : null),
      }
    }
    return docData
  });

  getCollectionHooks(collectionName).createAfter.add(
    async function editorSerializationAfterCreate(newDoc: DbRevision)
  {
    // Update revision to point to the document that owns it.
    const revisionID = newDoc[`${fieldName}_latest`];
    if (revisionID) {
      await Revisions.rawUpdateOne(
        { _id: revisionID },
        { $set: { documentId: newDoc._id } }
      );
      await afterCreateRevisionCallback.runCallbacksAsync([{ revisionID: revisionID }]);
    }
    return newDoc;
  });
}

export function addAllEditableCallbacks() {
  sealEditableFields();
  for (let collectionName of editableCollections) {
    for (let fieldName of editableCollectionsFields[collectionName]) {
      const collection = getCollection(collectionName);
      const options = editableCollectionsFieldOptions[collectionName][fieldName];
      addEditableCallbacks({collection, options});
    }
  }
}

onStartup(addAllEditableCallbacks);

/// Given an HTML diff, where added sections are marked with <ins> and <del>
/// tags, count the number of chars added and removed. This is used for providing
/// a quick distinguisher between small and large changes, on revision history
/// lists.
const diffToChangeMetrics = (diffHtml: string): ChangeMetrics => {
  // @ts-ignore
  const parsedHtml = cheerio.load(diffHtml, null, false);

  const insertedChars = countCharsInTag(parsedHtml, "ins");
  const removedChars = countCharsInTag(parsedHtml, "del");

  return { added: insertedChars, removed: removedChars };
}

const countCharsInTag = (parsedHtml: cheerio.Root, tagName: string): number => {
  const instancesOfTag = parsedHtml(tagName);
  let cumulative = 0;
  for (let i=0; i<instancesOfTag.length; i++) {
    const tag = instancesOfTag[i];
    const text = cheerio(tag).text();
    cumulative += text.length;
  }
  return cumulative;
}

export const htmlToChangeMetrics = (oldHtml: string, newHtml: string): ChangeMetrics => {
  const htmlDiff = diff(oldHtml, newHtml);
  return diffToChangeMetrics(htmlDiff);
}
