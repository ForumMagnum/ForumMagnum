import Revisions, { PLAINTEXT_DESCRIPTION_LENGTH, PLAINTEXT_HTML_TRUNCATION_LENGTH } from '../../lib/collections/revisions/collection'
import { dataToMarkdown, dataToHTML, dataToCkEditor } from '../editor/conversionUtils'
import { highlightFromHTML, truncate } from '../../lib/editor/ellipsize';
import { htmlStartingAtHash } from '../extractHighlights';
import { augmentFieldsDict } from '../../lib/utils/schemaUtils'
import { defineMutation, defineQuery } from '../utils/serverGraphqlUtil';
import { compile as compileHtmlToText } from 'html-to-text'
import sanitizeHtml, {IFrame} from 'sanitize-html';
import { extractTableOfContents } from '../tableOfContents';
import * as _ from 'underscore';
import { dataToDraftJS } from './toDraft';
import { sanitize, sanitizeAllowedTags } from '../../lib/vulcan-lib/utils';
import { htmlToTextDefault } from '../../lib/htmlToText';
import { tagMinimumKarmaPermissions, tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';
import { getLatestRev } from '../editor/make_editable_callbacks';
import isEqual from 'lodash/isEqual';
import { updateMutator } from '../vulcan-lib/mutators';

// Use html-to-text's compile() wrapper (baking in options) to make it faster when called repeatedly
const htmlToTextPlaintextDescription = compileHtmlToText({
  wordwrap: false,
  selectors: [
    { selector: "img", format: "skip" },
    { selector: "a", options: { ignoreHref: true } },
    { selector: "p", options: { leadingLineBreaks: 1 } },
    { selector: "h1", options: { trailingLineBreaks: 1, uppercase: false } },
    { selector: "h2", options: { trailingLineBreaks: 1, uppercase: false } },
    { selector: "h3", options: { trailingLineBreaks: 1, uppercase: false } },
  ]
});

augmentFieldsDict(Revisions, {
  markdown: {
    type: String,
    resolveAs: {
      type: 'String',
      dependsOn: ['originalContents'],
      resolver: ({originalContents}) => originalContents
        ? dataToMarkdown(originalContents.data, originalContents.type)
        : null,
    }
  },
  draftJS: {
    type: Object,
    resolveAs: {
      type: 'JSON',
      dependsOn: ['originalContents'],
      resolver: ({originalContents}) => originalContents
        ? dataToDraftJS(originalContents.data, originalContents.type)
        : null,
    }
  },
  ckEditorMarkup: {
    type: String,
    resolveAs: {
      type: 'String',
      dependsOn: ['originalContents'] as const,
      resolver: ({originalContents, html}) => originalContents
        // For ckEditorMarkup we just fall back to HTML, since it's a superset of html
        ? (originalContents.type === 'ckEditorMarkup' ? originalContents.data : html)
        : null,
    }
  },
  htmlHighlight: {
    type: String,
    resolveAs: {
      type: 'String',
      dependsOn: ['originalContents'],
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
        return htmlToTextPlaintextDescription(truncatedHtml).substring(0, PLAINTEXT_DESCRIPTION_LENGTH);
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
        return htmlToTextDefault(truncatedHtml)
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

defineMutation({
  name: "revertTagToRevision",
  resultType: "Tag",
  argTypes: "(tagId: String!, revertToRevisionId: String!)",
  fn: async (root: void, { tagId, revertToRevisionId }: { tagId: string, revertToRevisionId: string }, context: ResolverContext) => {
    const { currentUser, loaders, Tags } = context;
    if (!tagUserHasSufficientKarma(currentUser, 'edit')) {
      throw new Error(`Must be logged in and have ${tagMinimumKarmaPermissions['edit']} karma to revert tags to older revisions`);
    }

    const [tag, revertToRevision, latestRevision] = await Promise.all([
      loaders.Tags.load(tagId),
      loaders.Revisions.load(revertToRevisionId),
      getLatestRev(tagId, 'description')
    ]);

    const anyDiff = !isEqual(tag.description.originalContents, revertToRevision.originalContents);

    if (!tag)               throw new Error('Invalid tagId');
    if (!revertToRevision)  throw new Error('Invalid revisionId');
    // I don't think this should be possible if we find a revision to revert to, but...
    if (!latestRevision)    throw new Error('Tag is missing latest revision');
    if (!anyDiff)           throw new Error(`Can't find difference between revisions`);

    await updateMutator({
      collection: Tags,
      context,
      documentId: tag._id,
      data: {
        description: {
          originalContents: revertToRevision.originalContents,
        },
      },
      currentUser,
    });
  }
});
