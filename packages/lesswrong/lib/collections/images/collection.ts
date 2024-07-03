import { createCollection } from '../../vulcan-lib';
import { addUniversalFields } from '../../collectionUtils'
import { ensureIndex } from '../../collectionIndexUtils';

const schema: SchemaType<"Images"> = {
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
});
addUniversalFields({collection: Images});

ensureIndex(Images, {identifier: 1});
ensureIndex(Images, {cdnHostedUrl: 1});

export default Images;

