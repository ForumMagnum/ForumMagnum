import { annotateAuthors } from '../attributeEdits';
import { getCollection } from '../vulcan-lib';

export async function updateDenormalizedHtmlAttributions(
  document: any,
  collectionName: CollectionNameString,
  fieldName = 'description'
) {
  const html = await annotateAuthors(document._id, collectionName, fieldName);
  const collection = getCollection(collectionName);
  await collection.rawUpdateOne({ _id: document._id }, { $set: {
    htmlWithContributorAnnotations: html,
  }});
  return html;
}
