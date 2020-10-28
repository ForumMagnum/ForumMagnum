import { Utils, addCallback, Connectors } from '../vulcan-lib';
import { sanitize } from '../vulcan-lib/utils';
import { randomId } from '../../lib/random';
import { getDraftToHTML } from '../draftConvert';
import { Revisions, ChangeMetrics } from '../../lib/collections/revisions/collection'
import { extractVersionsFromSemver } from '../../lib/editor/utils'
import { ensureIndex } from '../../lib/collectionUtils'
import { htmlToPingbacks } from '../pingbacks';
import Sentry from '@sentry/node';
import { diff } from '../vendor/node-htmldiff/htmldiff';
import * as _ from 'underscore';

import markdownIt from 'markdown-it'
import markdownItMathjax from './markdown-mathjax'
import cheerio from 'cheerio';
import markdownItContainer from 'markdown-it-container'
import markdownItFootnote from 'markdown-it-footnote'
import markdownItSub from 'markdown-it-sub'

const mdi = markdownIt({linkify: true})
mdi.use(markdownItMathjax())
mdi.use(markdownItContainer, 'spoiler')
mdi.use(markdownItFootnote)
mdi.use(markdownItSub)

function mjPagePromise(html: string, beforeSerializationCallback): Promise<string> {
  // Takes in HTML and replaces LaTeX with CommonHTML snippets
  // https://github.com/pkra/mathjax-node-page
  return new Promise((resolve, reject) => {
    let finished = false;
    
    setTimeout(() => {
      if (!finished) {
        const errorMessage = `Timed out in mjpage when processing html: ${html}`;
        Sentry.captureException(new Error(errorMessage));
        // eslint-disable-next-line no-console
        console.error(errorMessage);
      }
    }, 10000);
    
    const errorHandler = (id, wrapperNode, sourceFormula, sourceFormat, errors) => {
      // eslint-disable-next-line no-console
      console.log("Error in Mathjax handling: ", id, wrapperNode, sourceFormula, sourceFormat, errors)
      reject(`Error in $${sourceFormula}$: ${errors}`)
    }
    
    const callbackAndMarkFinished = (...args) => {
      finished = true;
      return beforeSerializationCallback(...args);
    };
    
    const { mjpage } = require("mathjax-node-page");
    mjpage(html, { fragment: true, errorHandler, format: ["MathML", "TeX"] } , {html: true, css: true}, resolve)
      .on('beforeSerialization', callbackAndMarkFinished);
  })
}

// Adapted from: https://github.com/cheeriojs/cheerio/issues/748
const cheerioWrapAll = (toWrap, wrapper, $) => {
  if (toWrap.length < 1) {
    return toWrap;
  } 

  if (toWrap.length < 2 && $.wrap) { // wrap not defined in npm version,
    return $.wrap(wrapper);      // and git version fails testing.
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
function wrapSpoilerTags(html) {
  const $ = cheerio.load(html)
  
  // Iterate through spoiler elements, collecting them into groups. We do this
  // the hard way, because cheerio's sibling-selectors don't seem to work right.
  let spoilerBlockGroups: Array<any> = [];
  let currentBlockGroup: Array<any> = [];
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
  const $ = cheerio.load(`<div id="root">${html}</div>`)
  const topLevelElements = $('#root').children().get()
  // Iterate once forward until we find non-empty paragraph to trim leading empty paragraphs
  removeLeadingEmptyParagraphsAndBreaks(topLevelElements, $)
  // Then iterate backwards to trim trailing empty paragraphs
  removeLeadingEmptyParagraphsAndBreaks(topLevelElements.reverse(), $)
  return $("#root").html() || ""
}

const removeLeadingEmptyParagraphsAndBreaks = (elements, $) => {
   for (const elem of elements) {
    if (isEmptyParagraphOrBreak(elem)) {
      $(elem).remove()
    } else {
      break
    }
  }
}

const isEmptyParagraphOrBreak = (elem) => {
  if (elem.name === "p") {
    if (elem.children?.length === 0) return true
    if (elem.children?.length === 1 && elem.children[0]?.type === "text" && elem.children[0]?.data.trim() === "") return true
    return false
  }
  if (elem.name === "br") return true
  return false
}


export async function draftJSToHtmlWithLatex(draftJS) {
  const draftJSWithLatex = await Utils.preProcessLatex(draftJS)
  const convertFromRaw = require("draft-js").convertFromRaw;
  const html = getDraftToHTML()(convertFromRaw(draftJSWithLatex))
  const trimmedHtml = trimLeadingAndTrailingWhiteSpace(html)
  return wrapSpoilerTags(trimmedHtml)
}

let turndownService: any = null;
function getTurndownService() {
  if (!turndownService) {
    const TurndownService = require('turndown');
    turndownService = new TurndownService()
    turndownService.remove('style') // Make sure we don't add the content of style tags to the markdown
  }
  return turndownService;
}

export function htmlToMarkdown(html) {
  return getTurndownService().turndown(html)
}

export function ckEditorMarkupToMarkdown(markup) {
  // Sanitized CKEditor markup is just html
  return getTurndownService().turndown(sanitize(markup))
}

export function markdownToHtmlNoLaTeX(markdown: string): string {
  const id = randomId()
  const renderedMarkdown = mdi.render(markdown, {docId: id})
  return trimLeadingAndTrailingWhiteSpace(renderedMarkdown)
}

export async function markdownToHtml(markdown: string): Promise<string> {
  const html = markdownToHtmlNoLaTeX(markdown)
  return await mjPagePromise(html, Utils.trimLatexAndAddCSS)
}

export function removeCKEditorSuggestions(markup) {
  // First we remove all suggested deletion and modify formatting tags
  const markupWithoutDeletionsAndModifications = markup.replace(
    /<suggestion\s*id="[a-zA-Z0-9:]+"\s*suggestion-type="(deletion|formatInline:[a-zA-Z0-9]+|formatBlock:[a-zA-Z0-9]+)" type="(start|end)"><\/suggestion>/g,
    ''
  )
  // Then we remove everything between suggested insertions
  const markupWithoutInsertions = markupWithoutDeletionsAndModifications.replace(
    /<suggestion\s*id="([a-zA-Z0-9:]+)"\s*suggestion-type="insertion" type="start"><\/suggestion>.*<suggestion\s*id="\1"\s*suggestion-type="insertion"\s*type="end"><\/suggestion>/g,
    ''
  ) 
  return markupWithoutInsertions
}

export async function ckEditorMarkupToHtml(markup) {
  // First we remove any unaccepted suggestions from the markup
  const markupWithoutSuggestions = removeCKEditorSuggestions(markup)
  // Sanitized CKEditor markup is just html
  const html = sanitize(markupWithoutSuggestions)
  const trimmedHtml = trimLeadingAndTrailingWhiteSpace(html)
  // Render any LaTeX tags we might have in the HTML
  return await mjPagePromise(trimmedHtml, Utils.trimLatexAndAddCSS)
}

async function dataToHTML(data, type, sanitizeData = false) {
  switch (type) {
    case "html":
      return sanitizeData ? sanitize(data) : data
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
        const convertFromRaw = require("draft-js").convertFromRaw;
        const contentState = convertFromRaw(data);
        const html = getDraftToHTML()(contentState)
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

export async function dataToWordCount(data, type) {
  try {
    const markdown = dataToMarkdown(data, type) || ""
    return markdown.split(" ").length
  } catch(err) {
    // eslint-disable-next-line no-console
    console.error("Error in dataToWordCount", data, type, err)
    return 0
  }
}

function getInitialVersion(document) {
  if (document.draft) {
    return '0.1.0'
  } else {
    return '1.0.0'
  }
}

async function getLatestRev(documentId: string, fieldName: string): Promise<DbRevision|null> {
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

async function getNextVersion(documentId, updateType = 'minor', fieldName, isDraft) {
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

ensureIndex(Revisions, {documentId: 1, version: 1, fieldName: 1, editedAt: 1})

async function buildRevision({ originalContents, currentUser }) {
  const { data, type } = originalContents;
  const html = await dataToHTML(data, type, !currentUser.isAdmin)
  const wordCount = await dataToWordCount(data, type)
  
  return {
    html, wordCount, originalContents,
    editedAt: new Date(),
    userId: currentUser._id,
  };
}

// Given a revised document, check whether fieldName (a content-editor field) is
// different from the previous revision (or there is no previous revision).
const revisionIsChange = async (doc, fieldName): Promise<boolean> => {
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

export function addEditableCallbacks({collection, options = {}}: {
  collection: any,
  options: any
}) {
  const {
    fieldName = "contents",
    pingbacks = false,
    // Because of Meteor shenannigans we don't have access to the full user
    // object when a new user is created, and this creates bugs when we register
    // callbacks that trigger on new user creation. So we allow the deactivation
    // of the new callbacks.
    deactivateNewCallback,
  } = options

  const collectionName = collection.collectionName;
  const { typeName } = collection.options

  async function editorSerializationBeforeCreate (doc, { currentUser }) {
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
      
      // FIXME: This doesn't define documentId, because it's filled in in the
      // after-create callback, passing through an intermediate state where it's
      // undefined; and it's missing _id and schemaVersion, which leads to having
      // ObjectID types in the database which can cause problems. Would be good
      // to remove this ts-ignore, since there was recently an important bug here
      // (missing fieldName) that typechecking would have caught.
      // @ts-ignore
      const firstRevision = await Connectors.create(Revisions, {
        ...await buildRevision({
          originalContents: doc[fieldName].originalContents,
          currentUser,
        }),
        fieldName,
        collectionName,
        version,
        updateType: 'initial',
        commitMessage,
        changeMetrics,
      });
      
      return {
        ...doc,
        [fieldName]: {
          ...doc[fieldName],
          html, version, userId, editedAt, wordCount,
          updateType: 'initial'
        },
        [`${fieldName}_latest`]: firstRevision,
        ...(pingbacks ? {
          pingbacks: await htmlToPingbacks(html, null),
        } : null),
      }
    }
    return doc
  }
  
  if (!deactivateNewCallback) {
    addCallback(`${typeName.toLowerCase()}.create.before`, editorSerializationBeforeCreate);
  }

  async function editorSerializationEdit (docData, { oldDocument: document, newDocument, currentUser }) {
    if (docData[fieldName]?.originalContents) {
      if (!currentUser) { throw Error("Can't create document without current user") }
      
      const { data, type } = docData[fieldName].originalContents
      const commitMessage = docData[fieldName].commitMessage;
      const html = await dataToHTML(data, type, !currentUser.isAdmin)
      const wordCount = await dataToWordCount(data, type)
      const defaultUpdateType = docData[fieldName].updateType || (!document[fieldName] && 'initial') || 'minor'
      const isBeingUndrafted = document.draft && !newDocument.draft
      // When a document is undrafted for the first time, we ensure that this constitutes a major update
      const { major } = extractVersionsFromSemver((document[fieldName] && document[fieldName].version) ? document[fieldName].version : undefined)
      const updateType = (isBeingUndrafted && (major < 1)) ? 'major' : defaultUpdateType
      const version = await getNextVersion(document._id, updateType, fieldName, newDocument.draft)
      const userId = currentUser._id
      const editedAt = new Date()
      
      let newRevisionId;
      if (await revisionIsChange(newDocument, fieldName)) {
        const previousRev = await getLatestRev(newDocument._id, fieldName);
        const changeMetrics = htmlToChangeMetrics(previousRev?.html || "", html);
        
        // FIXME: See comment on the other Connectors.create call in this file.
        // Missing _id and schemaVersion.
        // @ts-ignore
        const newRevision = await Connectors.create(Revisions, {
          documentId: document._id,
          ...await buildRevision({
            originalContents: newDocument[fieldName].originalContents,
            currentUser,
          }),
          fieldName,
          collectionName,
          version,
          updateType,
          commitMessage,
          changeMetrics,
        });
        newRevisionId = newRevision._id;
      } else {
        newRevisionId = (await getLatestRev(newDocument._id, fieldName))!._id;
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
  }
  
  addCallback(`${typeName.toLowerCase()}.update.before`, editorSerializationEdit);

  async function editorSerializationAfterCreate(newDoc, { oldDocument }) {
    // Update revision to point to the document that owns it.
    const revisionID = newDoc[`${fieldName}_latest`];
    await Revisions.update(
      { _id: revisionID },
      { $set: { documentId: newDoc._id } }
    );
    
    return newDoc
  }
  
  addCallback(`${typeName.toLowerCase()}.create.after`, editorSerializationAfterCreate)
  //addCallback(`${typeName.toLowerCase()}.update.after`, editorSerializationAfterCreateOrUpdate)
}

/// Given an HTML diff, where added sections are marked with <ins> and <del>
/// tags, count the number of chars added and removed. This is used for providing
/// a quick distinguisher between small and large changes, on revision history
/// lists.
const diffToChangeMetrics = (diffHtml: string): ChangeMetrics => {
  const parsedHtml = cheerio.load(diffHtml);
  
  const insertedChars = countCharsInTag(parsedHtml, "ins");
  const removedChars = countCharsInTag(parsedHtml, "del");
  
  return { added: insertedChars, removed: removedChars };
}

const countCharsInTag = (parsedHtml: CheerioStatic, tagName: string) => {
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

