import { TagFlags } from '../../lib/collections/tagFlags/collection';
import { augmentFieldsDict } from '../utils/serverSchemaUtils';
import { getUnusedSlugByCollectionName } from '../utils/slugUtils';
import { slugify } from '../../lib/vulcan-lib/utils';

augmentFieldsDict(TagFlags, {
  slug: {
    onInsert: async (tagFlag) => {
      return await getUnusedSlugByCollectionName("TagFlags", slugify(tagFlag.name))
    },
    onEdit: async (modifier, tagFlag) => {
      if (modifier.$set.name) {
        return await getUnusedSlugByCollectionName("TagFlags", slugify(modifier.$set.name), false, tagFlag._id)
      }
    }
  },
});
