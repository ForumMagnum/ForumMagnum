import Revisions from './collection'
import { draftToHTML, htmlToDraft } from '../../editor/utils';
import { convertFromRaw, convertToRaw } from 'draft-js';
import { htmlToMarkdown, markdownToHtml } from '../../../server/editor/make_editable_callbacks'
import { highlightFromHTML } from '../../editor/ellipsize';
import { JSDOM } from 'jsdom'
import htmlToText from 'html-to-text'

const PLAINTEXT_DESCRIPTION_LENGTH = 500

// We have to add this type definition to the global object to allow draft-convert to properly work on the server
global.HTMLElement = new JSDOM().window.HTMLElement

function domBuilder(html) {
  const jsdom = new JSDOM(html)
  const document = jsdom.window.document;
  const bodyEl = document.body; // implicitly created
  return bodyEl
}


export function dataToMarkdown(data, type) {
  switch (type) {
    case "markdown": {
      return data
    }
    case "html": {
      return htmlToMarkdown(data)
    }
    case "draftJS": {
      const contentState = convertFromRaw(data);
      const html = draftToHTML(contentState)
      return htmlToMarkdown(html)
    }
  }
}

export function dataToDraftJS(data, type) {
  switch (type) {
    case "draftJS": {
      return data
    }
    case "html": {
      const draftJSContentState = htmlToDraft(data, {}, domBuilder)
      return convertToRaw(draftJSContentState)  // On the server have to parse in a JS-DOM implementation to make htmlToDraft work
    }
    case "markdown": {
      const html = markdownToHtml(data)
      const draftJSContentState = htmlToDraft(html, {}, domBuilder) // On the server have to parse in a JS-DOM implementation to make htmlToDraft work
      return convertToRaw(draftJSContentState) 
    }
  }
}

Revisions.addField([
  {
    fieldName: 'markdown',
    fieldSchema: {
      type: String,
      resolveAs: {
        type: 'String',
        resolver: ({originalContents: {data, type}}) => dataToMarkdown(data, type)
      }
    }
  },
  {
    fieldName: 'draftJS',
    fieldSchema: {
      type: Object,
      resolveAs: {
        type: 'JSON',
        resolver: ({originalContents: {data, type}}) => dataToDraftJS(data, type)
      }
    }
  },
  {
    fieldName: 'wordCount',
    fieldSchema: {
      type: String,
      resolveAs: {
        type: 'Int',
        resolver: ({originalContents: {data, type}}) => {
          const markdown = dataToMarkdown(data, type) || ""
          return markdown.split(" ").length
        }
      }
    }
  }, 
  {
    fieldName: 'htmlHighlight',
    fieldSchema: {
      type: String,
      resolveAs: {
        type: 'String',
        resolver: ({html}) => highlightFromHTML(html)
      }
    }
  },
  {
    fieldName: 'plaintextDescription',
    fieldSchema: {
      type: String,
      resolveAs: {
        type: 'String',
        resolver: ({html}) => htmlToText
                              .fromString(html)
                              .substring(0, PLAINTEXT_DESCRIPTION_LENGTH)
      }
    }
  }
])