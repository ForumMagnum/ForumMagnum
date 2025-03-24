// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { accessFilterSingle, generateIdResolverSingle, getDenormalizedCountOfReferencesGetValue } from "../../utils/schemaUtils";
import SimpleSchema from "simpl-schema";
import { addGraphQLSchema } from "../../vulcan-lib/graphql";
import { userCanReadField, userIsAdminOrMod, userIsPodcaster, userOwns } from "../../vulcan-users/permissions";
import { SharableDocument, userIsSharedOn } from "../users/helpers";
import { currentUserExtendedVoteResolver, currentUserVoteResolver, getAllVotes, getCurrentUserVotes } from "@/lib/make_voteable";
import { parseDocumentFromString } from "@/lib/domParser";
import { highlightFromHTML, truncate } from "@/lib/editor/ellipsize";
import { htmlToTextDefault } from "@/lib/htmlToText";
import { extractTableOfContents } from "@/lib/tableOfContents";
import { sanitizeAllowedTags } from "@/lib/vulcan-lib/utils";
import { dataToMarkdown } from "@/server/editor/conversionUtils";
import { htmlStartingAtHash } from "@/server/extractHighlights";
import { dataToDraftJS } from "@/server/resolvers/toDraft";
import { htmlContainsFootnotes } from "@/server/utils/htmlUtil";
import _ from "underscore";
import { PLAINTEXT_HTML_TRUNCATION_LENGTH, PLAINTEXT_DESCRIPTION_LENGTH } from "./revisionConstants";
import sanitizeHtml from "sanitize-html";
import { compile as compileHtmlToText } from "html-to-text";
import GraphQLJSON from "graphql-type-json";

// I _think_ this is a server-side only library, but it doesn't seem to be causing problems living at the top level (yet)
// TODO: consider moving it to a server-side helper file with a stub, if so
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

/**
 * This covers the type of originalContents for all editor types.
 * (DraftJS uses object type. DraftJs is deprecated but there are still many documents that use it)
 */
export const ContentType = new SimpleSchema({
  type: String,
  data: SimpleSchema.oneOf(String, {
    type: Object,
    blackbox: true,
  }),
});

// Graphql doesn't allow union types that include scalars, which is necessary
// to accurately represent the data field the ContentType simple schema.

// defining a custom scalar seems to allow it to pass through any data type,
// but this doesn't seem much more permissive than ContentType was originally
addGraphQLSchema(`
  scalar ContentTypeData
`);

addGraphQLSchema(`
  type ContentType {
    type: String
    data: ContentTypeData
  }
`);

const isSharable = (document: any): document is SharableDocument => {
  return "coauthorStatuses" in document || "shareWithUsers" in document || "sharingSettings" in document;
};

export const getOriginalContents = <N extends CollectionNameString>(
  currentUser: DbUser | null,
  document: ObjectsByCollectionName[N],
  originalContents: EditableFieldContents["originalContents"]
) => {
  const canViewOriginalContents = (user: DbUser | null, doc: DbObject) =>
    isSharable(doc) ? userIsSharedOn(user, doc) : true;

  const returnOriginalContents = userCanReadField(
    currentUser,
    // We need `userIsPodcaster` here to make it possible for podcasters to open post edit forms to add/update podcast episode info
    // Without it, `originalContents` may resolve to undefined, which causes issues in revisionResolvers
    [userOwns, canViewOriginalContents, userIsPodcaster, "admins", "sunshineRegiment"],
    document
  );

  return returnOriginalContents ? originalContents : null;
};

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: {
    ...DEFAULT_LEGACY_DATA_FIELD,
    graphql: {
      ...DEFAULT_LEGACY_DATA_FIELD.graphql,
      canRead: ["guests"],
    },
  },
  documentId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
    },
  },
  collectionName: {
    database: {
      type: "TEXT",
      typescriptType: "CollectionNameString",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  fieldName: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
    },
  },
  editedAt: {
    database: {
      type: "TIMESTAMPTZ",
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  // autosaveTimeoutStart: If this revision was created by rate-limited
  // autosaving, this is the timestamp that the rate limit is computed relative
  // to. This is separate from editedAt, which is when this revision was last
  // rewritten. This is so that if the revision is repeatedly updated in place,
  // chaining together edits can't produce an interval longer than the
  // intended one.
  //
  // Optional, only present on revisions that have been autosaved in-place at
  // least once.
  //
  // See also: saveOrUpdateDocumentRevision in ckEditorWebhook.ts
  autosaveTimeoutStart: {
    database: {
      type: "TIMESTAMPTZ",
    },
  },
  updateType: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canCreate: ["members"],
      validation: {
        allowedValues: ["initial", "patch", "minor", "major"],
        optional: true,
      },
    },
  },
  version: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  commitMessage: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  user: {
    graphql: {
      outputType: "User",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "userId" }),
    },
  },
  // Whether this revision is a draft (ie unpublished). This is here so that
  // after a post is published, we have a sensible way for users to save edits
  // that they don't want to publish just yet. Note that this is redundant with
  // posts' draft field, and does *not* have to be in sync; the latest revision
  // can be a draft even though the document is published (ie, there's a saved
  // but unpublished edit), and the latest revision can be not-a-draft even
  // though the document itself is marked as a draft (eg, if the post was moved
  // back to drafts after it was published).
  //
  // This field will not normally be edited after insertion.
  //
  // The draftiness of a revision used to be implicit in the version number,
  // with 0.x meaning draft and 1.x meaning non-draft, except for tags/wiki
  // where 0.x means imported from the old wiki instead.
  draft: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  originalContents: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      outputType: "ContentType",
      canRead: ["guests"],
      validation: {
        simpleSchema: ContentType,
      },
      resolver: async (document, args, context) => {
        // Original contents sometimes contains private data (ckEditor suggestions
        // via Track Changes plugin). In those cases the html field strips out the
        // suggestion. Original contents is only visible to people who are invited
        // to collaborative editing. (This is only relevant for posts, but supporting
        // it means we need originalContents to default to unviewable)
        if (document.collectionName === "Posts" && document.documentId) {
          const post = await context.loaders["Posts"].load(document.documentId);
          return getOriginalContents(context.currentUser, post, document.originalContents);
        }
        return document.originalContents;
      },
    },
  },
  html: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  markdown: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: ({ originalContents }) =>
        originalContents ? dataToMarkdown(originalContents.data, originalContents.type) : null,
    },
  },
  draftJS: {
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
      resolver: ({ originalContents }) =>
        originalContents ? dataToDraftJS(originalContents.data, originalContents.type) : null,
    },
  },
  ckEditorMarkup: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: ({ originalContents, html }) =>
        originalContents ? (originalContents.type === "ckEditorMarkup" ? originalContents.data : html) : null,
    },
  },
  wordCount: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  htmlHighlight: {
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
      resolver: ({ html }) => highlightFromHTML(html),
    },
  },
  htmlHighlightStartingAtHash: {
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
      arguments: "hash: String",
      resolver: async (revision, args, context) => {
        const { hash } = args;
        const rawHtml = revision?.html;
        if (!rawHtml) return "";
        // Process the HTML through the table of contents generator (which has
        // the byproduct of marking section headers with anchors)
        const toc = extractTableOfContents(parseDocumentFromString(rawHtml));
        const html = toc?.html || rawHtml;
        if (!html) return "";
        const startingFromHash = htmlStartingAtHash(html, hash);
        const highlight = highlightFromHTML(startingFromHash);
        return highlight;
      },
    },
  },
  plaintextDescription: {
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
      resolver: ({ html }) => {
        if (!html) return "";
        const truncatedHtml = truncate(html, PLAINTEXT_HTML_TRUNCATION_LENGTH);
        return htmlToTextPlaintextDescription(truncatedHtml).substring(0, PLAINTEXT_DESCRIPTION_LENGTH);
      },
    },
  },
  plaintextMainText: {
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
      resolver: ({ html }) => {
        if (!html) return "";
        const mainTextHtml = sanitizeHtml(html, {
          allowedTags: _.without(sanitizeAllowedTags, "blockquote", "img"),
          nonTextTags: ["blockquote", "img", "style"],
          exclusiveFilter: function (element) {
            return (
              element.attribs?.class === "spoilers" ||
              element.attribs?.class === "spoiler" ||
              element.attribs?.class === "spoiler-v2"
            );
          },
        });
        const truncatedHtml = truncate(mainTextHtml, PLAINTEXT_HTML_TRUNCATION_LENGTH);
        return htmlToTextDefault(truncatedHtml).substring(0, PLAINTEXT_DESCRIPTION_LENGTH);
      },
    },
  },
  hasFootnotes: {
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      resolver: ({ html }) => {
        if (!html) return false;
        return htmlContainsFootnotes(html);
      },
    },
  },
  changeMetrics: {
    database: {
      type: "JSONB",
      nullable: false,
    },
    graphql: {
      outputType: "JSON",
      inputType: "JSON!",
      canRead: ["guests"],
      validation: {
        blackbox: true,
      },
    },
  },
  /**
   * For revisions imported from a google doc, this contains some metadata about the doc,
   * see `GoogleDocMetadata` in packages/lesswrong/server/resolvers/postResolvers.ts for the
   * fields that are included.
   */
  googleDocMetadata: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
      validation: {
        optional: true,
        blackbox: true,
      },
    },
  },
  /**
   * If set, this revision will be skipped over when attributing text to
   * contributors on wiki pages. Useful when reverting - if a bad edit and a
   * reversion are marked with this flag, then attributions will be as-if the
   * reverted edited never happened.
   */
  skipAttributions: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
  },
  tag: {
    graphql: {
      outputType: "Tag",
      canRead: ["guests"],
      resolver: async (revision, args, context) => {
        const { currentUser, Tags } = context;
        if (revision.collectionName !== "Tags") return null;
        if (!revision.documentId) return null;
        const tag = await context.loaders.Tags.load(revision.documentId);
        return await accessFilterSingle(currentUser, "Tags", tag, context);
      },
    },
  },
  post: {
    graphql: {
      outputType: "Post",
      canRead: ["guests"],
      resolver: async (revision, args, context) => {
        const { currentUser, Posts } = context;
        if (revision.collectionName !== "Posts") return null;
        if (!revision.documentId) return null;
        const post = await context.loaders.Posts.load(revision.documentId);
        return await accessFilterSingle(currentUser, "Posts", post, context);
      },
    },
  },
  lens: {
    graphql: {
      outputType: "MultiDocument",
      canRead: ["guests"],
      resolver: async (revision, args, context) => {
        const { currentUser } = context;
        if (revision.collectionName !== "MultiDocuments") {
          return null;
        }
        if (!revision.documentId) {
          return null;
        }
        const lens = await context.loaders.MultiDocuments.load(revision.documentId);
        if (lens.fieldName !== "description" || lens.collectionName !== "Tags") {
          return null;
        }
        return await accessFilterSingle(currentUser, "MultiDocuments", lens, context);
      },
      sqlResolver: ({ field, join }) =>
        join({
          table: "MultiDocuments",
          on: {
            _id: field("documentId"),
            collectionName: "'Tags'",
            fieldName: "'description'",
          },
          type: "left",
          resolver: (multiDocumentField) => multiDocumentField("*"),
        }),
    },
  },
  summary: {
    graphql: {
      outputType: "MultiDocument",
      canRead: ["guests"],
      resolver: async (revision, args, context) => {
        const { currentUser, MultiDocuments } = context;
        if (revision.collectionName !== "MultiDocuments") {
          return null;
        }
        if (!revision.documentId) {
          return null;
        }
        const lens = await context.loaders.MultiDocuments.load(revision.documentId);
        if (lens.fieldName !== "summary") {
          return null;
        }
        return await accessFilterSingle(currentUser, "MultiDocuments", lens, context);
      },
    },
  },
  currentUserVote: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: async (document, args, context) => {
        const votes = await getCurrentUserVotes(document, context);
        if (!votes.length) return null;
        return votes[0].voteType ?? null;
      },
      sqlResolver: currentUserVoteResolver,
    },
  },
  currentUserExtendedVote: {
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
      resolver: async (document, args, context) => {
        const votes = await getCurrentUserVotes(document, context);
        if (!votes.length) return null;
        return votes[0].extendedVoteType || null;
      },
      sqlResolver: currentUserExtendedVoteResolver,
    },
  },
  voteCount: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      denormalized: true,
      canAutoDenormalize: true,
      canAutofillDefault: true,
      getValue: getDenormalizedCountOfReferencesGetValue({
        collectionName: "Revisions",
        fieldName: "voteCount",
        foreignCollectionName: "Votes",
        foreignFieldName: "documentId",
        filterFn: (vote) => !vote.cancelled && vote.voteType !== "neutral" && vote.collectionName === "Revisions",
      }),
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Votes",
        foreignFieldName: "documentId",
        filterFn: (vote) => !vote.cancelled && vote.voteType !== "neutral" && vote.collectionName === "Revisions",
        resyncElastic: false,
      },
      validation: {
        optional: true,
      },
    },
  },
  baseScore: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  extendedScore: {
    database: {
      type: "JSONB",
    },
    graphql: {
      outputType: GraphQLJSON,
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  score: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  inactive: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
  },
  afBaseScore: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Alignment Base Score",
    },
  },
  afExtendedScore: {
    database: {
      type: "JSONB",
    },
    graphql: {
      outputType: GraphQLJSON,
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  afVoteCount: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"Revisions">>;

export default schema;
