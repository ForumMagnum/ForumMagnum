import _ from 'underscore';
import { accessFilterMultiple } from '../../lib/utils/schemaUtils';
import { getDefaultViewSelector, mergeSelectors, mergeWithDefaultViewSelector, replaceSpecialFieldSelectors } from '../../lib/utils/viewUtils';
import { filterNonnull } from '@/lib/utils/typeGuardUtils';
import { FieldChanges } from '@/server/collections/fieldChanges/collection';
import gql from 'graphql-tag';
import { allViews } from '@/lib/views/allViews';
import { CollectionViewSet } from '@/lib/views/collectionViewSet';

type FeedSubquery<ResultType extends {}, SortKeyType> = {
  type: string,
  getSortKey: (item: ResultType) => SortKeyType,
  isNumericallyPositioned?: boolean,
  doQuery: (limit: number, cutoff?: SortKeyType) => Promise<Partial<ResultType>[]>,
}

export type SortDirection = "asc" | "desc";

export type SubquerySortField<ResultType extends DbObject, SortFieldName extends keyof ResultType> = {
  sortField: SortFieldName,
  sortDirection?: SortDirection,
}

type Sortable<SortKey extends number | Date> = { sortKey: SortKey };

type ViewBasedSubqueryProps<
  N extends CollectionNameString,
  SortFieldName extends keyof ObjectsByCollectionName[N]
> = {
  type: string,
  collection: CollectionBase<N>,
  context: ResolverContext,
  selector: MongoSelector<ObjectsByCollectionName[N]>,
  includeDefaultSelector: boolean,
  sticky?: boolean,
} & SubquerySortField<ObjectsByCollectionName[N], SortFieldName>;

export function viewBasedSubquery<
  N extends CollectionNameString,
  SortKeyType,
  SortFieldName extends keyof ObjectsByCollectionName[N]
>(props: ViewBasedSubqueryProps<N, SortFieldName>): FeedSubquery<ObjectsByCollectionName[N], SortKeyType> {
  const {type, collection, context, selector, includeDefaultSelector, sticky, sortField, sortDirection="desc"} = props;
  return {
    type,
    getSortKey: (item: ObjectsByCollectionName[N]) => item[props.sortField] as unknown as SortKeyType,
    isNumericallyPositioned: !!sticky,
    doQuery: async (limit: number, cutoff: SortKeyType): Promise<Partial<ObjectsByCollectionName[N]>[]> => {
      const selectorWithDefaults = includeDefaultSelector
        ? mergeWithDefaultViewSelector(collection.collectionName, selector)
        : selector;
      const results = await queryWithCutoff({context, collection, selector, limit, cutoffField: sortField, cutoff, sortDirection});
      return await accessFilterMultiple(context.currentUser, collection.collectionName, results, context);
    }
  };
}

export function fieldChangesSubquery<N extends CollectionNameString>({type, collection, context, documentIds, fieldNames}: {
  type: string,
  collection: CollectionBase<N>,
  context: ResolverContext,
  documentIds: string[],
  fieldNames: Array<keyof ObjectsByCollectionName[N]>
}) {
  return {
    type,
    getSortKey: (item: DbFieldChange): Date => item.createdAt,
    doQuery: async (limit: number, cutoff: Date|null): Promise<DbFieldChange[]> => {
      return await queryWithCutoff({
        context,
        collection: FieldChanges,
        selector: {
          documentId: {$in: documentIds},
          fieldName: {$in: fieldNames},
        },
        limit, cutoff,
        cutoffField: "createdAt",
        sortDirection: "desc",
      });
    },
  };
}

export function fixedResultSubquery<ResultType extends DbObject, SortKeyType>({type, result, sortKey}: {
  type: string,
  result: Partial<ResultType>,
  sortKey: SortKeyType,
}): FeedSubquery<ResultType, SortKeyType> {
  return {
    type,
    getSortKey: (_item: ResultType): SortKeyType => sortKey,
    doQuery: async (_limit: number, _cutoff: SortKeyType): Promise<Partial<ResultType>[]> => {
      return [result];
    }
  };
}

export function fixedIndexSubquery<ResultType extends DbObject>({type, index, result}: {
  type: string,
  index: number,
  result: any,
}): FeedSubquery<ResultType, number> {
  return {
    type,
    getSortKey: () => index,
    isNumericallyPositioned: true,
    doQuery: async () => [result],
  };
}

const applyCutoff = <T extends Sortable<SortKeyType>, SortKeyType extends number | Date>(
  sortedResults: T[],
  cutoff: SortKeyType,
  sortDirection: SortDirection,
) => {
  const cutoffFilter = sortDirection === "asc"
    ? ({sortKey}: { sortKey: SortKeyType }) => sortKey > cutoff
    : ({sortKey}: { sortKey: SortKeyType }) => sortKey < cutoff;
  return _.filter<T>(sortedResults, cutoffFilter);
}

export async function mergeFeedQueries<SortKeyType extends number | Date>({limit, cutoff, offset, sortDirection, subqueries}: {
  limit: number
  cutoff?: SortKeyType,
  offset?: number,
  sortDirection?: SortDirection,
  subqueries: Array<FeedSubquery<{}, any>|null>,
}) {
  sortDirection ??= "desc";

  // Perform the subqueries
  const unsortedSubqueryResults = await Promise.all(
    filterNonnull(subqueries).map(async (subquery) => {
      const subqueryResults = await subquery.doQuery(limit, cutoff)
      return subqueryResults.map((result: DbObject) => ({
        type: subquery.type,
        sortKey: subquery.getSortKey(result),
        isNumericallyPositioned: subquery.isNumericallyPositioned,
        [subquery.type]: result,
      }))
    })
  );
  
  // Merge the result lists
  const unsortedResults = unsortedSubqueryResults.flat();
  
  // Split into results with numeric indexes and results with sort-key indexes
  const [
    numericallyPositionedResults,
    orderedResults,
  ] = _.partition(unsortedResults, ({isNumericallyPositioned}) => !!isNumericallyPositioned);
  
  // Sort by shared sort key
  const sortedResults = _.sortBy(orderedResults, r=>r.sortKey);
  if (sortDirection === "desc") {
    sortedResults.reverse();
  }
  
  // Apply cutoff
  const withCutoffApplied = cutoff
    ? applyCutoff(sortedResults, cutoff, sortDirection)
    : sortedResults;
  
  // Merge in the numerically positioned results
  const bothResultKinds = mergeSortedAndNumericallyPositionedResults(withCutoffApplied, numericallyPositionedResults, offset||0);
  
  // Apply limit
  const withLimitApplied = _.first(bothResultKinds, limit);
  
  // Find the last result that wasn't numerically positioned (after the limit
  // is applied), and get its sortKey to use as the page cutoff
  const nonNumericallyPositionedResults = _.filter(withLimitApplied, r => !_.some(numericallyPositionedResults, r2=>r===r2)) as Sortable<SortKeyType>[];
  const nextCutoff = (nonNumericallyPositionedResults.length>0) ? nonNumericallyPositionedResults[nonNumericallyPositionedResults.length-1].sortKey : null;
  
  return {
    results: withLimitApplied,
    cutoff: nextCutoff,
    endOffset: (offset||0)+withLimitApplied.length
  };
}

// Take a list of results that are sorted by a sort key (ie a date), and a list
// of results that have numeric indexes instead, and merge them. Eg, Recent
// Discussion contains posts sorted by date, but with some things mixed in
// with their position defined as "index 5".
function mergeSortedAndNumericallyPositionedResults<D extends Sortable<Date>, N extends Sortable<number>>(sortedResults: Array<D>, numericallyPositionedResults: Array<N>, offset: number) {
  // Take the numerically positioned results. Sort them by index, discard ones
  // from below the offset, and resolve collisions.
  const sortedNumericallyPositionedResults = _.sortBy(numericallyPositionedResults, r=>r.sortKey);
  
  let mergedResults: (D|N)[] = [...sortedResults];
  for (let i=0; i<sortedNumericallyPositionedResults.length; i++) {
    const insertedResult = sortedNumericallyPositionedResults[i];
    const insertionPosition = insertedResult.sortKey-offset;
    
    if (insertionPosition >= 0) {
      if (insertionPosition < mergedResults.length) {
        mergedResults.splice(insertionPosition, 0, insertedResult);
      } else {
        mergedResults.push(insertedResult);
      }
    }
  }
  
  return mergedResults;
}

async function queryWithCutoff<N extends CollectionNameString>({
  context, collection, selector, limit, cutoffField, cutoff, sortDirection,
}: {
  context: ResolverContext,
  collection: CollectionBase<N>,
  selector: MongoSelector<ObjectsByCollectionName[N]>,
  limit: number,
  cutoffField: keyof ObjectsByCollectionName[N],
  cutoff: any,
  sortDirection: SortDirection,
}) {
  const collectionName = collection.collectionName;

  const sort = {[cutoffField]: sortDirection === "asc" ? 1 : -1, _id: 1};
  const cutoffSelector = cutoff
    ? {[cutoffField]: {[sortDirection === "asc" ? "$gt" : "$lt"]: cutoff}}
    : {};

  // TODO: figure out how to get the appropriate collection's default view piped through here without going through allViews, if possible
  const viewSet: CollectionViewSet<CollectionNameString, any> = allViews[collectionName];
  const mergedSelector = mergeSelectors(
    getDefaultViewSelector(viewSet),
    selector,
    cutoffSelector
  )
  const finalizedSelector = replaceSpecialFieldSelectors(mergedSelector);
  const resultsRaw = await collection.find(finalizedSelector, {
    sort: sort as Partial<Record<keyof ObjectsByCollectionName[N], number>>,
    limit,
  }).fetch();

  return resultsRaw;
}
