import schema from '@/lib/collections/images/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

/// Images collection. Used for keeping track of images that we've re-hosted by downloading them and re-uploading them to Cloudinary. Used to avoid duplicate uploads, and maybe keeping track of some extra metadata.
export const Images = createCollection({
  collectionName: "Images",
  typeName: "Images",
  schema,
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Images', {identifier: 1});
    indexSet.addIndex('Images', {cdnHostedUrl: 1});
    return indexSet;
  },
});


export default Images;

