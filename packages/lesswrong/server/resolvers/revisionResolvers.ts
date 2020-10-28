import Revisions from '../../lib/collections/revisions/collection'
import { getHtmlToDraft } from '../draftConvert';
import { markdownToHtmlNoLaTeX, dataToMarkdown } from '../editor/make_editable_callbacks'
import { highlightFromHTML, truncate } from '../../lib/editor/ellipsize';
import { addFieldsDict } from '../../lib/utils/schemaUtils'
import { sanitize, sanitizeAllowedTags } from '../vulcan-lib/utils';
import htmlToText from 'html-to-text'
import sanitizeHtml from 'sanitize-html';
import * as _ from 'underscore';

const PLAINTEXT_HTML_TRUNCATION_LENGTH = 4000
const PLAINTEXT_DESCRIPTION_LENGTH = 2000

function domBuilder(html) {
  const { JSDOM } = require('jsdom');
  const jsdom = new JSDOM(html)
  const document = jsdom.window.document;
  const bodyEl = document.body; // implicitly created
  return bodyEl
}


export function htmlToDraftServer(...args) {
  // We have to add this type definition to the global object to allow draft-convert to properly work on the server
  const { JSDOM } = require('jsdom');
  const jsdom = new JSDOM();
  const globalHTMLElement = jsdom.window.HTMLElement;
  (global as any).HTMLElement = globalHTMLElement;
  // And alas, it looks like we have to add this global. This seems quite bad, and I am not fully sure what to do about it.
  (global as any).document = jsdom.window.document
  const result = getHtmlToDraft()(...args)
  // We do however at least remove it right afterwards
  delete (global as any).document
  delete (global as any).HTMLElement
  return result
}

export function dataToDraftJS(data, type) {
  if (data===undefined || data===null) return null;
  const { convertToRaw } = require("draft-js");

  switch (type) {
    case "draftJS": {
      return data
    }
    case "html": {
      const draftJSContentState = htmlToDraftServer(data, {}, domBuilder)
      return convertToRaw(draftJSContentState)  // On the server have to parse in a JS-DOM implementation to make htmlToDraft work
    }
    case "ckEditorMarkup": {
      // CK Editor markup is just html with extra tags, so we just remove them and then handle it as html
      const draftJSContentState = htmlToDraftServer(sanitize(data), {}, domBuilder)
      return convertToRaw(draftJSContentState)  // On the server have to parse in a JS-DOM implementation to make htmlToDraft work
    }
    case "markdown": {
      const html = markdownToHtmlNoLaTeX(data)
      const draftJSContentState = htmlToDraftServer(html, {}, domBuilder) // On the server have to parse in a JS-DOM implementation to make htmlToDraft work
      return convertToRaw(draftJSContentState)
    }
    default: {
      throw new Error(`Unrecognized type: ${type}`);
    }
  }
}

addFieldsDict(Revisions, {
  markdown: {
    type: String,
    resolveAs: {
      type: 'String',
      resolver: ({originalContents: {data, type}}) => dataToMarkdown(data, type)
    }
  },
  draftJS: {
    type: Object,
    resolveAs: {
      type: 'JSON',
      resolver: ({originalContents: {data, type}}) => dataToDraftJS(data, type)
    }
  },
  ckEditorMarkup: {
    type: String,
    resolveAs: {
      type: 'String',
      resolver: ({originalContents: {data, type}, html}) => (type === 'ckEditorMarkup' ? data : html) // For ckEditorMarkup we just fall back to HTML, since it's a superset of html
    }
  },
  htmlHighlight: {
    type: String,
    resolveAs: {
      type: 'String',
      resolver: ({html}) => highlightFromHTML(html)
    }
  },
  plaintextDescription: {
    type: String,
    resolveAs: {
      type: 'String',
      resolver: ({html}) => {
        if (!html) return
        const truncatedHtml = truncate(sanitize(html), PLAINTEXT_HTML_TRUNCATION_LENGTH)
        return htmlToText
          .fromString(truncatedHtml, {ignoreHref: true, ignoreImage: true})
          .substring(0, PLAINTEXT_DESCRIPTION_LENGTH)
      }
    }
  },
  // Plaintext version, except that specially-formatted blocks like blockquotes are filtered out, for use in highly-abridged displays like SingleLineComment.
  plaintextMainText: {
    type: String,
    resolveAs: {
      type: 'String',
      resolver: ({html}) => {
        const mainTextHtml = sanitizeHtml(
          html, {
            allowedTags: _.without(sanitizeAllowedTags, 'blockquote', 'img'),
            nonTextTags: ['blockquote', 'img', 'style']
          }
        )
        const truncatedHtml = truncate(mainTextHtml, PLAINTEXT_HTML_TRUNCATION_LENGTH)
        return htmlToText
          .fromString(truncatedHtml)
          .substring(0, PLAINTEXT_DESCRIPTION_LENGTH)
      }
    }
  },
})
