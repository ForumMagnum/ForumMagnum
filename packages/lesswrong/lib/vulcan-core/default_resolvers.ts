/*

Default list, single, and total resolvers

*/

import { Utils, debug, debugGroup, debugGroupEnd, getTypeName, getCollectionName, } from '../vulcan-lib';
import Users from '../collections/users/collection'
import { asyncFilter } from '../utils/asyncUtils';

const defaultOptions = {
  cacheMaxAge: 300,
};

// note: for some reason changing resolverOptions to "options" throws error
export function getDefaultResolvers<T extends DbObject>(options) {
  let typeName, collectionName, resolverOptions;
  if (typeof arguments[0] === 'object') {
    // new single-argument API
    typeName = arguments[0].typeName;
    collectionName = arguments[0].collectionName || getCollectionName(typeName);
    resolverOptions = { ...defaultOptions, ...arguments[0].options };
  } else {
    // OpenCRUD backwards compatibility
    collectionName = arguments[0];
    typeName = getTypeName(collectionName);
    resolverOptions = { ...defaultOptions, ...arguments[1] };
  }

  return {
    // resolver for returning a list of documents based on a set of query terms

    multi: {
      description: `A list of ${typeName} documents matching a set of query terms`,

      async resolver(root, { input = {} }, context: ResolverContext, { cacheControl }) {
        const { terms = {}, enableCache = false, enableTotal = false } = input as any; //LESSWRONG: enableTotal defaults false

        if (cacheControl && enableCache) {
          const maxAge = resolverOptions.cacheMaxAge || defaultOptions.cacheMaxAge;
          cacheControl.setCacheHint({ maxAge });
        }

        // get currentUser and Users collection from context
        const { currentUser }: {currentUser: DbUser|null} = context;

        // get collection based on collectionName argument
        const collection: CollectionBase<T> = context[collectionName];

        // get selector and options from terms and perform Mongo query
        const parameters = await collection.getParameters(terms, {}, context);
        
        const docs: Array<T> = await queryFromViewParameters(collection, terms, parameters);
        
        // Were there enough results to reach the limit specified in the query?
        const saturated = parameters.options.limit && docs.length>=parameters.options.limit;
        
        // if collection has a checkAccess function defined, remove any documents that doesn't pass the check
        const viewableDocs: Array<T> = collection.checkAccess
          ? await asyncFilter(docs, async (doc: T) => await collection.checkAccess(currentUser, doc, context))
          : docs;

        // take the remaining documents and remove any fields that shouldn't be accessible
        const restrictedDocs = Users.restrictViewableFields(currentUser, collection, viewableDocs);

        // prime the cache
        restrictedDocs.forEach(doc => collection.loader.prime(doc._id, doc));

        const data: any = { results: restrictedDocs };

        if (enableTotal) {
          // get total count of documents matching the selector
          // TODO: Make this handle synthetic fields
          if (saturated) {
            data.totalCount = await Utils.Connectors.count(collection, parameters.selector);
          } else {
            data.totalCount = viewableDocs.length;
          }
        }

        // return results
        return data;
      },
    },

    // resolver for returning a single document queried based on id or slug

    single: {
      description: `A single ${typeName} document fetched by ID or slug`,

      async resolver(root, { input = {} }, context: ResolverContext, { cacheControl }) {
        const { selector = {}, enableCache = false, allowNull = false } = input as any;

        debug('');
        debugGroup(
          `--------------- start \x1b[35m${typeName} Single Resolver\x1b[0m ---------------`
        );
        debug(`Options: ${JSON.stringify(resolverOptions)}`);
        debug(`Selector: ${JSON.stringify(selector)}`);

        if (cacheControl && enableCache) {
          const maxAge = resolverOptions.cacheMaxAge || defaultOptions.cacheMaxAge;
          cacheControl.setCacheHint({ maxAge });
        }

        const { currentUser }: {currentUser: DbUser|null} = context;
        const collection: CollectionBase<T> = context[collectionName];

        // use Dataloader if doc is selected by documentId/_id
        const documentId = selector.documentId || selector._id;
        const doc = documentId
          ? await collection.loader.load(documentId)
          : await Utils.Connectors.get(collection, selector);

        if (!doc) {
          if (allowNull) {
            return { result: null };
          } else {
            Utils.throwError({
              id: 'app.missing_document',
              data: { documentId, selector, collectionName: collection.collectionName },
            });
          }
        }

        // if collection has a checkAccess function defined, use it to perform a check on the current document
        // (will throw an error if check doesn't pass)
        if (collection.checkAccess) {
          await Utils.performCheck(
            collection.checkAccess,
            currentUser,
            doc,
            
            context,
            documentId,
            `${typeName}.read.single`,
            collectionName
          );
        }

        const restrictedDoc = Users.restrictViewableFields(currentUser, collection, doc);

        debugGroupEnd();
        debug(`--------------- end \x1b[35m${typeName} Single Resolver\x1b[0m ---------------`);
        debug('');

        // filter out disallowed properties and return resulting document
        return { result: restrictedDoc };
      },
    },
  };
}

const queryFromViewParameters = async <T extends DbObject>(collection: CollectionBase<T>, terms: any, parameters: any): Promise<Array<T>> => {
  const selector = parameters.selector;
  const options = {
    ...parameters.options,
    skip: terms.offset,
  };

  if (parameters.syntheticFields && Object.keys(parameters.syntheticFields).length>0) {
    const pipeline = [
      // First stage: Filter by selector
      { $match: selector },
      // Second stage: Add computed fields
      { $addFields: parameters.syntheticFields },
      
      // Third stage: Filter by computed fields (if applicable)
      ...(parameters.syntheticFieldSelector || []),
      
      // Fourth stage: Sort
      { $sort: parameters.options.sort },
    ];
    
    // Apply skip and limit (if applicable)
    if (parameters.options.skip) {
      pipeline.push({ $skip: parameters.options.skip });
    }
    if (parameters.options.limit) {
      pipeline.push({ $limit: parameters.options.limit });
    }
    return await collection.rawCollection().aggregate(pipeline).toArray();
  } else {
    return await Utils.Connectors.find(collection, selector, options);
  }
}
