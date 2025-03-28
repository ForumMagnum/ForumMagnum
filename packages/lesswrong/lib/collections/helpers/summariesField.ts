import { resolverOnlyField } from "@/lib/utils/schemaUtils";

export function summariesField<T extends CollectionNameString>(collectionName: T, fieldOptions: CollectionFieldSpecification<T> = {}) {
  return {
    summaries: resolverOnlyField({
      ...fieldOptions,
      type: Array,
      graphQLtype: '[MultiDocument!]!',
      canRead: ['guests'],
      control: "SummariesEditForm",
      resolver: async (doc: ObjectsByCollectionName[T], args: void, context: ResolverContext) => {
        const { MultiDocuments, Revisions } = context;
        const multiDocuments = await MultiDocuments.find({ parentDocumentId: doc._id, collectionName, fieldName: 'summary' }, { sort: { index: 1 } }).fetch();
        const revisions = await Revisions.find({ _id: { $in: multiDocuments.map(md => md.contents_latest) } }).fetch();

        return multiDocuments.map(md => ({
          ...md,
          contents: revisions.find(r => r._id === md.contents_latest),
        }));
      },
      sqlResolver: ({ field }) => `(
        SELECT ARRAY_AGG(
          JSONB_SET(
            TO_JSONB(md.*),
            '{contents}'::TEXT[],
            TO_JSONB(r.*),
            true
          )
          ORDER BY md."index" ASC
        ) AS contents
        FROM "MultiDocuments" md
        LEFT JOIN "Revisions" r
        ON r._id = md.contents_latest
        WHERE md."parentDocumentId" = ${field("_id")}
        AND md."collectionName" = '${collectionName}'
        AND md."fieldName" = 'summary'
        LIMIT 1
      )`,
    }),
    'summaries.$': {
      type: Object,
      optional: true,
    },
  }
}
