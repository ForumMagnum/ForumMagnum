import { Utils } from 'meteor/vulcan:core';
import { convertFromRaw } from 'draft-js';
import { draftToHTML } from '../../lib/editor/utils.js';

import TurndownService from 'turndown';
const turndownService = new TurndownService()

import markdownIt from 'markdown-it'
import markdownItMathjax from './markdown-mathjax.js'
var mdi = markdownIt()
mdi.use(markdownItMathjax())
import { addCallback } from 'meteor/vulcan:core';
import { mjpage }  from 'mathjax-node-page'

import htmlToText from 'html-to-text'

export const addEditableCallbacks = ({collection, options = {}}) => {
  const {
    fieldName
  } = options
  // Promisified version of mjpage
  function mjPagePromise(html, beforeSerializationCallback) {
    // Takes in HTML and replaces LaTeX with CommonHTML snippets
    // https://github.com/pkra/mathjax-node-page
    return new Promise((resolve, reject) => {
      mjpage(html, {}, {html: true, css: true}, resolve)
        .on('beforeSerialization', beforeSerializationCallback);
    })
  }

  const createHtmlHighlight = (body) => {
    if (body.length > 2400) {
      // drop the last paragraph
      const highlight2400Shortened = body.slice(0,2400).split("\n").slice(0,-1).join("\n")
      const highlightnewlineShortened = body.split("\n\n").slice(0,5).join("\n\n")
      if (highlightnewlineShortened.length > highlight2400Shortened.length) {
        return mdi.render(highlight2400Shortened)
      } else {
        return mdi.render(highlightnewlineShortened)
      }
    } else {
      return mdi.render(body)
    }
  }

  const createExcerpt = (body) => {
    const excerpt = body.slice(0,400)
    if (excerpt.includes("[")) {
      const excerptTrimLink = excerpt.split("[").slice(0, -1).join('[')
      return mdi.render(excerptTrimLink + "... (Read More)")
    } else {
      return mdi.render(excerpt + "... (Read More)")
    }
  }

  const convertFromContent = (content, fieldName = "") => {
    const contentState = convertFromRaw(content);
    const htmlBody = draftToHTML(contentState)
    const body = htmlToMarkdown(htmlBody)
    return {
      [`${fieldName}htmlBody`]: htmlBody,
      [`${fieldName}body`]: body,
      ...getExcerptFields(body, fieldName),
      [`${fieldName}lastEditedAs`]: 'draft-js'
    }
  }

  const convertFromContentAsync = async function(content) {
    const newContent = await Utils.preProcessLatex(content)
    return convertFromContent(newContent)
  }

  const getExcerptFields = (body, fieldName = "") => {
    const wordCount = body.split(" ").length
    const htmlHighlight = createHtmlHighlight(body)
    const excerpt = createExcerpt(body)
    const plaintextExcerpt = htmlToText.fromString(excerpt)
    return {
      [`${fieldName}wordCount`]: wordCount,
      [`${fieldName}htmlHighlight`]:htmlHighlight,
      [`${fieldName}excerpt`]:excerpt,
      [`${fieldName}plaintextExcerpt`]:plaintextExcerpt,
    }
  }

  const htmlToMarkdown = (html) => {
    return turndownService.turndown(html)
  }

  const convertFromHTML = (html, sanitize) => {
    const body = htmlToMarkdown(html)
    const htmlBody = sanitize ? Utils.sanitize(html) : html
    return {
      [`${fieldName}htmlBody`]: htmlBody,
      [`${fieldName}body`]: body,
      ...getExcerptFields(body, fieldName),
      lastEditedAs: "html",
    }
  }

  const convertFromMarkdown = (body, fieldName = "") => {
    return {
      [`${fieldName}htmlBody`]: mdi.render(body),
      [`${fieldName}body`]: body,
      ...getExcerptFields(body, fieldName),
      lastEditedAs: "markdown"
    }
  }

  const convertFromMarkdownAsync = async (body) => {
    const newPostFields = convertFromMarkdown(body)
    const newHtmlBody = await mjPagePromise(newPostFields.htmlBody, Utils.trimEmptyLatexParagraphs)
    return {
      ...newPostFields,
      htmlBody: newHtmlBody
    }
  }

  async function editorSerializationNew(doc, author) {
    if (doc.content) {
      const newFields = await convertFromContentAsync(doc.content);
      doc = {...doc, ...newFields}
    } else if (doc.body) {
      const newFields = await convertFromMarkdownAsync(doc.body)
      doc = {...doc, ...newFields}
    } else if (doc.htmlBody) {
      const newFields = convertFromHTML(doc.htmlBody, !author.isAdmin);
      doc = {...doc, ...newFields}
    }
    return doc
  }
  addCallback(`${collection.options.collectionName.toLowerCase()}.new.sync`, editorSerializationNew);

  async function editorSerializationeEdit (modifier, doc, author) {
    if (modifier.$set && modifier.$set.content) {
      const newFields = await convertFromContentAsync(modifier.$set.content)
      modifier.$set = {...modifier.$set, ...newFields}
      delete modifier.$unset.htmlBody
    } else if (modifier.$set && modifier.$set.body) {
      const newFields = await convertFromMarkdownAsync(modifier.$set.body)
      modifier.$set = {...modifier.$set, ...newFields}
      delete modifier.$unset.htmlBody
    } else if (modifier.$set && modifier.$set.htmlBody) {
      const newFields = convertFromHTML(modifier.$set.htmlBody, !author.isAdmin);
      modifier.$set = {...modifier.$set, ...newFields}
    }
    return modifier
  }

  addCallback(`${collection.options.collectionName.toLowerCase()}.edit.sync`, editorSerializationeEdit);
}
