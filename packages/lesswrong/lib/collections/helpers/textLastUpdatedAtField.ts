import { resolverOnlyField } from "@/lib/utils/schemaUtils";

export function textLastUpdatedAtField<T extends CollectionNameString>(
  collectionName: T,
  fieldOptions: CollectionFieldSpecification<T> = {}
): { textLastUpdatedAt: CollectionFieldSpecification<T> } {
  return {
    textLastUpdatedAt: resolverOnlyField({
      ...fieldOptions,
      type: Date,
      canRead: ['guests'],
      /**
       * Resolver that returns the latest `editedAt` from the Revisions collection for
       * this document, where the `changeMetrics` is non-zero.
       */
      resolver: async (doc: ObjectsByCollectionName[T], args: void, context: ResolverContext) => {
        const { Revisions } = context;


        // Find all revisions for this doc, sorted newest first
        const relevantRevisions = await Revisions.find(
          { documentId: doc._id, collectionName },
          { sort: { editedAt: -1 } }
        ).fetch();

        // Find the first revision that has non-zero changes
        const changedRevision = relevantRevisions.find((rev) => {
          const cm = rev.changeMetrics || {};
          return (cm.added ?? 0) + (cm.removed ?? 0) > 1;
        });

        // if there is no revision with non-zero change metrics, return the last revision
        const lastRevision = relevantRevisions[0];

        console.log("in textLastUpdatedAtField resolver", {
          relevantRevisionsLength: relevantRevisions.length,
          relevantRevisionsChangeMetrics: relevantRevisions.map(rev => ({cm: rev.changeMetrics, editedAt: rev.editedAt})),
          changedRevisionChangeMetrics: changedRevision?.changeMetrics,
          changedRevisionEditedAt: changedRevision?.editedAt,
          returnValue: changedRevision?.editedAt ?? null,
        });

        return changedRevision?.editedAt ?? lastRevision?.editedAt ?? null;
      },
    //   sqlResolver: ({ field }) => `
    //     (
    //       SELECT "editedAt"
    //       FROM "Revisions"
    //       WHERE "documentId" = ${field("_id")}
    //         AND "collectionName" = '${collectionName}'
    //         AND (
    //           (
    //             COALESCE(("changeMetrics"->>'added')::int, 0)
    //             + COALESCE(("changeMetrics"->>'removed')::int, 0)
    //           ) != 0
    //         )
    //       ORDER BY "editedAt" DESC
    //       LIMIT 1
    //     )
    //   `,
    }),
  };
}
