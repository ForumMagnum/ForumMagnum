/* global Random */
import { Utils } from 'meteor/vulcan:core';
import { convertFromRaw } from 'draft-js';
import { draftToHTML } from '../draftConvert';
import Revisions from '../../lib/collections/revisions/collection'
import { extractVersionsFromSemver } from '../../lib/editor/utils'
import { ensureIndex } from '../../lib/collectionUtils'
import TurndownService from 'turndown';
const turndownService = new TurndownService()
turndownService.remove('style') // Make sure we don't add the content of style tags to the markdown

import markdownIt from 'markdown-it'
import markdownItMathjax from './markdown-mathjax.js'
import markdownItContainer from 'markdown-it-container'
import markdownItFootnote from 'markdown-it-footnote'

const mdi = markdownIt({linkify: true})
mdi.use(markdownItMathjax())
mdi.use(markdownItContainer, 'spoiler')
mdi.use(markdownItFootnote)

import { addCallback } from 'meteor/vulcan:core';
import { mjpage }  from 'mathjax-node-page'

function mjPagePromise(html, beforeSerializationCallback) {
  // Takes in HTML and replaces LaTeX with CommonHTML snippets
  // https://github.com/pkra/mathjax-node-page
  return new Promise((resolve, reject) => {
    mjpage(html, {}, {html: true, css: true}, resolve)
      .on('beforeSerialization', beforeSerializationCallback);
  })
}

export async function draftJSToHtmlWithLatex(draftJS) {
  const draftJSWithLatex = await Utils.preProcessLatex(draftJS)
  return draftToHTML(convertFromRaw(draftJSWithLatex))
}

export function htmlToMarkdown(html) {
  return turndownService.turndown(html)
}

export function markdownToHtmlNoLaTeX(markdown) {
  const randomId = Random.id()
  return mdi.render(markdown, {docId: randomId})
}

export async function markdownToHtml(markdown) {
  const html = markdownToHtmlNoLaTeX(markdown)
  return await mjPagePromise(html, Utils.trimEmptyLatexParagraphs)
}

async function dataToHTML(data, type, sanitize = false) {
  switch (type) {
    case "html":
      return sanitize ? Utils.sanitize(data) : data
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

async function getNextVersion(documentId, updateType = 'minor', fieldName, isDraft) {
  const lastRevision = await Revisions.findOne({documentId: documentId, fieldName}, {sort: {version: -1}}) || {}
  const { major, minor, patch } = extractVersionsFromSemver(lastRevision.version)
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

export function addEditableCallbacks({collection, options = {}}) {
  const {
    fieldName = "contents",
    deactivateNewCallback // Because of Meteor shenannigans we don't have access to the full user object when a new user is created, and this creates
    // bugs when we register callbacks that trigger on new user creation. So we allow the deactivation of the new callbacks.
  } = options

  const { typeName } = collection.options

  async function editorSerializationNew (doc, { currentUser }) {
    if (doc[fieldName] && doc[fieldName].originalContents) {
      if (!currentUser) { throw Error("Can't create document without current user") }
      const { data, type } = doc[fieldName].originalContents
      const html = await dataToHTML(data, type, !currentUser.isAdmin)
      const wordCount = await dataToWordCount(data, type)
      const version = getInitialVersion(doc)
      const userId = currentUser._id
      const editedAt = new Date()
      return {...doc, [fieldName]: {...doc[fieldName], html, version, userId, editedAt, wordCount, updateType: 'initial'}}  
    }
    return doc
  }

  if (!deactivateNewCallback) {
    addCallback(`${typeName.toLowerCase()}.create.before`, editorSerializationNew);
  }

  async function editorSerializationEdit (docData, { document, currentUser }) {
    if (docData[fieldName] && docData[fieldName].originalContents) {
      if (!currentUser) { throw Error("Can't create document without current user") }
      const { data, type } = docData[fieldName].originalContents
      const html = await dataToHTML(data, type, !currentUser.isAdmin)
      const wordCount = await dataToWordCount(data, type)
      const defaultUpdateType = docData[fieldName].updateType || (!document[fieldName] && 'initial') || 'minor'
      const newDocument = {...document, ...docData}
      const isBeingUndrafted = document.draft && !newDocument.draft
      // When a document is undrafted for the first time, we ensure that this constitutes a major update
      const { major } = extractVersionsFromSemver((document[fieldName] && document[fieldName].version) ? document[fieldName].version : undefined)
      const updateType = (isBeingUndrafted && (major < 1)) ? 'major' : defaultUpdateType
      const version = await getNextVersion(document._id, updateType, fieldName, newDocument.draft)
      const userId = currentUser._id
      const editedAt = new Date()
      return {...docData, [fieldName]: {...docData[fieldName], html, version, userId, editedAt, wordCount}}
    } 
    return docData
  }
  
  addCallback(`${typeName.toLowerCase()}.update.before`, editorSerializationEdit);

  async function editorSerializationCreateRevision(newDoc, { document }) {
    if (newDoc[fieldName] && newDoc[fieldName].originalContents && 
      (newDoc[fieldName].version !== (document && document[fieldName] && document[fieldName].version))) {
      Revisions.insert({
        ...newDoc[fieldName],
        documentId: newDoc._id,
        fieldName
      })
    }
    return newDoc
  }
  
  addCallback(`${typeName.toLowerCase()}.create.after`, editorSerializationCreateRevision)
  addCallback(`${typeName.toLowerCase()}.update.after`, editorSerializationCreateRevision)
}
