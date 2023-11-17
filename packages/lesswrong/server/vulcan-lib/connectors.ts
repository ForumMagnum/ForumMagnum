import { Utils } from '../../lib/vulcan-lib/utils';
import { loggerConstructor } from '../../lib/utils/logging';

//
// Connectors: A set of wrappers around mongodb collection operators.
// DEPRECATED. These originate in Vulcan, and they have a major pitfall.
// At some point, Vulcan decided that `documentId` should be usable as a
// synonym for `_id`, in utility functions and in the graphql API. But we were
// already using `documentId` extensively as an actual field name (for foreign-
// key fields), so this doesn't work at all, and it created a big mess.
//
// Usages of `Connectors` should be replaced with either `collection.someMongoFunction`
// after verifying that they are not relying on the `documentId` translation
// behavior.
//

// convert GraphQL selector into Mongo-compatible selector
// TODO: add support for more than just documentId/_id and slug, potentially making conversion unnecessary
// see https://github.com/VulcanJS/Vulcan/issues/2000
const convertSelector = (selector: any) => {
  return selector;
};
const convertUniqueSelector = (selector: any) => {
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
    const logger = loggerConstructor(`db-${collection.collectionName.toLowerCase()}-get`)
    logger('---------->')
    logger('selector', selector)
    logger('options', options)
    const convertedSelector = skipConversion ? selector : convertUniqueSelector(selector)
    const result = await collection.findOne(convertedSelector, options);
    logger('result', result)
    logger('---<')
    return result
  },
  
  find: async <T extends DbObject>(
    collection: CollectionBase<T>,
    selector: MongoSelector<T> = {},
    options: MongoFindOptions<T> = {}
  ): Promise<Array<T>> => {
    const logger = loggerConstructor(`db-${collection.collectionName.toLowerCase()}-find`)
    logger('---------->')
    logger('selector', selector)
    logger('options', options)
    const result = await collection.find(convertSelector(selector), options).fetch();
    // logger('result', result)
    logger('result.length', result.length)
    logger('---<')
    return result
  },
  
  count: async <T extends DbObject>(
    collection: CollectionBase<T>,
    selector: MongoSelector<T> = {},
    options: MongoFindOptions<T> = {}
  ): Promise<number> => {
    const logger = loggerConstructor(`db-${collection.collectionName.toLowerCase()}-count`)
    logger('---------->')
    logger('selector', selector)
    logger('options', options)
    const result = await collection.find(convertSelector(selector), options).count();
    logger('result', result)
    logger('---<')
    return result
  },
  
  create: async <T extends DbObject>(
    collection: CollectionBase<T>,
    document: T,
    options: MongoInsertOptions<T> = {}
  ) => {
    const logger = loggerConstructor(`db-${collection.collectionName.toLowerCase()}-create`)
    logger('---------->')
    logger('document', document)
    logger('options', options)
    const result = await collection.rawInsert(document);
    logger('result', result)
    logger('---<')
    return result
  },
  
  updateOne: async <T extends DbObject>(
    collection: CollectionBase<T>,
    selector: MongoSelector<T>,
    modifier: MongoModifier<T>,
    options: MongoUpdateOptions<T> = {},
    skipConversion?: boolean
  ) => {
    const logger = loggerConstructor(`db-${collection.collectionName.toLowerCase()}-update`)
    logger('---------->')
    logger('selector', selector)
    logger('modifier', modifier)
    logger('options', options)
    const convertedSelector = skipConversion ? selector : convertUniqueSelector(selector)
    const result = await collection.rawUpdateOne(convertedSelector, modifier, options);
    logger('result', result)
    logger('---<')
    return result
  },
  
  delete: async <T extends DbObject>(
    collection: CollectionBase<T>,
    selector: MongoSelector<T>,
    options: MongoRemoveOptions<T> = {},
    skipConversion?: boolean
  ) => {
    const logger = loggerConstructor(`db-${collection.collectionName.toLowerCase()}-delete`)
    logger('---------->')
    logger('selector', selector)
    logger('options', options)
    const convertedSelector = skipConversion ? selector : convertUniqueSelector(selector)
    const result = await collection.rawRemove(convertedSelector);
    logger('result', result)
    logger('---<')
    return result
  },
}

Utils.Connectors = Connectors;
