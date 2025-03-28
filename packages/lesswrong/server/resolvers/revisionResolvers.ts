import Revisions from '@/server/collections/revisions/collection';
import { PLAINTEXT_DESCRIPTION_LENGTH, PLAINTEXT_HTML_TRUNCATION_LENGTH } from '../../lib/collections/revisions/revisionConstants';
import { dataToMarkdown, dataToHTML, dataToCkEditor } from '../editor/conversionUtils'
import { highlightFromHTML, truncate } from '../../lib/editor/ellipsize';
import { htmlStartingAtHash } from '../extractHighlights';
import { defineMutation, defineQuery } from '../utils/serverGraphqlUtil';
import { compile as compileHtmlToText } from 'html-to-text'
import sanitizeHtml, {IFrame} from 'sanitize-html';
import * as _ from 'underscore';
import { dataToDraftJS } from './toDraft';
import { sanitize, sanitizeAllowedTags } from '../../lib/vulcan-lib/utils';
import { htmlToTextDefault } from '../../lib/htmlToText';
import { tagMinimumKarmaPermissions, tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';
import { afterCreateRevisionCallback, buildRevision } from '../editor/make_editable_callbacks';
import isEqual from 'lodash/isEqual';
import { createMutator, updateMutator } from '../vulcan-lib/mutators';
import { EditorContents } from '../../components/editor/Editor';
import { userOwns } from '../../lib/vulcan-users/permissions';
import { getLatestRev, getNextVersion, htmlToChangeMetrics } from '../editor/utils';
import { parseDocumentFromString } from '../../lib/domParser';
import { extractTableOfContents } from '../../lib/tableOfContents';
import { htmlContainsFootnotes } from '../utils/htmlUtil';

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

export const revisionResolvers = {
  markdown: {
    type: String,
    resolveAs: {
      type: 'String',
      resolver: ({originalContents}): string | null => originalContents
        ? dataToMarkdown(originalContents.data, originalContents.type)
        : null,
    },
    nullable: true,
  },
  draftJS: {
    type: Object,
    resolveAs: {
      type: 'JSON',
      resolver: ({originalContents}) => originalContents
        ? dataToDraftJS(originalContents.data, originalContents.type)
        : null,
    }
  },
  ckEditorMarkup: {
    type: String,
    resolveAs: {
      type: 'String',
      resolver: ({originalContents, html}) => originalContents
        // For ckEditorMarkup we just fall back to HTML, since it's a superset of html
        ? (originalContents.type === 'ckEditorMarkup' ? originalContents.data : html)
        : null,
    }
  },
  htmlHighlight: {
    type: String,
    resolveAs: {
      type: 'String!',
      resolver: ({html}): string => highlightFromHTML(html)
    }
  },
  htmlHighlightStartingAtHash: {
    type: String,
    resolveAs: {
      type: 'String!',
      arguments: 'hash: String',
      resolver: async (revision: DbRevision, args: {hash: string}, context: ResolverContext): Promise<string> => {
        const {hash} = args;
        const rawHtml = revision?.html;

        if (!rawHtml) return '';
        
        // Process the HTML through the table of contents generator (which has
        // the byproduct of marking section headers with anchors)
        const toc = extractTableOfContents(parseDocumentFromString(rawHtml));
        const html = toc?.html || rawHtml;
        
        if (!html) return '';
        
        const startingFromHash = htmlStartingAtHash(html, hash);
        const highlight = highlightFromHTML(startingFromHash);
        return highlight;
      },
    }
  },
  plaintextDescription: {
    type: String,
    resolveAs: {
      type: 'String!',
      resolver: ({html}): string => {
        if (!html) return ""
        const truncatedHtml = truncate(html, PLAINTEXT_HTML_TRUNCATION_LENGTH)
        return htmlToTextPlaintextDescription(truncatedHtml).substring(0, PLAINTEXT_DESCRIPTION_LENGTH);
      }
    }
  },
  // Plaintext version, except that specially-formatted blocks like blockquotes are filtered out, for use in highly-abridged displays like SingleLineComment.
  plaintextMainText: {
    type: String,
    resolveAs: {
      type: 'String!',
      resolver: ({html}): string => {
        if (!html) return ""

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
  
  hasFootnotes: {
    type: Boolean,
    resolveAs: {
      type: 'Boolean',
      resolver: ({html}): boolean => {
        if (!html) return false;
        return htmlContainsFootnotes(html);
      },
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"Revisions">>;

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

defineQuery({
  name: "latestGoogleDocMetadata",
  resultType: "JSON",
  argTypes: "(postId: String!, version: String)",
  fn: async (root: void, { postId, version }: { postId: string; version?: string }, context: ResolverContext) => {
    const query = {
      documentId: postId,
      googleDocMetadata: { $exists: true },
      ...(version && { version: { $lte: version } }),
    };
    const latestRevisionWithMetadata = await Revisions.findOne(
      query,
      { sort: { editedAt: -1 } },
      { googleDocMetadata: 1 }
    );
    return latestRevisionWithMetadata ? latestRevisionWithMetadata.googleDocMetadata : null;
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

    const anyDiff = !isEqual(tag.description?.originalContents, revertToRevision.originalContents);

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

defineMutation({
  name: "autosaveRevision",
  resultType: "Revision",
  schema: `
    input AutosaveContentType {
      type: String
      value: ContentTypeData
    }
  `,
  argTypes: "(postId: String!, contents: AutosaveContentType!)",
  fn: async (_, { postId, contents }: { postId: string, contents: EditorContents }, context): Promise<DbRevision> => {
    const { currentUser, loaders } = context;
    if (!currentUser) {
      throw new Error('Cannot autosave revision while logged out');
    }

    const post = await loaders.Posts.load(postId);
    if (!userOwns(currentUser, post)) {
      throw new Error('Must be post author to autosave');
    }

    const postContentsFieldName = 'contents';
    const updateSemverType = 'patch';

    const [previousRev, html] = await Promise.all([
      getLatestRev(postId, postContentsFieldName),
      dataToHTML(contents.value, contents.type, { sanitize: !currentUser.isAdmin })
    ]);

    // This behavior differs from make_editable's `updateBefore` callback, but in the case of manual user saves it seems fine to create new revisions; they don't happen that often
    // In principle we shouldn't be getting autosave requests from the client when there's no diff, but seems better to avoid creating spurious revisions for autosaves
    // (especially if there's a bug on the client which causes the client-side diff-checking to fail)
    if (previousRev && isEqual(previousRev.originalContents, contents)) {
      return previousRev;
    }

    const nextVersion = getNextVersion(previousRev, updateSemverType, post.draft);
    const changeMetrics = htmlToChangeMetrics(previousRev?.html || "", html);

    const newRevision: Partial<DbRevision> = {
      ...await buildRevision({
        originalContents: { type: contents.type, data: contents.value },
        currentUser,
      }),
      documentId: postId,
      fieldName: postContentsFieldName,
      collectionName: 'Posts',
      version: nextVersion,
      draft: true,
      updateType: updateSemverType,
      changeMetrics,
      commitMessage: 'Native editor autosave',
    };

    const { data: createdRevision } = await createMutator({
      collection: Revisions,
      document: newRevision,
      context,
      currentUser,
      validate: false
    });

    // TODO: not sure if we need these?  The aren't called by `saveDocumentRevision` in `ckEditorWebhook.ts` after creating a new revision from ckeditor's cloud autosave
    await afterCreateRevisionCallback.runCallbacksAsync([{ revisionID: createdRevision._id }]);

    return createdRevision;
  }
});
