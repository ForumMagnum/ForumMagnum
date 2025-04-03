import { annotateAuthors } from '../attributeEdits';

export type UpdateDenormalizedHtmlAttributionsOptions = ({
  document: DbTag;
  collectionName: 'Tags';
  fieldName: 'description';
} | {
  document: DbMultiDocument;
  collectionName: 'MultiDocuments';
  fieldName: 'contents';
}) & {
  context: ResolverContext;
}

export async function updateDenormalizedHtmlAttributions(
  updateOptions: UpdateDenormalizedHtmlAttributionsOptions
) {
  const { document, collectionName, fieldName, context } = updateOptions;
  const html = await annotateAuthors(document._id, collectionName, fieldName, context);
  const collection = context[collectionName];
  await collection.rawUpdateOne({ _id: document._id }, { $set: {
    htmlWithContributorAnnotations: html,
  }});
  return html;
}
