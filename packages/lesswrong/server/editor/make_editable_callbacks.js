import { Utils } from 'meteor/vulcan:core';
import { convertFromRaw } from 'draft-js';
import { draftToHTML } from '../../lib/editor/utils.js';
import { highlightFromHTML, excerptFromHTML } from '../../lib/editor/ellipsize.jsx';

import TurndownService from 'turndown';
const turndownService = new TurndownService()
turndownService.remove('style') // Make sure we don't add the content of style tags to the markdown

import markdownIt from 'markdown-it'
import markdownItMathjax from './markdown-mathjax.js'
var mdi = markdownIt()
mdi.use(markdownItMathjax())
import { addCallback } from 'meteor/vulcan:core';
import { mjpage }  from 'mathjax-node-page'

import htmlToText from 'html-to-text'

function mjPagePromise(html, beforeSerializationCallback) {
  // Takes in HTML and replaces LaTeX with CommonHTML snippets
  // https://github.com/pkra/mathjax-node-page
  return new Promise((resolve, reject) => {
    mjpage(html, {}, {html: true, css: true}, resolve)
      .on('beforeSerialization', beforeSerializationCallback);
  })
}

export const getExcerptFieldsFromMarkdown = (markdownBody, fieldName = "") => {
  const htmlBody = mdi.render(markdownBody);
  return getExcerptFieldsFromHTML(htmlBody, fieldName);
}

export const getExcerptFieldsFromHTML = (html, fieldName = "") => {
  const markdownBody = htmlToMarkdown(html);
  const wordCount = wordcountFromMarkdown(markdownBody);
  const htmlHighlight = highlightFromHTML(html);
  const excerpt = excerptFromHTML(html);
  const plaintextExcerpt = htmlToText.fromString(excerpt);
  return {
    [`${fieldName}wordCount`]: wordCount,
    [`${fieldName}htmlHighlight`]: htmlHighlight,
    [`${fieldName}excerpt`]: excerpt,
    [`${fieldName}plaintextExcerpt`]: plaintextExcerpt,
  }
}

const wordcountFromMarkdown = (markdownBody) => {
  return markdownBody.split(" ").length;
}



const convertFromContent = (content, fieldName = "") => {
  const contentState = convertFromRaw(content);
  const htmlBody = draftToHTML(contentState)
  const body = htmlToMarkdown(htmlBody)
  return {
    [`${fieldName}htmlBody`]: htmlBody,
    [`${fieldName}body`]: body,
    ...getExcerptFieldsFromHTML(htmlBody, fieldName),
    [`${fieldName}lastEditedAs`]: 'draft-js'
  }
}

const convertFromContentAsync = async function(content, fieldName = "") {
  const newContent = await Utils.preProcessLatex(content)
  return convertFromContent(newContent, fieldName)
}

export const htmlToMarkdown = (html) => {
  return turndownService.turndown(html)
}

const convertFromHTML = (html, sanitize, fieldName = "") => {
  const body = htmlToMarkdown(html)
  const htmlBody = sanitize ? Utils.sanitize(html) : html
  return {
    [`${fieldName}htmlBody`]: htmlBody,
    [`${fieldName}body`]: body,
    ...getExcerptFieldsFromHTML(html, fieldName),
    [`${fieldName}lastEditedAs`]: "html",
  }
}

const convertFromMarkdown = (body, fieldName = "") => {
  return {
    [`${fieldName}htmlBody`]: mdi.render(body),
    [`${fieldName}body`]: body,
    ...getExcerptFieldsFromMarkdown(body, fieldName),
    [`${fieldName}lastEditedAs`]: "markdown"
  }
}

const convertFromMarkdownAsync = async (body, fieldName = "") => {
  const newPostFields = convertFromMarkdown(body, fieldName)
  const newHtmlBody = await mjPagePromise(newPostFields.htmlBody, Utils.trimEmptyLatexParagraphs)
  return {
    ...newPostFields,
    [`${fieldName}htmlBody`]: newHtmlBody
  }
}

export function addEditableCallbacks({collection, options = {}}) {
  const { fieldName } = options
  // Promisified version of mjpage

  async function editorSerializationNew(doc, author) {
    let newFields = {}
    let newDoc = {...doc}
    if (doc.content) {
      newFields = await convertFromContentAsync(doc.content, fieldName);
      newDoc = {...doc, ...newFields}
    } else if (doc.body) {
      newFields = await convertFromMarkdownAsync(doc.body, fieldName)
      newDoc = {...doc, ...newFields}
    } else if (doc.htmlBody) {
      newFields = convertFromHTML(doc.htmlBody, !(author && author.isAdmin), fieldName);
      newDoc = {...doc, ...newFields}
    }
    return newDoc
  }
  addCallback(`${collection.options.collectionName.toLowerCase()}.new.sync`, editorSerializationNew);

  async function editorSerializationEdit (modifier, doc, author) {
    let newFields = {}
    let newModifier = {...modifier}
    if (modifier.$set && modifier.$set.content) {
      newFields = await convertFromContentAsync(modifier.$set.content, fieldName)
      newModifier.$set = {...modifier.$set, ...newFields}
      if (modifier.$unset) {delete modifier.$unset.htmlBody}
    } else if (modifier.$set && modifier.$set.body) {
      newFields = await convertFromMarkdownAsync(modifier.$set.body, fieldName)
      newModifier.$set = {...modifier.$set, ...newFields}
      if (modifier.$unset) {delete modifier.$unset.htmlBody}
    } else if (modifier.$set && modifier.$set.htmlBody) {
      newFields = convertFromHTML(modifier.$set.htmlBody, !(author && author.isAdmin), fieldName);
      newModifier.$set = {...modifier.$set, ...newFields}
    }
    return newModifier
  }

  addCallback(`${collection.options.collectionName.toLowerCase()}.edit.sync`, editorSerializationEdit);
}
