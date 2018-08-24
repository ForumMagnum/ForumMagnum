import { Utils } from 'meteor/vulcan:core';
import { Posts, Comments } from 'meteor/example-forum';
let mjAPI = require('mathjax-node')

import { convertFromRaw } from 'draft-js';
import { draftToHTML } from '../../lib/editor/utils.js';

import TurndownService from 'turndown';
const turndownService = new TurndownService()

import markdownIt from 'markdown-it'
import markdownItMathjax from './markdown-mathjax'
var mdi = markdownIt()
mdi.use(markdownItMathjax())

import { mjpage }  from 'mathjax-node-page'

// Promisified version of mjpage
function mjPagePromise(html, beforeSerializationCallback) {
  // Takes in HTML and replaces LaTeX with CommonHTML snippets
  // https://github.com/pkra/mathjax-node-page
  return new Promise((resolve, reject) => {
    mjpage(html, {}, {html: true, css: true}, resolve)
      .on('beforeSerialization', beforeSerializationCallback);
  })
}

Posts.createHtmlHighlight = (body, id, slug, wordCount) => {
  const highlight = body.replace(/< refresh to render LaTeX >/g, "< LaTeX Equation >")
  if (body.length > 2400) {
    // drop the last paragraph
    const highlight2400Shortened = highlight.slice(0,2400).split("\n").slice(0,-1).join("\n")
    const highlightnewlineShortened = highlight.split("\n\n").slice(0,5).join("\n\n")
    if (highlightnewlineShortened.length > highlight2400Shortened.length) {
      return mdi.render(highlight2400Shortened)
    } else {
      return mdi.render(highlightnewlineShortened)
    }
  } else {
    return mdi.render(highlight)
  }
}

Posts.createExcerpt = (body) => {
  const excerpt = body.slice(0,400)
  if (excerpt.includes("[")) {
    const excerptTrimLink = excerpt.split("[").slice(0, -1).join('[')
    return mdi.render(excerptTrimLink + "... (Read More)")
  } else {
    return mdi.render(excerpt + "... (Read More)")
  }
}

/*ws
 * @summary Takes in a content field, returns object with {htmlBody, body, excerpt}
*/

Posts.convertFromContent = (content, id, slug) => {
  const contentState = convertFromRaw(content);
  const htmlBody = draftToHTML(contentState)
  const body = turndownService.turndown(htmlBody)
  const excerpt = Posts.createExcerpt(body)
  const wordCount = body.split(" ").length
  const htmlHighlight = Posts.createHtmlHighlight(body, id, slug, wordCount)
  return {
    htmlBody: htmlBody,
    body: body,
    excerpt: excerpt,
    htmlHighlight: htmlHighlight,
    wordCount: wordCount,
    lastEditedAs: 'draft-js'
  }
}

Comments.convertFromContent = (content) => {
  const contentState = convertFromRaw(content);
  const htmlBody = draftToHTML(contentState)
  return {
    htmlBody: htmlBody,
    body: turndownService.turndown(htmlBody),
    lastEditedAs: 'draft-js'
  }
}

Posts.convertFromContentAsync = async function(content) {
  const newContent = await Utils.preProcessLatex(content)
  return Posts.convertFromContent(newContent)
}

Comments.convertFromContentAsync = async function(content) {
  const newContent = await Utils.preProcessLatex(content);
  return Comments.convertFromContent(newContent)
}

/*
 * @summary Input is html, returns object with new post fields
*/

Posts.convertFromHTML = (html, id, slug, sanitize) => {
  const body = turndownService.turndown(html)
  const excerpt = Posts.createExcerpt(body)
  const wordCount = body.split(" ").length
  const htmlHighlight = Posts.createHtmlHighlight(body, id, slug, wordCount)
  const htmlBody = sanitize ? Utils.sanitize(html) : html
  return {
    body,
    htmlBody,
    excerpt,
    wordCount,
    htmlHighlight,
    lastEditedAs: "html",
  }
}

Comments.convertFromHTML = (html) => {
  const body = turndownService.turndown(html);
  return {
    body,
    htmlBody: html,
    lastEditedAs: "html"
  }
}


Posts.convertFromMarkdown = (body, id, slug) => {
  const wordCount = body.split(" ").length
  const htmlHighlight = Posts.createHtmlHighlight(body, id, slug, wordCount)
  return {
    htmlBody: mdi.render(body),
    body: body,
    excerpt: Posts.createExcerpt(body),
    htmlHighlight: htmlHighlight,
    wordCount: wordCount,
    lastEditedAs: "markdown"
  }
}

Comments.convertFromMarkdown = (body) => {
  return {
    htmlBody: mdi.render(body),
    body: body,
    lastEditedAs: "markdown"
  }
}

Posts.convertFromMarkdownAsync = async (body, id, slug) => {
  const newPostFields = Posts.convertFromMarkdown(body, id, slug)
  const newHtmlBody = await mjPagePromise(newPostFields.htmlBody, Utils.trimEmptyLatexParagraphs)
  return {
    ...newPostFields,
    htmlBody: newHtmlBody
  }
}

Comments.convertFromMarkdownAsync = async (body) => {
  const newCommentFields = Comments.convertFromMarkdown(body)
  const newHTMLBody = await mjPagePromise(newCommentFields.htmlBody, Utils.trimEmptyLatexParagraphs)
  return {
    ...newCommentFields,
    htmlBody: newHTMLBody
  }
}

Utils.trimEmptyLatexParagraphs = (dom) => {
  // Remove empty paragraphs
  var paragraphs = dom.getElementsByClassName("MJXc-display");
  // We trim all display equations that don't have any textContent. This seems
  // Likely fine, but there is some chance this means we are also trimming some
  // Equations that only have images or something like that. If this happen, we
  // want to adjust this part.
  for (var i = 0, len = paragraphs.length; i < len; i++) {
      var elem = paragraphs[i];
      if (elem.textContent.trim() == '') {
          elem.parentNode.removeChild(elem);
          i--;
          len--;
      }
  }
  return dom
}

const MATHJAX_OPTIONS = {
  jax: ['input/TeX', 'output/CommonHTML'],
  TeX: {
    extensions: ['autoload-all.js'],
  },
  messageStyles: 'none',
  showProcessingMessages: false,
  showMathMenu: false,
  showMathMenuMSIE: false,
  preview: 'none',
  delayStartupTypeset: true,
}

mjAPI.config({
  MathJax: MATHJAX_OPTIONS
});
mjAPI.start();

Utils.preProcessLatex = async (content) => {
  // MathJax-rendered LaTeX elements have an associated stylesheet. We put this
  // inline with the first (and only the first) MathJax element; this ensures
  // that it ends up in feeds, in greaterwrong's scrapes, etc, whereas if it
  // were part of the site's top-level styles, it wouldn't. This leads to
  // at most one copy per LaTeX-using post or comment; so there's some
  // duplication, but not the extreme amount of duplication we had before
  // (where a single post that used LaTeX heavily added ~80 copies of 19kb
  // each to the front page).
  //
  // The MathJax stylesheet varies with its configuration, but (we're pretty
  // sure) does not vary with the content of what it's rendering.

  // gets set to true if a stylesheet has already been added
  let mathjaxStyleUsed = false;

  for (let key in content.entityMap) { // Can't use forEach with await
    let value = content.entityMap[key];
    if(value.type === "INLINETEX" && value.data.teX) {
      const mathJax = await mjAPI.typeset({
            math: value.data.teX,
            format: "inline-TeX",
            html: true,
            css: !mathjaxStyleUsed,
      })
      value.data = {...value.data, html: mathJax.html};
      if (!mathjaxStyleUsed) {
        value.data.css = mathJax.css;
        mathjaxStyleUsed = true;
      }
      content.entityMap[key] = value;
    }
  }

  for (let key in content.blocks) {
    const block = content.blocks[key];
    if (block.type === "atomic" && block.data.mathjax) {
      const mathJax = await mjAPI.typeset({
        math: block.data.teX,
        format: "TeX",
        html: true,
        css: !mathjaxStyleUsed,
      })
      block.data = {...block.data, html: mathJax.html};
      if (!mathjaxStyleUsed) {
        block.data.css = mathJax.css;
        mathjaxStyleUsed = true;
      }
    }
  }

  return content;
}
