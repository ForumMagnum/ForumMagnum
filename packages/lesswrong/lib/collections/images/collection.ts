import { createCollection } from '../../vulcan-lib/collections';
import { universalFields } from '../../collectionUtils'
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

const schema: SchemaType<"Images"> = {
  ...universalFields({}),
  /** @deprecated Use identifier + identifierType = 'originalUrl' */
  originalUrl: {
    type: String,
    nullable: true,
  },
  identifier: {
    type: String,
    nullable: false,
  },
  identifierType: {
    type: String,
    allowedValues: ['sha256Hash', 'originalUrl'],
    nullable: false,
  },
  cdnHostedUrl: {
    type: String,
    nullable: false,
  },
};

/// Images collection. Used for keeping track of images that we've re-hosted by downloading them and re-uploading them to Cloudinary. Used to avoid duplicate uploads, and maybe keeping track of some extra metadata.
export const Images: ImagesCollection = createCollection({
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

