import { resolverOnlyField } from "@/lib/utils/schemaUtils";

export function getSummariesFieldResolver<N extends CollectionNameString>(collectionName: N) {
  return async function summariesFieldResolver(doc: ObjectsByCollectionName[N], _args: void, context: ResolverContext) {
    const { MultiDocuments, Revisions } = context;
    const multiDocuments = await MultiDocuments.find({ parentDocumentId: doc._id, collectionName, fieldName: 'summary' }, { sort: { index: 1 } }).fetch();
    const revisions = await Revisions.find({ _id: { $in: multiDocuments.map(md => md.contents_latest) } }).fetch();

    return multiDocuments.map(md => ({
      ...md,
      contents: revisions.find(r => r._id === md.contents_latest),
    }));
  }
}

export function getSummariesFieldSqlResolver<N extends CollectionNameString>(collectionName: N) {
  return function summariesFieldSqlResolver({ field }: SqlResolverArgs<N>) {
    return `(
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
    )`;
  }
}

export function summariesField<T extends CollectionNameString>(collectionName: T, fieldOptions: CollectionFieldSpecification<T> = {}) {
  return {
    summaries: resolverOnlyField({
      ...fieldOptions,
      type: Array,
      graphQLtype: '[MultiDocument!]!',
      canRead: ['guests'],
      control: "SummariesEditForm",
      resolver: getSummariesFieldResolver(collectionName),
      sqlResolver: getSummariesFieldSqlResolver(collectionName),
    }),
    'summaries.$': {
      type: Object,
      optional: true,
    },
  }
}
