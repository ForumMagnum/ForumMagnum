import { getUnusedSlugByCollectionName, slugIsUsed } from "@/lib/helpers";
import { resolverOnlyField, accessFilterSingle, schemaDefaultValue } from "@/lib/utils/schemaUtils";
import { getCollection } from "@/lib/vulcan-lib/getCollection";
import { arbitalLinkedPagesField } from '../helpers/arbitalLinkedPagesField';
import { summariesField } from "../helpers/summariesField";
import { formGroups } from "./formGroups";
import { userOwns } from "@/lib/vulcan-users/permissions";
import { userIsAdminOrMod } from "@/lib/vulcan-users";
import { slugify } from "@/lib/vulcan-lib/utils";

const MULTI_DOCUMENT_DELETION_WINDOW = 1000 * 60 * 60 * 24 * 7;

export function userCanDeleteMultiDocument(user: DbUser | UsersCurrent | null, document: DbMultiDocument) {
  if (document.deleted) {
    return false;
  }

  if (userIsAdminOrMod(user)) {
    return true;
  }

  const deletableUntil = new Date(document.createdAt).getTime() + MULTI_DOCUMENT_DELETION_WINDOW;
  const withinDeletionWindow = deletableUntil > Date.now();

  return userOwns(user, document) && withinDeletionWindow;
}

const schema: SchemaType<"MultiDocuments"> = {
  // In the case of tag lenses, this is the title displayed in the body of the tag page when the lens is selected.
  // In the case of summaries, we don't have a title that needs to be in the "body"; we just use the tab title in the summary tab.
  title: {
    type: String,
    canRead: ['guests'],
    canUpdate: ['members'],
    canCreate: ['members'],
    hidden: ({ formProps }) => !formProps?.newLensForm,
    optional: true,
    nullable: true,
    order: 5,
  },
  slug: {
    type: String,
    optional: true,
    nullable: false,
    canRead: ['guests'],
    onCreate: async ({ newDocument }) => {
      const basicSlug = slugify(newDocument.title ?? newDocument.tabTitle);
      return await getUnusedSlugByCollectionName('MultiDocuments', basicSlug, true);
    },
    onUpdate: async ({data, oldDocument, context}) => {
      if (data.slug && data.slug !== oldDocument.slug) {
        let parentCollectionName = oldDocument.collectionName;
        // In the case of summaries for lenses, we need to recurse once to get the collection name of the parent document.
        if (parentCollectionName === "MultiDocuments") {
          const parentDocument = await context.loaders.MultiDocuments.load(oldDocument.parentDocumentId);
          parentCollectionName = parentDocument.collectionName;
        }

        // We need to check that the parent collection is a collection that has slugs.
        const parentCollection = getCollection(parentCollectionName);

        const checkParentCollectionForSlugPromise = parentCollection.hasSlug()
          ? slugIsUsed(parentCollectionName as CollectionNameWithSlug, data.slug)
          : Promise.resolve(false);

        const [usedByMultiDocument, usedByTag] = await Promise.all([
          checkParentCollectionForSlugPromise,
          slugIsUsed("Tags", data.slug),
        ])

        if (usedByMultiDocument || usedByTag) {
          throw Error(`Specified slug is already used: ${data.slug}`)
        }
      }
    }
  },
  oldSlugs: {
    type: Array,
    optional: true,
    canRead: ['guests'],
    ...schemaDefaultValue([]),
    // override onUpdate from schemaDefaultValue to preserve oldSlugs
    onUpdate: ({data, oldDocument}) => {
      if (data.slug && data.slug !== oldDocument.slug)  {
        return [...oldDocument.oldSlugs, oldDocument.slug]
      } 
    },
  },
  'oldSlugs.$': {
    type: String,
    optional: true,
    canRead: ['guests'],
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
    hidden: ({ formProps }) => !formProps?.newLensForm,
    optional: true,
    nullable: true,
    order: 20,
  },
  userId: {
    type: String,
    canRead: ['guests'],
    canCreate: ['members'],
    hidden: true,
    nullable: false,
    optional: true,
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

  deleted: {
    type: Boolean,
    canRead: ['guests'],
    canUpdate: [userCanDeleteMultiDocument, 'sunshineRegiment', 'admins'],
    optional: true,
    ...schemaDefaultValue(false),
  },
};

export default schema;
