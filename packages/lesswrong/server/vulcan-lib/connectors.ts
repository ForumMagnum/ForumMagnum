import { Utils } from '../../lib/vulcan-lib/utils';

// convert GraphQL selector into Mongo-compatible selector
// TODO: add support for more than just documentId/_id and slug, potentially making conversion unnecessary
// see https://github.com/VulcanJS/Vulcan/issues/2000
const convertSelector = selector => {
  return selector;
};
const convertUniqueSelector = selector => {
  if (selector.documentId) {
    selector._id = selector.documentId;
    delete selector.documentId;
  }
  return selector;
};

export const Connectors = {
  get: async <T extends DbObject>(
    collection: CollectionBase<T>,
    selector: MongoSelector<T>|string = {},
    options: MongoFindOneOptions<T> = {},
    skipConversion?: boolean
  ): Promise<T|null> => {
    const convertedSelector = skipConversion ? selector : convertUniqueSelector(selector)
    return await collection.findOne(convertedSelector, options);
  },
  
  find: async <T extends DbObject>(
    collection: CollectionBase<T>,
    selector: MongoSelector<T> = {},
    options: MongoFindOptions<T> = {}
  ): Promise<Array<T>> => {
    return await collection.find(convertSelector(selector), options).fetch();
  },
  
  count: async <T extends DbObject>(
    collection: CollectionBase<T>,
    selector: MongoSelector<T> = {},
    options: MongoFindOptions<T> = {}
  ): Promise<number> => {
    return await collection.find(convertSelector(selector), options).count();
  },
  
  create: async <T extends DbObject>(
    collection: CollectionBase<T>,
    document: T,
    options: MongoInsertOptions<T> = {}
  ) => {
    return await collection.insert(document);
  },
  
  update: async <T extends DbObject>(
    collection: CollectionBase<T>,
    selector: MongoSelector<T>,
    modifier: MongoModifier<T>,
    options: MongoUpdateOptions<T> = {},
    skipConversion?: boolean
  ) => {
    const convertedSelector = skipConversion ? selector : convertUniqueSelector(selector)
    return await collection.update(convertedSelector, modifier, options);
  },
  
  delete: async <T extends DbObject>(
    collection: CollectionBase<T>,
    selector: MongoSelector<T>,
    options: MongoRemoveOptions<T> = {},
    skipConversion?: boolean
  ) => {
    const convertedSelector = skipConversion ? selector : convertUniqueSelector(selector)
    return await collection.remove(convertedSelector);
  },
}

Utils.Connectors = Connectors;
