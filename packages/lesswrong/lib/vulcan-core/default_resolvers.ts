import { Utils, getTypeName, getCollection } from '../vulcan-lib';
import { restrictViewableFields } from '../vulcan-users/permissions';
import { asyncFilter } from '../utils/asyncUtils';
import { loggerConstructor, logGroupConstructor } from '../utils/logging';
import { describeTerms, viewTermsToQuery } from '../utils/viewUtils';
import type { DbTarget } from '../sql/PgCollection';

const maxAllowedSkip = 2000;

interface DefaultResolverOptions {
  cacheMaxAge: number
}

const defaultOptions: DefaultResolverOptions = {
  cacheMaxAge: 300,
};

// Default resolvers. Provides `single` and `multi` resolvers, which power the
// useSingle and useMulti hooks.
export function getDefaultResolvers<N extends CollectionNameString>(collectionName: N, options?: Partial<DefaultResolverOptions>) {
  type T = ObjectsByCollectionName[N]
  const typeName = getTypeName(collectionName);
  const resolverOptions = {...defaultOptions, options};
  
  return {
    // resolver for returning a list of documents based on a set of query terms

    multi: {
      description: `A list of ${typeName} documents matching a set of query terms`,

      async resolver(root: void, args: { input: {terms: ViewTermsBase, enableCache?: boolean, enableTotal?: boolean, createIfMissing?: Partial<T>} }, context: ResolverContext, { cacheControl }: AnyBecauseTodo) {
        const startResolve = Date.now()
        const input = args?.input || {};
        const { terms={}, enableCache = false, enableTotal = false } = input;
        const logger = loggerConstructor(`views-${collectionName.toLowerCase()}-${terms.view?.toLowerCase() ?? 'default'}`)
        logger('multi resolver()')
        logger('multi terms', terms)

        if (cacheControl && enableCache) {
          const maxAge = resolverOptions.cacheMaxAge || defaultOptions.cacheMaxAge;
          cacheControl.setCacheHint({ maxAge });
        }

        // get currentUser and Users collection from context
        const { currentUser }: {currentUser: DbUser|null} = context;

        // get collection based on collectionName argument
        const collection = getCollection(collectionName);

        // Get selector and options from terms and perform Mongo query
        // Downcasts terms because there are collection-specific terms but this function isn't collection-specific
        const parameters = viewTermsToQuery(collectionName, terms as any, {}, context);
        
        let docs: Array<T> = await performQueryFromViewParameters(collection, terms, parameters);

        // Create a doc if none exist, using the actual create mutation to ensure permission checks are run correctly
        if (input.createIfMissing && docs.length === 0) {
          await collection.options.mutations.create.mutation(root, {data: input.createIfMissing}, context)
          docs = await performQueryFromViewParameters(collection, terms, parameters);
        }
        
        // Were there enough results to reach the limit specified in the query?
        const saturated = parameters.options.limit && docs.length>=parameters.options.limit;
        
        // if collection has a checkAccess function defined, remove any documents that doesn't pass the check
        const viewableDocs: Array<T> = collection.checkAccess
          ? await asyncFilter(docs, async (doc: T) => await collection.checkAccess(currentUser, doc, context))
          : docs;

        // take the remaining documents and remove any fields that shouldn't be accessible
        const restrictedDocs = restrictViewableFields(currentUser, collection, viewableDocs);

        // prime the cache
        restrictedDocs.forEach((doc: AnyBecauseTodo) => context.loaders[collectionName].prime(doc._id, doc));

        const data: any = { results: restrictedDocs };

        if (enableTotal) {
          // get total count of documents matching the selector
          // TODO: Make this handle synthetic fields
          if (saturated) {
            const { hint } = parameters.options;
            data.totalCount = await Utils.Connectors.count(collection, parameters.selector, { hint });
          } else {
            data.totalCount = viewableDocs.length;
          }
        }
  
        const timeElapsed = Date.now() - startResolve;
        // Temporarily disabled to investigate performance issues
        // captureEvent("resolveMultiCompleted", {documentIds: restrictedDocs.map((d: DbObject) => d._id), collectionName, timeElapsed, terms}, true);
        // return results
        return data;
      },
    },

    // resolver for returning a single document queried based on id or slug

    single: {
      description: `A single ${typeName} document fetched by ID or slug`,

      async resolver(root: void, { input = {} }: {input:any}, context: ResolverContext, { cacheControl }: AnyBecauseTodo) {
        const startResolve = Date.now();
        const { enableCache = false, allowNull = false } = input;
        // In this context (for reasons I don't fully understand) selector is an object with a null prototype, i.e.
        // it has none of the methods you would usually associate with objects like `toString`. This causes various problems
        // down the line. See https://stackoverflow.com/questions/56298481/how-to-fix-object-null-prototype-title-product
        // So we copy it here to give it back those methoods
        const selector = {...(input.selector || {})}

        const logger = loggerConstructor(`resolvers-${collectionName.toLowerCase()}`)
        const {logGroupStart, logGroupEnd} = logGroupConstructor(`resolvers-${collectionName.toLowerCase()}`)
        logger('');
        logGroupStart(
          `--------------- start \x1b[35m${typeName} Single Resolver\x1b[0m ---------------`
        );
        logger(`Options: ${JSON.stringify(resolverOptions)}`);
        logger(`Selector: ${JSON.stringify(selector)}`);

        if (cacheControl && enableCache) {
          const maxAge = resolverOptions.cacheMaxAge || defaultOptions.cacheMaxAge;
          cacheControl.setCacheHint({ maxAge });
        }

        const { currentUser }: {currentUser: DbUser|null} = context;
        const collection = getCollection(collectionName);

        // use Dataloader if doc is selected by documentId/_id
        const documentId = selector.documentId || selector._id;
        const doc = documentId
          ? await context.loaders[collectionName].load(documentId)
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
          const reasonDenied = {reason:undefined};
          const canAccess = await collection.checkAccess(currentUser, doc, context, reasonDenied)
          if (!canAccess) {
            if (reasonDenied.reason) {
              Utils.throwError({
                id: reasonDenied.reason,
              });
            } else {
              Utils.throwError({
                id: 'app.operation_not_allowed',
                data: {documentId, operationName: `${typeName}.read.single`}
              });
            }
          }
        }

        const restrictedDoc = restrictViewableFields(currentUser, collection, doc);

        logGroupEnd();
        logger(`--------------- end \x1b[35m${typeName} Single Resolver\x1b[0m ---------------`);
        logger('');
        
        const timeElapsed = Date.now() - startResolve;
        // Temporarily disabled to investigate performance issues
        // captureEvent("resolveSingleCompleted", {documentId: restrictedDoc._id, collectionName, timeElapsed}, true);
        
        // filter out disallowed properties and return resulting document
        return { result: restrictedDoc };
      },
    },
  };
}

const performQueryFromViewParameters = async <T extends DbObject>(collection: CollectionBase<T>, terms: ViewTermsBase, parameters: any): Promise<Array<T>> => {
  const logger = loggerConstructor(`views-${collection.collectionName.toLowerCase()}`)
  const selector = parameters.selector;
  
  // Don't allow API requests with an offset provided >2000. This prevents some
  // extremely-slow queries.
  if (terms.offset && (terms.offset > maxAllowedSkip)) {
    throw new Error("Exceeded maximum value for skip");
  }
  
  const options = {
    ...parameters.options,
    skip: terms.offset,
  };
  if (parameters.syntheticFields && Object.keys(parameters.syntheticFields).length>0) {
    const pipeline = [
      // First stage: Filter by selector
      { $match: {
        ...selector,
        $comment: describeTerms(terms),
      }},
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
    logger('aggregation pipeline', pipeline);
    return await collection.aggregate(pipeline).toArray();
  } else {
    logger('performQueryFromViewParameters connector find', selector, terms, options);
    return await collection.find({
      ...selector,
      $comment: describeTerms(terms),
    }, options).fetch();
  }
}
