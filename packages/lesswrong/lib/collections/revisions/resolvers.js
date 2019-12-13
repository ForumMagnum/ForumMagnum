import Revisions from './collection'
import { htmlToDraft } from '../../../server/draftConvert';
import { convertToRaw } from 'draft-js';
import { markdownToHtmlNoLaTeX, dataToMarkdown } from '../../../server/editor/make_editable_callbacks'
import { highlightFromHTML, truncate } from '../../editor/ellipsize';
import { addFieldsDict } from '../../modules/utils/schemaUtils'
import { JSDOM } from 'jsdom'
import { Utils } from 'meteor/vulcan:core';
import htmlToText from 'html-to-text'
import sanitizeHtml from 'sanitize-html';
import { revisionCacheComputedField } from '../../../server/revisionsCache.ts';

const PLAINTEXT_HTML_TRUNCATION_LENGTH = 4000
const PLAINTEXT_DESCRIPTION_LENGTH = 2000

function domBuilder(html) {
  const jsdom = new JSDOM(html)
  const document = jsdom.window.document;
  const bodyEl = document.body; // implicitly created
  return bodyEl
}


export function htmlToDraftServer(...args) {
  // We have to add this type definition to the global object to allow draft-convert to properly work on the server
  global.HTMLElement = new JSDOM().window.HTMLElement
  // And alas, it looks like we have to add this global. This seems quite bad, and I am not fully sure what to do about it.
  global.document = new JSDOM().window.document
  const result = htmlToDraft(...args) 
  // We do however at least remove it right afterwards
  delete global.document
  delete global.HTMLElement
  return result
}

export function dataToDraftJS(data, type) {
  if (data===undefined || data===null) return null;
  
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
      const draftJSContentState = htmlToDraftServer(Utils.sanitize(data), {}, domBuilder)
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
      resolver: (revision, args, context) => {
        return revisionCacheComputedField({
          revision,
          fieldName: "markdown",
          loader: context.Revisions.loader,
          computeField: rev => {
            const {originalContents: { data, type }} = rev;
            return dataToMarkdown(data, type);
          }
        });
      }
    }
  },
  draftJS: {
    type: Object,
    resolveAs: {
      type: 'JSON',
      resolver: (revision, args, context) => {
        return revisionCacheComputedField({
          revision,
          fieldName: "draftJS",
          loader: context.Revisions.loader,
          computeField: rev => {
            const { originalContents: { data, type } } = rev;
            return dataToDraftJS(data, type);
          }
        });
      }
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
      resolver: (revision, args, context) => {
        const { html } = revision;
        return highlightFromHTML(html);
      }
    }
  },
  plaintextDescription: {
    type: String,
    resolveAs: {
      type: 'String',
      resolver: (revision, args, context) => {
        return revisionCacheComputedField({
          revision,
          fieldName: "plaintextDescription",
          loader: context.Revisions.loader,
          computeField: rev => {
            const { html } = rev;
            const truncatedHtml = truncate(Utils.sanitize(html), PLAINTEXT_HTML_TRUNCATION_LENGTH)
            return htmlToText
              .fromString(truncatedHtml)
              .substring(0, PLAINTEXT_DESCRIPTION_LENGTH)
          }
        });
      }
    }
  },
  // Plaintext version, except that specially-formatted blocks like blockquotes are filtered out, for use in highly-abridged displays like SingleLineComment.
  plaintextMainText: {
    type: String,
    resolveAs: {
      type: 'String',
      resolver: (revision, args, context) => {
        return revisionCacheComputedField({
          revision,
          fieldName: "plaintextMainText",
          loader: context.Revisions.loader,
          computeField: rev => {
            const { html } = rev
            const mainTextHtml = sanitizeHtml(
              html, {
                allowedTags: _.without(Utils.sanitizeAllowedTags, 'blockquote', 'img'),
                nonTextTags: ['blockquote', 'img', 'style']
              }
            )
            const truncatedHtml = truncate(mainTextHtml, PLAINTEXT_HTML_TRUNCATION_LENGTH)
            return htmlToText
              .fromString(truncatedHtml)
              .substring(0, PLAINTEXT_DESCRIPTION_LENGTH)
          }
        });
      }
    }
  }
})
