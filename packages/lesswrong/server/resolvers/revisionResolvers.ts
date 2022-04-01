import Revisions from '../../lib/collections/revisions/collection'
import { htmlToDraft } from '../draftConvert';
import { convertToRaw } from 'draft-js';
import { markdownToHtmlNoLaTeX, dataToMarkdown, dataToHTML, dataToCkEditor } from '../editor/make_editable_callbacks'
import { highlightFromHTML, truncate } from '../../lib/editor/ellipsize';
import { htmlStartingAtHash } from '../extractHighlights';
import { augmentFieldsDict } from '../../lib/utils/schemaUtils'
import { JSDOM } from 'jsdom'
import { sanitize, sanitizeAllowedTags } from '../vulcan-lib/utils';
import { defineQuery } from '../utils/serverGraphqlUtil';
import htmlToText from 'html-to-text'
import sanitizeHtml, {IFrame} from 'sanitize-html';
import { extractTableOfContents } from '../tableOfContents';
import * as _ from 'underscore';

const PLAINTEXT_HTML_TRUNCATION_LENGTH = 4000
const PLAINTEXT_DESCRIPTION_LENGTH = 2000

function domBuilder(html: string) {
  const jsdom = new JSDOM(html)
  const document = jsdom.window.document;
  const bodyEl = document.body; // implicitly created
  return bodyEl
}


export function htmlToDraftServer(html: string): Draft.RawDraftContentState {
  // We have to add this type definition to the global object to allow draft-convert to properly work on the server
  const jsdom = new JSDOM();
  const globalHTMLElement = jsdom.window.HTMLElement;
  (global as any).HTMLElement = globalHTMLElement;
  // And alas, it looks like we have to add this global. This seems quite bad, and I am not fully sure what to do about it.
  (global as any).document = jsdom.window.document
  
  // On the server have to pass in a JS-DOM implementation to make htmlToDraft work
  //
  // The DefinitelyTyped annotation of htmlToDraft, which comes from convertFromHTML
  // in the draft-convert library, is wrong. This actually takes optional second and
  // third arguments, the second being options, and the third being a DOMBuilder
  // (verified by quick source-dive into draft-convert).
  // @ts-ignore
  const result = htmlToDraft(html, {}, domBuilder)
  
  // We do however at least remove it right afterwards
  delete (global as any).document
  delete (global as any).HTMLElement
  
  // convertToRaw wants a Draft.ContentState, but htmlToDraft produced a
  // Draft.Model.ImmutableData.ContentState. AFAICT this is the DefinitelyTyped
  // people not being careful with the const plague, not a real issue.
  // @ts-ignore
  return convertToRaw(result)
}

export function dataToDraftJS(data: any, type: string) {
  if (data===undefined || data===null) return null;

  switch (type) {
    case "draftJS": {
      return data
    }
    case "html": {
      return htmlToDraftServer(data)
    }
    case "ckEditorMarkup": {
      // CK Editor markup is just html with extra tags, so we just remove them and then handle it as html
      return htmlToDraftServer(sanitize(data))
    }
    case "markdown": {
      const html = markdownToHtmlNoLaTeX(data)
      return htmlToDraftServer(html)
    }
    default: {
      throw new Error(`Unrecognized type: ${type}`);
    }
  }
}

augmentFieldsDict(Revisions, {
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
  htmlHighlightStartingAtHash: {
    type: String,
    resolveAs: {
      type: 'String',
      arguments: 'hash: String',
      resolver: async (revision: DbRevision, args: {hash: string}, context: ResolverContext): Promise<string> => {
        const {hash} = args;
        const rawHtml = revision?.html;
        
        // Process the HTML through the table of contents generator (which has
        // the byproduct of marking section headers with anchors)
        const toc = extractTableOfContents(rawHtml);
        const html = toc?.html || rawHtml;
        
        const startingFromHash = htmlStartingAtHash(html, hash);
        const highlight = highlightFromHTML(startingFromHash);
        return highlight;
      },
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
          .fromString(truncatedHtml, {ignoreHref: true, ignoreImage: true, wordwrap: false })
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
            nonTextTags: ['blockquote', 'img', 'style'],
            
            exclusiveFilter: function(element: IFrame) {
              return (element.attribs?.class === 'spoilers' || element.attribs?.class === 'spoiler' || element.attribs?.class === "spoiler-v2");
            }
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

defineQuery({
  name: "convertDocument",
  resultType: "JSON",
  argTypes: "(document: JSON, targetFormat: String)",
  fn: async (root: void, {document, targetFormat}: {document: any, targetFormat: string}, context: ResolverContext) => {
    switch (targetFormat) {
      case "html":
        return {
          type: "html",
          value: await dataToHTML(document.value, document.type),
        };
        break;
      case "draftJS":
        return {
          type: "draftJS",
          value: dataToDraftJS(document.value, document.type)
        };
      case "ckEditorMarkup":
        return {
          type: "ckEditorMarkup",
          value: await dataToCkEditor(document.value, document.type),
        };
        break;
      case "markdown":
        return {
          type: "markdown",
          value: dataToMarkdown(document.value, document.type),
        };
    }
  },
});
