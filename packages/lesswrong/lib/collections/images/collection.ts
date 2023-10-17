import { createCollection } from '../../vulcan-lib';
import { addUniversalFields } from '../../collectionUtils'
import { ensureIndex } from '../../collectionIndexUtils';

const schema: SchemaType<DbImages> = {
  originalUrl: {
    type: String,
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
  collectionType: 'pg',
  schema,
});
addUniversalFields({collection: Images});

ensureIndex(Images, {originalUrl: 1});
ensureIndex(Images, {cdnHostedUrl: 1});

export default Images;

