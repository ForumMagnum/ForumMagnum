import { annotateAuthors } from '../attributeEdits';
import { getCollection } from '../vulcan-lib';

export type UpdateDenormalizedHtmlAttributionsOptions = {
  document: DbTag;
  collectionName: 'Tags';
  fieldName: 'description';
} | {
  document: DbMultiDocument;
  collectionName: 'MultiDocuments';
  fieldName: 'contents';
}

export async function updateDenormalizedHtmlAttributions(
  updateOptions: UpdateDenormalizedHtmlAttributionsOptions
) {
  const { document, collectionName, fieldName } = updateOptions;
  const html = await annotateAuthors(document._id, collectionName, fieldName);
  const collection = getCollection(collectionName);
  await collection.rawUpdateOne({ _id: document._id }, { $set: {
    htmlWithContributorAnnotations: html,
  }});
  return html;
}
