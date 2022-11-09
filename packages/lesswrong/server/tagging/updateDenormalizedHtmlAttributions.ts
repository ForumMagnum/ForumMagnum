import { Tags } from '../../lib/collections/tags/collection';
import { annotateAuthors } from '../attributeEdits';

export async function updateDenormalizedHtmlAttributions(tag: DbTag) {
  const html = await annotateAuthors(tag._id, "Tags", "description");
  await Tags.rawUpdateOne({_id: tag._id}, {$set: {
    htmlWithContributorAnnotations: html,
  }});
  return html;
}
