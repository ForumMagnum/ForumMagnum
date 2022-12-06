import { createCollection } from '../../vulcan-lib';
import { addUniversalFields } from '../../collectionUtils'
import { ensureIndex } from '../../collectionIndexUtils';

const schema: SchemaType<DbTagFlag> = {
  prompt: {
    type: String,
  },
  model: {
    type: String,
  },
  result: {
    type: String,
  },
}

export const LanguageModelCache: LanguageModelCacheCollection = createCollection({
  collectionName: 'LanguageModelCache',
  typeName: 'LanguageModelCache',
  schema,
  logChanges: false,
});

addUniversalFields({
  collection: LanguageModelCache,
});

ensureIndex(LanguageModelCache, {model:1, prompt:1, _id:1});

export default LanguageModelCache;
