import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { accessFilterSingle, generateIdResolverSingle } from "../../utils/schemaUtils";
import { DEFAULT_AF_BASE_SCORE_FIELD, DEFAULT_AF_EXTENDED_SCORE_FIELD, DEFAULT_AF_VOTE_COUNT_FIELD, DEFAULT_BASE_SCORE_FIELD, DEFAULT_CURRENT_USER_EXTENDED_VOTE_FIELD, DEFAULT_CURRENT_USER_VOTE_FIELD, DEFAULT_EXTENDED_SCORE_FIELD, DEFAULT_INACTIVE_FIELD, DEFAULT_SCORE_FIELD, defaultVoteCountField } from "@/lib/make_voteable";
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
import { PLAINTEXT_HTML_TRUNCATION_LENGTH, PLAINTEXT_DESCRIPTION_LENGTH, ContentType } from "./revisionConstants";
import sanitizeHtml from "sanitize-html";
import { compile as compileHtmlToText } from "html-to-text";
import gql from "graphql-tag";
import { getOriginalContents } from "./helpers";
import { userIsPostGroupOrganizer } from "../posts/helpers";

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

// Graphql doesn't allow union types that include scalars, which is necessary
// to accurately represent the data field the ContentType simple schema.

// defining a custom scalar seems to allow it to pass through any data type,
// but this doesn't seem much more permissive than ContentType was originally
export const graphqlTypeDefs = gql`
  scalar ContentTypeData
  type ContentType {
    type: String
    data: ContentTypeData
  }
`

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
      outputType: "String!",
      inputType: "String",
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
          return getOriginalContents(context.currentUser, post, document.originalContents, context);
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
      outputType: "Float!",
      inputType: "Float",
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
      outputType: "JSON!",
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
      outputType: "Boolean!",
      inputType: "Boolean",
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
  currentUserVote: DEFAULT_CURRENT_USER_VOTE_FIELD,
  currentUserExtendedVote: DEFAULT_CURRENT_USER_EXTENDED_VOTE_FIELD,
  voteCount: defaultVoteCountField('Revisions'),
  baseScore: DEFAULT_BASE_SCORE_FIELD,
  extendedScore: DEFAULT_EXTENDED_SCORE_FIELD,
  score: DEFAULT_SCORE_FIELD,
  afBaseScore: DEFAULT_AF_BASE_SCORE_FIELD,
  afExtendedScore: DEFAULT_AF_EXTENDED_SCORE_FIELD,
  afVoteCount: DEFAULT_AF_VOTE_COUNT_FIELD,
} satisfies Record<string, CollectionFieldSpecification<"Revisions">>;

export default schema;
