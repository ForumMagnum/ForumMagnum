import { resolverOnlyField, accessFilterSingle, schemaDefaultValue, foreignKeyField, slugFields } from "@/lib/utils/schemaUtils";
import { textLastUpdatedAtField } from '../helpers/textLastUpdatedAtField';
import { arbitalLinkedPagesField } from '../helpers/arbitalLinkedPagesField';
import { summariesField } from "../helpers/summariesField";
import { formGroups } from "./formGroups";
import { userIsAdminOrMod, userOwns } from "@/lib/vulcan-users/permissions";
import { editableFields } from "@/lib/editor/make_editable";
import { universalFields } from "@/lib/collectionUtils";

const MULTI_DOCUMENT_DELETION_WINDOW = 1000 * 60 * 60 * 24 * 7;

export function userCanDeleteMultiDocument(user: DbUser | UsersCurrent | null, document: DbMultiDocument) {
  if (userIsAdminOrMod(user)) {
    return true;
  }

  const deletableUntil = new Date(document.createdAt).getTime() + MULTI_DOCUMENT_DELETION_WINDOW;
  const withinDeletionWindow = deletableUntil > Date.now();

  return userOwns(user, document) && withinDeletionWindow;
}

const schema: SchemaType<"MultiDocuments"> = {
  ...universalFields({
    legacyDataOptions: {
      canRead: ['guests'],
    }
  }),

  ...editableFields("MultiDocuments", {
    fieldName: "contents",
    order: 30,
    commentStyles: true,
    normalized: true,
    revisionsHaveCommitMessages: true,
    pingbacks: true,
    permissions: {
      canRead: ['guests'],
      canUpdate: ['members'],
      canCreate: ['members']
    },
    getLocalStorageId: (multiDocument: DbMultiDocument, name: string) => {
      const { _id, parentDocumentId, collectionName } = multiDocument;
      return { id: `multiDocument:${collectionName}:${parentDocumentId}:${_id}`, verify: false };
    },
  }),

  ...slugFields("MultiDocuments", {
    collectionsToAvoidCollisionsWith: ["Tags", "MultiDocuments"],
    getTitle: (md) => md.title ?? md.tabTitle,
    onCollision: "rejectNewDocument",
    includesOldSlugs: true,
  }),
  // In the case of tag lenses, this is the title displayed in the body of the tag page when the lens is selected.
  // In the case of summaries, we don't have a title that needs to be in the "body"; we just use the tab title in the summary tab.
  title: {
    type: String,
    canRead: ['guests'],
    canUpdate: ['members'],
    canCreate: ['members'],
    hidden: ({ formProps, document }) => !formProps?.lensForm && document?.fieldName !== 'description',
    optional: true,
    nullable: true,
    order: 5,
  },
  preview: {
    type: String,
    canRead: ['guests'],
    optional: true,
    nullable: true,
  },
  tabTitle: {
    type: String,
    canRead: ['guests'],
    canUpdate: ['members'],
    canCreate: ['members'],
    nullable: false,
    order: 10,
  },
  tabSubtitle: {
    type: String,
    canRead: ['guests'],
    canUpdate: ['members'],
    canCreate: ['members'],
    hidden: ({ formProps, document }) => !formProps?.lensForm && document?.fieldName !== 'description',
    optional: true,
    nullable: true,
    order: 20,
  },
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: true,
    }),
    canRead: ['guests'],
    canCreate: ['members'],
    hidden: true,
    nullable: false,
    optional: true,
    onCreate: ({currentUser}) => currentUser!._id,
  },
  parentDocumentId: {
    type: String,
    canRead: ['guests'],
    canCreate: ['members'],
    hidden: true,
    nullable: false,
  },
  parentTag: resolverOnlyField({
    type: Object,
    graphQLtype: 'Tag',
    canRead: ['guests'],
    resolver: async (multiDocument, _, context) => {
      const { loaders, currentUser, Tags } = context;
      if (multiDocument.collectionName !== 'Tags') {
        return null;
      }

      const parentTag = await loaders.Tags.load(multiDocument.parentDocumentId);
      return accessFilterSingle(currentUser, Tags, parentTag, context);
    },
    sqlResolver: ({ field, join }) => join({
      table: 'Tags',
      type: 'left',
      on: { _id: field('parentDocumentId') },
      resolver: (tagField) => tagField('*'),
    }),
  }),
  parentLens: resolverOnlyField({
    type: Object,
    graphQLtype: 'MultiDocument',
    canRead: ['guests'],
    resolver: async (multiDocument, _, context) => {
      const { loaders, currentUser, MultiDocuments } = context;
      if (multiDocument.collectionName !== 'MultiDocuments') {
        return null;
      }

      const parentMultiDocuments = await loaders.MultiDocuments.load(multiDocument.parentDocumentId);
      return accessFilterSingle(currentUser, MultiDocuments, parentMultiDocuments, context);
    },
    sqlResolver: ({ field, join }) => join({
      table: 'MultiDocuments',
      type: 'left',
      on: { _id: field('parentDocumentId') },
      resolver: (multiDocField) => multiDocField('*'),
    }),
  }),
  collectionName: {
    type: String,
    canRead: ['guests'],
    canCreate: ['members'],
    allowedValues: ['Tags', 'MultiDocuments'],
    hidden: true,
    nullable: false,
  },
  // e.g. content, description, summary.  Whatever it is that we have "multiple" of for a single parent document.
  fieldName: {
    type: String,
    canRead: ['guests'],
    canCreate: ['members'],
    allowedValues: ['description', 'summary'],
    hidden: true,
    nullable: false,
  },
  index: {
    type: Number,
    canRead: ['guests'],
    canUpdate: ['members'],
    nullable: false,
    optional: true,
    hidden: true,
    onCreate: async ({ newDocument, context }) => {
      const { MultiDocuments } = context;
      const { parentDocumentId } = newDocument;
      
      const otherSummaries = await MultiDocuments.find({
        parentDocumentId,
        fieldName: newDocument.fieldName
      }, undefined, { index: 1 }).fetch();
      const otherSummaryIndexes = otherSummaries.map(summary => summary.index);
      const newIndex = (otherSummaryIndexes.length>0)
        ? (Math.max(...otherSummaryIndexes) + 1)
        : 0;
      return newIndex;
    }
  },

  tableOfContents: {
    // Implemented in multiDocumentResolvers.ts
    type: Object,
    canRead: ['guests'],
    optional: true,
  },

  contributors: {
    canRead: ['guests'],
    // is in essence the same type for tag main pages and lenses
    type: "TagContributorsList",
    optional: true,
  },
  
  // Denormalized copy of contribution-stats, for the latest revision.
  contributionStats: {
    type: Object,
    optional: true,
    blackbox: true,
    hidden: true,
    canRead: ['guests'],
    denormalized: true,
  },

  arbitalLinkedPages: arbitalLinkedPagesField({ collectionName: 'MultiDocuments' }),

  htmlWithContributorAnnotations: {
    type: String,
    canRead: ['guests'],
    optional: true,
    hidden: true,
    denormalized: true,
  },

  ...summariesField('MultiDocuments', { group: formGroups.summaries }),

  ...textLastUpdatedAtField('MultiDocuments'),
  
  deleted: {
    type: Boolean,
    canRead: ['guests'],
    canUpdate: [userCanDeleteMultiDocument, 'sunshineRegiment', 'admins'],
    optional: true,
    logChanges: true,
    ...schemaDefaultValue(false),
  },
};

export default schema;
