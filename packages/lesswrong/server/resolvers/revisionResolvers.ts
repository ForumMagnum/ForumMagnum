import Revisions from '../../lib/collections/revisions/collection'
import { dataToMarkdown, dataToHTML, dataToCkEditor } from '../editor/conversionUtils'
import { highlightFromHTML, truncate } from '../../lib/editor/ellipsize';
import { htmlStartingAtHash } from '../extractHighlights';
import { augmentFieldsDict } from '../../lib/utils/schemaUtils'
import { sanitize, sanitizeAllowedTags } from '../vulcan-lib/utils';
import { defineQuery } from '../utils/serverGraphqlUtil';
import htmlToText from 'html-to-text'
import sanitizeHtml, {IFrame} from 'sanitize-html';
import { extractTableOfContents } from '../tableOfContents';
import * as _ from 'underscore';
import { dataToDraftJS } from './toDraft';

const PLAINTEXT_HTML_TRUNCATION_LENGTH = 4000
const PLAINTEXT_DESCRIPTION_LENGTH = 2000

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
