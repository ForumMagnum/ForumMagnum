import { loggerConstructor } from './logging'
import { DatabasePublicSetting } from '../publicSettings';
import * as _ from 'underscore';
import merge from 'lodash/merge';
import { viewFieldAllowAny, viewFieldNullOrMissing } from './viewConstants';
import type { CollectionViewSet } from '../views/collectionViewSet';

// 'Maximum documents per request'
const maxDocumentsPerRequestSetting = new DatabasePublicSetting<number>('maxDocumentsPerRequest', 5000)

/**
 * Given a view (which gets translated into a mongo query), provide a string
 * which describes what's being queried (ie the view name, and a list of
 * parameters that were attached, but not the values of those parameters). This
 * is attached to the mongodb query by putting a $comment in the selector, so
 * that when we see slow queries in the profiler, we can easily identify the
 * source.
 */
export function describeTerms(collectionName: CollectionNameString, terms: ViewTermsBase) {
  const viewName = terms.view || "defaultView";
  const otherTerms = Object.keys(terms).filter(key => key!=='view').join(',');
  if (otherTerms.length>0)
    return `${collectionName}.${viewName}(${otherTerms})`;
  else
    return `${collectionName}.${viewName}`;
}

/**
 * Given a set of terms describing a view, translate them into a mongodb selector
 * and options, which is ready to execute (but don't execute it yet).
 */
export function viewTermsToQuery<N extends CollectionNameString>(viewSet: CollectionViewSet<N, Record<string, ViewFunction<N>>>, terms: ViewTermsByCollectionName[N], apolloClient?: any, resolverContext?: ResolverContext) {
  return getParameters(viewSet, terms, apolloClient, resolverContext);
}

/**
 * Return the default selector for a given collection. This is generally a filter
 * which handles things like soft deletion, hidden drafts, etc; if you're building
 * a query that doesn't pass through the views system, you probably want to use
 * this selector as a starting point.
 */
export function getDefaultViewSelector<N extends CollectionNameString>(viewSet: CollectionViewSet<N, Record<string, ViewFunction<N>>>) {
  // Downcast the generic to avoid a very expensive but useless type inference that indexes over all view terms by collection
  const viewQuery = viewTermsToQuery<CollectionNameString>(viewSet, {})
  return replaceSpecialFieldSelectors(viewQuery.selector);
}

/**
 * Given a set of terms describing a view, translate them into a mongodb selector
 * and options, which is ready to execute (but don't execute it yet).
 */
function getParameters<N extends CollectionNameString>(
  viewSet: CollectionViewSet<N, Record<string, ViewFunction<N>>>,
  terms: ViewTermsByCollectionName[N],
  apolloClient?: any,
  context?: ResolverContext
): MergedViewQueryAndOptions<ObjectsByCollectionName[N]> {
  const logger = loggerConstructor(`views-${viewSet.collectionName.toLowerCase()}-${terms.view?.toLowerCase() ?? 'default'}`)
  logger('getParameters(), terms:', terms);

  let parameters: any = {
    selector: {},
    options: {},
  };

  const defaultView = viewSet.getDefaultView();

  if (defaultView) {
    const defaultParameters = defaultView(terms, apolloClient, context);
    const newSelector = mergeSelectors(parameters.selector, defaultParameters.selector);
    parameters = {
      ...merge(parameters, defaultParameters),
      selector: newSelector,
    }
    logger('getParameters(), parameters after defaultView:', parameters)
  }


  // handle view option
  if (terms.view && viewSet.getView(terms.view)) {
    const viewFn = viewSet.getView(terms.view)!;
    const view = viewFn(terms, apolloClient, context);
    let mergedParameters = mergeSelectors(parameters, view);

    if (
      mergedParameters.options &&
      mergedParameters.options.sort &&
      view.options &&
      view.options.sort
    ) {
      // If both the default view and the selected view have sort options,
      // don't merge them together; take the selected view's sort. (Otherwise
      // they merge in the wrong order, so that the default-view's sort takes
      // precedence over the selected view's sort.)
      mergedParameters.options.sort = view.options.sort;
    }
    parameters = mergedParameters;
    logger('getParameters(), parameters after defaultView and view:', parameters)
  }

  // sort using terms.orderBy (overwrite defaultView's sort)
  if (terms.orderBy && !_.isEmpty(terms.orderBy)) {
    parameters.options.sort = terms.orderBy;
  }

  // if there is no sort, default to sorting by createdAt descending
  if (!parameters.options.sort) {
    parameters.options.sort = { createdAt: -1 } as any;
  }

  // extend sort to sort posts by _id to break ties, unless there's already an id sort
  // NOTE: always do this last to avoid overriding another sort
  if (!(parameters.options.sort && typeof parameters.options.sort._id !== 'undefined')) {
    parameters = merge(parameters, { options: { sort: { _id: -1 } } });
  }

  // remove any null fields (setting a field to null means it should be deleted)
  parameters.selector = replaceSpecialFieldSelectors(parameters.selector);
  if (parameters.options.sort) {
    _.keys(parameters.options.sort).forEach(key => {
      if (parameters.options.sort[key] === null) {
        delete parameters.options.sort[key];
      }
    });
  }

  // limit number of items to 1000 by default
  const maxDocuments = maxDocumentsPerRequestSetting.get();
  const limit = terms.limit || parameters.options.limit;
  parameters.options.limit = !limit || limit < 1 || limit > maxDocuments ? maxDocuments : limit;

  logger('getParameters(), final parameters:', parameters);
  return parameters;
}

/**
 * Take a selector, which is a mongodb selector except that some fields may be
 * the special values `viewFieldNullOrMissing` or `viewFieldAllowAny`, and turn
 * it into a mongodb selector without those special cases. (These special-case
 * values exist to support merging a specific-view selector with a default view;
 * in that context, the specific-view needs something other than `undefined` to
 * replace the default-view's constraint with.)
 */
export function replaceSpecialFieldSelectors(selector: any): any {
  let result: any = {};
  for (let key of Object.keys(selector)) {
    if (_.isEqual(selector[key], viewFieldNullOrMissing)) {
      // Put an explicit null in the selector. In mongodb-query terms, this means
      // the field must either contain the value null, or be missing.
      result[key] = null;
    } else if (_.isEqual(selector[key], viewFieldAllowAny)) {
      // Skip: The selector has a no-op in this field. Probably a specific view
      // overriding something that would have been in the default view.
    } else if (selector[key] === null || selector[key] === undefined) {
      // Skip: null is like viewFieldAllowAny.
    } else {
      // Anything else, copy the selector
      result[key] = selector[key];
    }
  }
  return result;
}

const removeAndOr = <T extends DbObject>(selector: MongoSelector<T>) => {
  const copy = {...selector}
  delete copy.$and
  delete copy.$or
  return copy
}

const mergeTwoSelectors = <T extends DbObject>(
  baseSelector?: MongoSelector<T>,
  newSelector?: MongoSelector<T>,
) => {
  if (!baseSelector) return newSelector;
  if (!newSelector) return baseSelector;

  // Remove $ands and $ors before merging, and then add them back in with the correct logic
  let mergedSelector = merge(removeAndOr(baseSelector), removeAndOr(newSelector));
  if ("$and" in baseSelector || "$and" in newSelector) {
    mergedSelector = {
      ...mergedSelector,
      $and: [...(baseSelector.$and ?? []), ...(newSelector.$and ?? [])]
    }
  }
  if ("$or" in baseSelector || "$or" in newSelector) {
    mergedSelector = {
      ...mergedSelector,
      $and: [...(baseSelector.$or ? [{$or: baseSelector.$or}] : []), ...(newSelector.$or ? [{$or: newSelector.$or}] : []), ...(mergedSelector.$and ?? [])]
    }
  }
  return mergedSelector;
}

/**
 * Merge selectors, with special handling for $and and $or. NB: Not yet
 * completely recursive, so while it will do a deep merge of your selectors,
 * $and and $or will only be merged at the top level.
 */
export const mergeSelectors = <T extends DbObject>(
  ...selectors: Array<MongoSelector<T> | undefined>
) => selectors.reduce(
  (mergedSelector, nextSelector) => mergeTwoSelectors(mergedSelector, nextSelector),
  undefined
);
