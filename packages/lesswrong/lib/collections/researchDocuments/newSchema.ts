import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LATEST_REVISION_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { userOwns } from "@/lib/vulcan-users/permissions";
import { getNormalizedEditableResolver, getNormalizedVersionResolver, getRevisionsResolver } from "@/lib/editor/make_editable";
import { RevisionStorageType } from "../revisions/revisionSchemaTypes";

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: { optional: true },
    },
  },
  projectId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "ResearchProjects",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["members"],
    },
  },
  title: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members"],
      validation: { optional: true },
    },
  },
  // Custom sidebar icon in place of the default document glyph: `svg:<id>`
  // referencing the hand-drawn set in researchIconSet.tsx, or a bare Unicode
  // emoji (legacy values from the retired emoji picker still render).
  icon: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      validation: { optional: true },
    },
  },
  // Manual sidebar ordering; lower sorts first. Null (never reordered) sorts
  // after ordered docs, then by createdAt. Written only by the
  // reorderResearchDocuments mutation (server-side), so not client-updatable.
  sortOrder: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: true,
    },
    graphql: {
      outputType: "Float",
      canRead: [userOwns, "admins"],
      validation: { optional: true },
    },
  },
  // Editable Lexical content backed by the Revisions collection (no
  // denormalized column). The last-persisted snapshot is the latest
  // `Revisions` row with `collectionName: 'ResearchDocuments'`,
  // `documentId: <_id>`, `fieldName: 'contents'`. Live collab state is
  // owned by the Hocuspocus server in YjsDocuments keyed by
  // ('ResearchDocuments', _id) — autosaves into `Revisions` on idle.
  contents: {
    graphql: {
      outputType: "Revision",
      inputType: "CreateRevisionDataInput",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members"],
      editableFieldOptions: { pingbacks: false, normalized: true },
      arguments: "version: String",
      resolver: getNormalizedEditableResolver("contents"),
      validation: {
        simpleSchema: RevisionStorageType,
        optional: true,
      },
    },
  },
  contents_latest: DEFAULT_LATEST_REVISION_ID_FIELD,
  revisions: {
    graphql: {
      outputType: "[Revision!]",
      canRead: [userOwns, "admins"],
      arguments: "limit: Int = 5",
      resolver: getRevisionsResolver("contents"),
    },
  },
  version: {
    graphql: {
      outputType: "String",
      canRead: [userOwns, "admins"],
      resolver: getNormalizedVersionResolver("contents"),
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"ResearchDocuments">>;

export default schema;
